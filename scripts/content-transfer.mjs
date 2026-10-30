import fs from 'node:fs/promises';
import path from 'node:path';
import { createHash } from 'node:crypto';
import { constants } from 'node:fs';
import { loadEnvFile } from 'node:process';
import { pathToFileURL } from 'node:url';
import pg from 'pg';

export const tables = [
  'User',
  'CommonCodeGroup',
  'CommonCode',
  'Tag',
  'Asset',
  'Project',
  'ProjectTranslation',
  'ProjectTag',
  'ProjectAsset',
  'Post',
  'PostTranslation',
  'PostAsset',
];
const keyPattern = /^\d{4}\/\d{2}\/[0-9a-f-]{36}\.(png|jpg|webp|pdf)$/i;
function inside(root, file) {
  const relative = path.relative(root, file);
  if (!relative || relative.startsWith('..') || path.isAbsolute(relative))
    throw Error('Storage path escaped its root');
  return file;
}
export function storagePath(root, key) {
  if (!keyPattern.test(key)) throw Error('Invalid storage key');
  return inside(root, path.resolve(root, key));
}
async function digest(root, key) {
  const file = await fs.realpath(storagePath(root, key));
  inside(root, file);
  return createHash('sha256')
    .update(await fs.readFile(file))
    .digest('hex');
}
export function canonical(value) {
  if (Array.isArray(value)) return value.map(canonical);
  if (value && typeof value === 'object')
    return Object.fromEntries(
      Object.keys(value)
        .sort()
        .map((key) => [key, canonical(value[key])]),
    );
  return value;
}
function same(a, b) {
  return JSON.stringify(canonical(a)) === JSON.stringify(canonical(b));
}
export function validateBundle(bundle) {
  if (
    bundle.version !== 1 ||
    bundle.database !== 'oz_dev' ||
    !bundle.tables ||
    Object.keys(bundle.tables).sort().join() !== [...tables].sort().join()
  )
    throw Error('Invalid development export');
  for (const table of tables)
    if (!Array.isArray(bundle.tables[table]))
      throw Error('Missing table: ' + table);
  if (
    !Array.isArray(bundle.files) ||
    bundle.files.length !== bundle.tables.Asset.length
  )
    throw Error('Invalid asset manifest');
  for (const asset of bundle.tables.Asset) {
    const entry = bundle.files.find(
      (file) => file.id === asset.id && file.key === asset.storageKey,
    );
    if (
      !entry ||
      !keyPattern.test(entry.key) ||
      !/^[a-f0-9]{64}$/.test(entry.sha256)
    )
      throw Error('Invalid asset manifest entry');
  }
}
export async function exportContent(client, root, output) {
  await client.query('BEGIN ISOLATION LEVEL REPEATABLE READ READ ONLY');
  try {
    if (
      (await client.query('SELECT current_database() AS db')).rows[0].db !==
      'oz_dev'
    )
      throw Error('Source must be oz_dev');
    const bundle = {
      version: 1,
      database: 'oz_dev',
      exportedAt: new Date().toISOString(),
      tables: {},
      files: [],
    };
    for (const table of tables)
      bundle.tables[table] = (
        await client.query(
          `SELECT COALESCE(jsonb_agg(to_jsonb(t)), '[]'::jsonb) AS rows FROM "${table}" t`,
        )
      ).rows[0].rows;
    const ids = new Set(
      [...bundle.tables.ProjectAsset, ...bundle.tables.PostAsset].map(
        (row) => row.assetId,
      ),
    );
    const scan = (value) => {
      if (typeof value === 'string') {
        const match = value.match(/^\/api\/assets\/([a-f0-9-]{36})(?:\?|$)/i);
        if (match) ids.add(match[1]);
      } else if (Array.isArray(value)) value.forEach(scan);
      else if (value && typeof value === 'object') {
        if (typeof value.assetId === 'string') ids.add(value.assetId);
        Object.values(value).forEach(scan);
      }
    };
    [
      ...bundle.tables.ProjectTranslation,
      ...bundle.tables.PostTranslation,
    ].forEach((row) => scan(row.body));
    bundle.tables.Project.forEach((row) => scan(row.thumbnailUrl));
    bundle.tables.Asset = bundle.tables.Asset.filter((row) => ids.has(row.id));
    if (bundle.tables.Asset.length !== ids.size)
      throw Error('A referenced asset is missing from the source DB');
    const actualRoot = await fs.realpath(root);
    for (const asset of bundle.tables.Asset)
      bundle.files.push({
        id: asset.id,
        key: asset.storageKey,
        sha256: await digest(actualRoot, asset.storageKey),
      });
    validateBundle(bundle);
    await fs.mkdir(path.dirname(output), { recursive: true });
    await fs.writeFile(output, JSON.stringify(bundle), {
      flag: 'wx',
      mode: 0o600,
    });
    await client.query('COMMIT');
    return bundle;
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  }
}
export async function importContent(
  client,
  bundle,
  sourceRoot,
  targetRoot,
  apply,
) {
  validateBundle(bundle);
  sourceRoot = await fs.realpath(sourceRoot);
  targetRoot = await fs.realpath(targetRoot);
  if (sourceRoot === targetRoot)
    throw Error('Source and target storage must differ');
  for (const file of bundle.files) {
    if ((await digest(sourceRoot, file.key)) !== file.sha256)
      throw Error('Source file checksum mismatch: ' + file.id);
    try {
      if ((await digest(targetRoot, file.key)) !== file.sha256)
        throw Error('Target file conflict: ' + file.id);
    } catch (error) {
      if (error.code !== 'ENOENT') throw error;
    }
  }
  const created = [];
  let committed = false;
  let commitAttempted = false;
  await client.query('BEGIN');
  try {
    if (
      (await client.query('SELECT current_database() AS db')).rows[0].db !==
      'oz'
    )
      throw Error('Target must be oz');
    await client.query("SET LOCAL lock_timeout = '5s'");
    await client.query("SET LOCAL TIME ZONE 'UTC'");
    await client.query(
      'LOCK TABLE ' +
        tables.map((table) => '"' + table + '"').join(',') +
        ' IN SHARE ROW EXCLUSIVE MODE',
    );
    const counts = (
      await client.query(
        'SELECT (SELECT count(*)::int FROM "Project") AS projects,(SELECT count(*)::int FROM "Post") AS posts',
      )
    ).rows[0];
    if (counts.projects || counts.posts)
      throw Error('Target has content; refusing to overwrite it');
    const authBefore = (
      await client.query(
        'SELECT (SELECT count(*) FROM "AuthUser") AS users,(SELECT count(*) FROM "AuthAccount") AS accounts',
      )
    ).rows[0];
    const tagMap = new Map();
    for (const table of tables) {
      for (const original of bundle.tables[table]) {
        const row =
          table === 'ProjectTag'
            ? { ...original, tagId: tagMap.get(original.tagId) }
            : original;
        if (table === 'Tag') {
          const existing = (
            await client.query(
              'SELECT id,name FROM "Tag" WHERE kind=$1 AND slug=$2',
              [row.kind, row.slug],
            )
          ).rows[0];
          if (existing) {
            if (existing.name !== row.name) throw Error('Tag name conflict');
            tagMap.set(row.id, existing.id);
            continue;
          }
          tagMap.set(row.id, row.id);
        }
        if (table === 'ProjectTag' && !row.tagId)
          throw Error('Missing tag mapping');
        const update =
          table === 'CommonCodeGroup'
            ? ' ON CONFLICT (key) DO UPDATE SET "nameKo"=EXCLUDED."nameKo","nameEn"=EXCLUDED."nameEn",description=EXCLUDED.description,"isActive"=EXCLUDED."isActive","updatedAt"=now()'
            : table === 'CommonCode'
              ? ' ON CONFLICT ("groupKey",code) DO UPDATE SET "nameKo"=EXCLUDED."nameKo","nameEn"=EXCLUDED."nameEn",position=EXCLUDED.position,"isActive"=EXCLUDED."isActive","updatedAt"=now()'
              : ' ON CONFLICT DO NOTHING';
        const inserted = await client.query(
          `INSERT INTO "${table}" SELECT * FROM json_populate_record(NULL::"${table}",$1::json)` +
            update,
          [JSON.stringify(row)],
        );
        if (!inserted.rowCount) {
          if (!row.id) throw Error('Conflicting relation in ' + table);
          const existing = (
            await client.query(
              `SELECT to_jsonb(t) AS row FROM "${table}" t WHERE id=$1`,
              [row.id],
            )
          ).rows[0]?.row;
          if (!same(existing, row)) throw Error('Conflicting row in ' + table);
        }
      }
    }
    for (const table of ['Project', 'Post', 'ProjectAsset', 'PostAsset']) {
      const count = Number(
        (await client.query(`SELECT count(*) AS count FROM "${table}"`)).rows[0]
          .count,
      );
      if (count !== bundle.tables[table].length)
        throw Error('Imported count mismatch: ' + table);
    }
    const authAfter = (
      await client.query(
        'SELECT (SELECT count(*) FROM "AuthUser") AS users,(SELECT count(*) FROM "AuthAccount") AS accounts',
      )
    ).rows[0];
    if (!same(authBefore, authAfter))
      throw Error('Authentication data changed');
    if (!apply) {
      await client.query('ROLLBACK');
      return;
    }
    for (const file of bundle.files) {
      const target = storagePath(targetRoot, file.key);
      await fs.mkdir(path.dirname(target), { recursive: true });
      for (const directory of [
        path.dirname(path.dirname(target)),
        path.dirname(target),
      ]) {
        inside(targetRoot, await fs.realpath(directory));
        await fs.chown(directory, 1000, 1000);
        await fs.chmod(directory, 0o750);
      }
      inside(targetRoot, await fs.realpath(path.dirname(target)));
      try {
        await fs.copyFile(
          storagePath(sourceRoot, file.key),
          target,
          constants.COPYFILE_EXCL,
        );
        created.push(target);
        await fs.chown(target, 1000, 1000);
        await fs.chmod(target, 0o640);
      } catch (error) {
        if (error.code !== 'EEXIST') throw error;
      }
      if ((await digest(targetRoot, file.key)) !== file.sha256)
        throw Error('Copied file checksum mismatch');
    }
    commitAttempted = true;
    await client.query('COMMIT');
    committed = true;
  } catch (error) {
    if (!committed) {
      await client.query('ROLLBACK').catch(() => {});
      // A lost COMMIT acknowledgement must never remove files that may now be referenced.
      if (!commitAttempted)
        for (const file of created) await fs.unlink(file).catch(() => {});
    }
    throw error;
  }
}
async function main() {
  const [mode, file] = process.argv.slice(2);
  if (!['export', 'check', 'apply'].includes(mode) || !file)
    throw Error('Use export|check|apply and a bundle path');
  if (mode === 'export') loadEnvFile('.env.local');
  const client = new pg.Client({
    connectionString:
      mode === 'export'
        ? process.env.DATABASE_URL
        : process.env.MIGRATION_DATABASE_URL,
    connectionTimeoutMillis: 5000,
  });
  if (mode !== 'export') {
    const url = new URL(process.env.MIGRATION_DATABASE_URL);
    if (
      url.hostname !== 'project-oz-db' ||
      url.pathname !== '/oz' ||
      url.username !== 'oz_admin'
    )
      throw Error('Expected production migration connection');
  }
  try {
    await client.connect();
    const bundle =
      mode === 'export'
        ? await exportContent(
            client,
            process.env.STORAGE_ROOT,
            path.resolve(file),
          )
        : JSON.parse(await fs.readFile(file, 'utf8'));
    if (mode !== 'export')
      await importContent(
        client,
        bundle,
        '/source',
        '/target',
        mode === 'apply',
      );
    console.log(
      JSON.stringify({
        result: mode + ' completed',
        counts: Object.fromEntries(
          tables.map((table) => [table, bundle.tables[table].length]),
        ),
        files: bundle.files.length,
      }),
    );
  } finally {
    await client.end();
  }
}
if (
  process.argv[1] &&
  import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href
)
  main().catch((error) => {
    console.error('Transfer failed:', error.code ?? error.message);
    process.exitCode = 1;
  });
