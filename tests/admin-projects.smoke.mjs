import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import { loadEnvFile } from 'node:process';
import { realpath, unlink } from 'node:fs/promises';
import path from 'node:path';
import pg from 'pg';
loadEnvFile('.env.local');
assert.equal(new URL(process.env.DATABASE_URL).pathname, '/oz_dev');
const root = await realpath(process.env.STORAGE_ROOT);
assert.equal(path.basename(root), 'dev');
const base = process.env.TEST_URL || 'http://localhost:3000';
assert.ok(['localhost', '127.0.0.1'].includes(new URL(base).hostname));
const client = new pg.Client({
  connectionString: process.env.DATABASE_URL,
  connectionTimeoutMillis: 5000,
});
const token = randomUUID();
let asset, project, deletionProject;
let tagIds = [];
const paragraph = (text) => ({
  type: 'paragraph',
  content: [{ type: 'text', text }],
});
const post = (payload) =>
  fetch(base + '/api/admin/projects', {
    method: 'POST',
    headers: { Origin: base, 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
try {
  await client.connect();
  assert.equal(
    (
      await fetch(base + '/api/admin/projects', {
        method: 'POST',
        headers: { Origin: 'https://other.example' },
      })
    ).status,
    403,
  );
  const form = new FormData();
  form.set(
    'file',
    new File(
      [
        Buffer.from(
          'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+jRZkAAAAASUVORK5CYII=',
          'base64',
        ),
      ],
      'project-save-check.png',
      { type: 'image/png' },
    ),
  );
  const upload = await fetch(base + '/api/assets', {
    method: 'POST',
    headers: { Origin: base },
    body: form,
  });
  assert.equal(upload.status, 201);
  asset = await upload.json();
  const payload = {
    id: '',
    version: 0,
    slug: 'save-test-' + token,
    originCode: 'personal',
    typeCode: 'website',
    lifecycle: 'BUILDING',
    visibility: 'PRIVATE',
    position: 999,
    placeholder: false,
    thumbnail: asset.url,
    customerName: '검증 고객사',
    technologies: ['React'],
    tags: ['check-tag-' + token],
    attachmentIds: [asset.id],
    translations: {
      ko: {
        title: '저장 검증 프로젝트',
        summary: '요약',
        body: {
          type: 'doc',
          content: [
            paragraph('저장 본문'),
            {
              type: 'table',
              content: [
                {
                  type: 'tableRow',
                  content: [
                    { type: 'tableHeader', content: [paragraph('표 제목')] },
                    { type: 'tableHeader', content: [paragraph('내용')] },
                  ],
                },
                {
                  type: 'tableRow',
                  content: [
                    { type: 'tableCell', content: [paragraph('셀 하나')] },
                    { type: 'tableCell', content: [paragraph('셀 둘')] },
                  ],
                },
              ],
            },
            {
              type: 'image',
              attrs: {
                src: asset.url,
                alt: '저장 이미지',
                width: 320,
                height: 180,
              },
            },
          ],
        },
      },
      en: {
        title: 'Saved project',
        summary: 'Summary',
        body: { type: 'doc', content: [paragraph('Saved body')] },
      },
    },
  };
  let response = await post(payload);
  assert.equal(response.status, 200, await response.clone().text());
  project = await response.json();
  assert.equal(project.version, 1);
  assert.deepEqual(
    (
      await client.query(
        'SELECT usage::text FROM "ProjectAsset" WHERE "projectId"=$1 ORDER BY usage::text',
        [project.id],
      )
    ).rows.map((row) => row.usage),
    ['ATTACHMENT', 'COVER', 'INLINE'],
  );
  await client.query(
    'UPDATE "ProjectAsset" SET label=$1 WHERE "projectId"=$2',
    ['보존할 첨부 설명', project.id],
  );
  tagIds = (
    await client.query(
      'SELECT "tagId" FROM "ProjectTag" WHERE "projectId"=$1',
      [project.id],
    )
  ).rows.map((row) => row.tagId);
  assert.equal(tagIds.length, 2);
  assert.equal((await fetch(base + '/work/' + payload.slug)).status, 404);
  payload.id = project.id;
  payload.version = project.version;
  payload.visibility = 'PUBLIC';
  response = await post(payload);
  assert.equal(response.status, 200, await response.clone().text());
  project = await response.json();
  assert.equal(
    (
      await client.query(
        'SELECT count(*)::int AS count FROM "ProjectAsset" WHERE "projectId"=$1 AND label=$2',
        [project.id, '보존할 첨부 설명'],
      )
    ).rows[0].count,
    3,
  );
  const html = await (await fetch(base + '/work/' + payload.slug)).text();
  assert.match(html, /<table/);
  assert.ok(html.includes('셀 하나'));
  assert.ok(html.includes('React'));
  assert.ok(html.includes(asset.url));
  assert.ok(html.includes('width="320"'));
  assert.ok(html.includes('height="180"'));
  const english = await (
    await fetch(base + '/work/' + payload.slug, {
      headers: { Cookie: 'ddoza-locale=en' },
    })
  ).text();
  assert.ok(english.includes('Saved project'));
  assert.equal((await post(payload)).status, 409);
  payload.version = project.version;
  assert.equal(
    (await post({ ...payload, typeCode: 'missing-code' })).status,
    400,
  );
  assert.equal(
    (await post({ ...payload, attachmentIds: [randomUUID()] })).status,
    400,
  );
  assert.equal(
    (
      await client.query('SELECT version FROM "Project" WHERE id=$1', [
        project.id,
      ])
    ).rows[0].version,
    project.version,
  );
  assert.equal((await post({ ...payload, id: '', version: 0 })).status, 409);
  payload.translations.en.title = '';
  response = await post(payload);
  assert.equal(response.status, 200);
  project = await response.json();
  const fallback = await (
    await fetch(base + '/work/' + payload.slug, {
      headers: { Cookie: 'ddoza-locale=en' },
    })
  ).text();
  assert.ok(fallback.includes('저장 검증 프로젝트'));

  assert.equal(
    (
      await client.query('SELECT "customerName" FROM "Project" WHERE id=$1', [
        project.id,
      ])
    ).rows[0].customerName,
    '검증 고객사',
  );
  const remove = (items, origin = base) =>
    fetch(base + '/api/admin/projects', {
      method: 'DELETE',
      headers: { Origin: origin, 'Content-Type': 'application/json' },
      body: JSON.stringify(items),
    });
  assert.equal((await remove([project], 'https://other.example')).status, 403);
  assert.equal(
    (await post({ ...payload, customerName: 'x'.repeat(201) })).status,
    400,
  );
  assert.equal((await post({ ...payload, customerName: 17 })).status, 400);
  assert.equal((await remove([])).status, 400);
  assert.equal((await remove([{ id: 'bad-id', version: 1 }])).status, 400);
  assert.equal((await remove([project, project])).status, 400);
  response = await post({
    ...payload,
    id: '',
    version: 0,
    slug: 'delete-check-' + token,
  });
  assert.equal(response.status, 200);
  deletionProject = await response.json();
  assert.equal(
    (await remove([project, { ...deletionProject, version: 999 }])).status,
    409,
  );
  assert.equal(
    (
      await client.query(
        'SELECT count(*)::int AS count FROM "Project" WHERE id=ANY($1::uuid[]) AND "deletedAt" IS NULL',
        [[project.id, deletionProject.id]],
      )
    ).rows[0].count,
    2,
  );
  response = await remove([project, deletionProject]);
  assert.equal(response.status, 200);
  assert.equal((await response.json()).deleted, 2);
  assert.equal((await fetch(base + '/work/' + payload.slug)).status, 404);
  assert.equal(
    (
      await client.query(
        'SELECT "deletedAt" IS NOT NULL AS deleted FROM "Project" WHERE id=$1',
        [project.id],
      )
    ).rows[0].deleted,
    true,
  );
  assert.equal((await post(payload)).status, 409);
  console.log(
    'Project DB save, translations/table/images/tags/assets, private visibility, stale/duplicate/invalid input rollback and fallback checks passed.',
  );
} finally {
  if (deletionProject)
    await client.query('DELETE FROM "Project" WHERE id=$1', [
      deletionProject.id,
    ]);
  if (project)
    await client.query('DELETE FROM "Project" WHERE id=$1', [project.id]);
  for (const id of tagIds)
    await client.query(
      'DELETE FROM "Tag" WHERE id=$1 AND NOT EXISTS(SELECT 1 FROM "ProjectTag" WHERE "tagId"=$1)',
      [id],
    );
  if (asset) {
    const row = (
      await client.query('SELECT "storageKey" FROM "Asset" WHERE id=$1', [
        asset.id,
      ])
    ).rows[0];
    if (row) {
      const target = await realpath(path.join(root, row.storageKey));
      const rel = path.relative(root, target);
      assert.ok(rel && !rel.startsWith('..') && !path.isAbsolute(rel));
      await client.query('DELETE FROM "Asset" WHERE id=$1', [asset.id]);
      await unlink(target);
    }
  }
  await client.end();
}
