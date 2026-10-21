import ts from 'typescript';
import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import { readFileSync, existsSync } from 'node:fs';
import { loadEnvFile } from 'node:process';
import pg from 'pg';
import { seedDatabase } from './seed-data.mjs';
if (existsSync('.env.local')) loadEnvFile('.env.local');
if (!process.env.MIGRATION_DATABASE_URL)
  throw new Error('MIGRATION_DATABASE_URL is required.');
const client = new pg.Client({
  connectionString: process.env.MIGRATION_DATABASE_URL,
  connectionTimeoutMillis: 5000,
});
const schema = `oz_test_${randomUUID().replaceAll('-', '')}`;
let created = false;
async function rejectsSql(sql, params, code) {
  await client.query('BEGIN');
  try {
    await assert.rejects(
      client.query(sql, params),
      (error) => error.code === code,
    );
  } finally {
    await client.query('ROLLBACK');
  }
}
try {
  await client.connect();
  await client.query(`CREATE SCHEMA "${schema}"`);
  created = true;
  await client.query(`SET search_path TO "${schema}"`);
  await client.query(
    readFileSync(
      new URL(
        '../prisma/migrations/20261021000000_project_foundation/migration.sql',
        import.meta.url,
      ),
      'utf8',
    ),
  );
  await client.query(
    'INSERT INTO "CommonCodeGroup" (key,"nameKo","nameEn","updatedAt") VALUES ($1,$2,$3,now())',
    ['PROJECT_ORIGIN', '작업 구분', 'Origin'],
  );
  await client.query(
    'INSERT INTO "CommonCode" ("groupKey",code,"nameKo","nameEn","updatedAt") VALUES ($1,$2,$3,$4,now())',
    ['PROJECT_ORIGIN', 'personal', '개인', 'Personal'],
  );
  const legacyId = randomUUID();
  await client.query(
    'INSERT INTO "Project" (id,slug,"originCode","updatedAt") VALUES ($1,$2,$3,now())',
    [legacyId, 'migration-check', 'personal'],
  );
  for (const [locale, title] of [
    ['ko', '보존할 원문'],
    ['en', 'English copy'],
  ]) {
    await client.query(
      'INSERT INTO "ProjectTranslation" ("projectId",locale,title,summary,body) VALUES ($1,$2,$3,$4,$5)',
      [
        legacyId,
        locale,
        title,
        '요약',
        JSON.stringify({ type: 'doc', content: [] }),
      ],
    );
  }
  await client.query(
    readFileSync(
      new URL(
        '../prisma/migrations/20261021010000_project_original_content/migration.sql',
        import.meta.url,
      ),
      'utf8',
    ),
  );
  const migrated = (
    await client.query('SELECT title,summary,body FROM "Project" WHERE id=$1', [
      legacyId,
    ])
  ).rows[0];
  assert.deepEqual(migrated, {
    title: '보존할 원문',
    summary: '요약',
    body: { type: 'doc', content: [] },
  });
  assert.equal(
    (
      await client.query(
        `SELECT to_regclass('"ProjectTranslation"') AS table_name`,
      )
    ).rows[0].table_name,
    null,
  );
  await client.query(
    readFileSync(
      new URL(
        '../prisma/migrations/20261021020000_project_bilingual_content/migration.sql',
        import.meta.url,
      ),
      'utf8',
    ),
  );
  assert.deepEqual(
    (
      await client.query(
        'SELECT title,summary,body FROM "ProjectTranslation" WHERE "projectId"=$1 AND locale=$2',
        [legacyId, 'ko'],
      )
    ).rows[0],
    migrated,
  );
  await client.query('DELETE FROM "Project" WHERE id=$1', [legacyId]);
  assert.equal(await seedDatabase(client), 8);
  assert.equal(await seedDatabase(client), 0);
  assert.equal(
    Number(
      (await client.query('SELECT count(*) FROM "Project"')).rows[0].count,
    ),
    8,
  );
  assert.equal(
    Number(
      (await client.query('SELECT count(*) FROM "ProjectTranslation"')).rows[0]
        .count,
    ),
    16,
  );
  await client.query(
    'UPDATE "ProjectTranslation" SET title=$1 WHERE locale=$2',
    ['Edited English', 'en'],
  );
  await seedDatabase(client);
  assert.equal(
    Number(
      (
        await client.query(
          'SELECT count(*) FROM "ProjectTranslation" WHERE title=$1',
          ['Edited English'],
        )
      ).rows[0].count,
    ),
    8,
  );
  const project = (
    await client.query('SELECT id FROM "Project" ORDER BY position LIMIT 1')
  ).rows[0];
  await client.query(
    readFileSync(
      new URL(
        '../prisma/migrations/20261021030000_project_thumbnail_url/migration.sql',
        import.meta.url,
      ),
      'utf8',
    ),
  );
  await client.query(
    readFileSync(
      new URL(
        '../prisma/migrations/20261022000000_project_customer_soft_delete/migration.sql',
        import.meta.url,
      ),
      'utf8',
    ),
  );
  const { outputText } = ts.transpileModule(
    readFileSync(
      new URL('../src/server/services/projects.ts', import.meta.url),
      'utf8',
    ),
    { compilerOptions: { module: ts.ModuleKind.CommonJS } },
  );
  const service = {};
  new Function('require', 'exports', 'process', outputText)(
    (id) => {
      if (id === 'server-only') return {};
      if (id === 'react') return { cache: (fn) => fn };
      if (id === '@/server/db')
        return { pool: { query: (...args) => client.query(...args) } };
      if (id === 'pg')
        return {
          default: {
            Pool: class {
              query(...args) {
                return client.query(...args);
              }
            },
          },
        };
      throw new Error('Unexpected project service dependency');
    },
    service,
    { env: { DATABASE_URL: 'configured-for-test' } },
  );
  await client.query('BEGIN');
  try {
    await client.query('UPDATE "Project" SET slug=$1 WHERE id=$2', [
      'db-only-project',
      project.id,
    ]);
    let publicProjects = await service.getPublicProjects('en');
    assert.ok(
      publicProjects.some(
        (p) => p.slug === 'db-only-project' && p.title === 'Edited English',
      ),
    );
    await client.query(
      'DELETE FROM "ProjectTranslation" WHERE "projectId"=$1 AND locale=$2',
      [project.id, 'en'],
    );
    publicProjects = await service.getPublicProjects('en');
    assert.equal(
      publicProjects.find((p) => p.slug === 'db-only-project').contentLocale,
      'ko',
    );
    await client.query('UPDATE "Project" SET visibility=$1 WHERE id=$2', [
      'PRIVATE',
      project.id,
    ]);
    assert.ok(
      !(await service.getPublicProjects('ko')).some(
        (p) => p.slug === 'db-only-project',
      ),
    );
  } finally {
    await client.query('ROLLBACK');
  }
  await rejectsSql(
    'UPDATE "Project" SET "originGroup"=$1,"originCode"=$2 WHERE id=$3',
    ['PROJECT_TYPE', 'website', project.id],
    '23514',
  );
  await rejectsSql(
    'UPDATE "Project" SET "originCode"=$1 WHERE id=$2',
    ['missing', project.id],
    '23503',
  );
  await rejectsSql(
    'UPDATE "Project" SET "startedOn"=$1,"endedOn"=$2 WHERE id=$3',
    ['2026-10-21', '2026-10-20', project.id],
    '23514',
  );
  await rejectsSql(
    'UPDATE "ProjectTranslation" SET body=$1 WHERE "projectId"=$2',
    ['{}', project.id],
    '23514',
  );
  await rejectsSql(
    'DELETE FROM "CommonCode" WHERE "groupKey"=$1 AND code=$2',
    ['PROJECT_ORIGIN', 'personal'],
    '23503',
  );
  await rejectsSql(
    'UPDATE "ProjectTranslation" SET locale=$1 WHERE "projectId"=$2 AND locale=$3',
    ['ja', project.id, 'en'],
    '23514',
  );
  await rejectsSql(
    'INSERT INTO "ProjectTranslation" SELECT * FROM "ProjectTranslation" WHERE "projectId"=$1 AND locale=$2',
    [project.id, 'ko'],
    '23505',
  );
  await rejectsSql(
    'UPDATE "ProjectTranslation" SET "projectId"=$1 WHERE "projectId"=$2',
    [randomUUID(), project.id],
    '23503',
  );
  const assetId = randomUUID();
  await rejectsSql(
    'INSERT INTO "Asset" (id,"storageKey","originalName","mimeType","byteSize") VALUES ($1,$2,$3,$4,$5)',
    [assetId, '../secret', 'x', 'image/png', 1],
    '23514',
  );
  await client.query(
    'INSERT INTO "Asset" (id,"storageKey","originalName","mimeType","byteSize") VALUES ($1,$2,$3,$4,$5)',
    [assetId, 'test/image.png', 'image.png', 'image/png', 1],
  );
  await client.query(
    'INSERT INTO "ProjectAsset" (id,"projectId","assetId",usage) VALUES ($1,$2,$3,$4)',
    [randomUUID(), project.id, assetId, 'COVER'],
  );
  const secondAssetId = randomUUID();
  await client.query(
    'INSERT INTO "Asset" (id,"storageKey","originalName","mimeType","byteSize") VALUES ($1,$2,$3,$4,$5)',
    [secondAssetId, 'test/second.png', 'second.png', 'image/png', 1],
  );
  await rejectsSql(
    'INSERT INTO "ProjectAsset" (id,"projectId","assetId",usage) VALUES ($1,$2,$3,$4)',
    [randomUUID(), project.id, secondAssetId, 'COVER'],
    '23505',
  );
  await rejectsSql('DELETE FROM "Asset" WHERE id=$1', [assetId], '23503');
  const tagId = randomUUID();
  await client.query(
    'INSERT INTO "Tag" (id,kind,slug,name) VALUES ($1,$2,$3,$4)',
    [tagId, 'TECHNOLOGY', 'test', 'Test'],
  );
  await client.query(
    'INSERT INTO "ProjectTag" ("projectId","tagId") VALUES ($1,$2)',
    [project.id, tagId],
  );
  await client.query('DELETE FROM "Project" WHERE id=$1', [project.id]);
  assert.equal(
    Number(
      (
        await client.query(
          'SELECT count(*) FROM "ProjectTag" WHERE "projectId"=$1',
          [project.id],
        )
      ).rows[0].count,
    ),
    0,
  );
  assert.equal(
    Number(
      (
        await client.query('SELECT count(*) FROM "Asset" WHERE id=$1', [
          assetId,
        ])
      ).rows[0].count,
    ),
    1,
  );
  assert.equal(
    Number(
      (
        await client.query(
          'SELECT count(*) FROM "ProjectTranslation" WHERE "projectId"=$1',
          [project.id],
        )
      ).rows[0].count,
    ),
    0,
  );
  console.log(
    'Database checks passed: migration, seed rerun, original content migration, FK/check/unique constraints, file preservation.',
  );
} catch (error) {
  console.error(
    `Database check failed (${error.code ?? error.name}); credentials are omitted.`,
  );
  process.exitCode = 1;
} finally {
  if (created) {
    await client.query('ROLLBACK');
    await client.query('SET search_path TO public');
    await client.query(`DROP SCHEMA "${schema}" CASCADE`);
  }
  await client.end();
}
