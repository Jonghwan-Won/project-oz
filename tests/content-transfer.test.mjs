import test from 'node:test';
import assert from 'node:assert/strict';
import {
  storagePath,
  validateBundle,
  tables,
  canonical,
} from '../scripts/content-transfer.mjs';
test('content transfer rejects traversal paths and incomplete asset manifests', () => {
  assert.throws(() => storagePath('/storage', '../secret'));
  assert.throws(() => storagePath('/storage', '2026/10/../../../secret.png'));
  const bundle = {
    version: 1,
    database: 'oz_dev',
    tables: Object.fromEntries(tables.map((table) => [table, []])),
    files: [],
  };
  assert.doesNotThrow(() => validateBundle(bundle));
  assert.throws(() => validateBundle({ ...bundle, database: 'oz' }));
  bundle.tables.Asset.push({
    id: '1',
    storageKey: '2026/10/00000000-0000-0000-0000-000000000001.png',
  });
  assert.throws(() => validateBundle(bundle));
  bundle.files.push({
    id: '1',
    key: bundle.tables.Asset[0].storageKey,
    sha256: 'a'.repeat(64),
  });
  assert.doesNotThrow(() => validateBundle(bundle));
  assert.deepEqual(canonical({ b: 2, a: [{ d: 4, c: 3 }] }), {
    a: [{ c: 3, d: 4 }],
    b: 2,
  });
});

test('transfer dry run remaps seeded tags, preserves auth and rolls back without copying files', async () => {
  const { importContent } = await import('../scripts/content-transfer.mjs');
  const fs = await import('node:fs/promises');
  const path = await import('node:path');
  const { tmpdir } = await import('node:os');
  const { createHash } = await import('node:crypto');
  const root = await fs.mkdtemp(path.join(tmpdir(), 'oz-transfer-'));
  try {
    const source = path.join(root, 'source'),
      target = path.join(root, 'target');
    const key = '2026/10/00000000-0000-0000-0000-000000000001.png';
    await fs.mkdir(path.dirname(storagePath(source, key)), { recursive: true });
    await fs.mkdir(target);
    await fs.writeFile(storagePath(source, key), 'file-bytes');
    const bundle = {
      version: 1,
      database: 'oz_dev',
      tables: Object.fromEntries(tables.map((table) => [table, []])),
      files: [
        {
          id: 'asset',
          key,
          sha256: createHash('sha256').update('file-bytes').digest('hex'),
        },
      ],
    };
    bundle.tables.Asset = [{ id: 'asset', storageKey: key }];
    bundle.tables.Project = [{ id: 'project' }];
    bundle.tables.Post = [{ id: 'post', isVisible: false }];
    bundle.tables.Tag = [
      { id: 'source-tag', kind: 'TECHNOLOGY', slug: 'react', name: 'React' },
    ];
    bundle.tables.ProjectTag = [
      { projectId: 'project', tagId: 'source-tag', position: 0 },
    ];
    const calls = [];
    const client = {
      query: async (sql, params) => {
        calls.push({ sql, params });
        if (sql.includes('current_database()')) return { rows: [{ db: 'oz' }] };
        if (sql.includes('AS projects'))
          return { rows: [{ projects: 0, posts: 0 }] };
        if (sql.includes('"AuthUser"'))
          return { rows: [{ users: '1', accounts: '1' }] };
        if (sql.startsWith('SELECT id,name FROM "Tag"'))
          return { rows: [{ id: 'seeded-tag', name: 'React' }] };
        if (sql.startsWith('SELECT count(*)')) {
          const table = sql.match(/FROM "(\w+)"/)[1];
          return { rows: [{ count: String(bundle.tables[table].length) }] };
        }
        return { rowCount: 1, rows: [] };
      },
    };
    await importContent(client, bundle, source, target, false);
    assert.equal(calls.at(-1).sql, 'ROLLBACK');
    const relation = calls.find((c) =>
      c.sql.startsWith('INSERT INTO "ProjectTag"'),
    );
    assert.equal(JSON.parse(relation.params[0]).tagId, 'seeded-tag');
    const post = calls.find((c) => c.sql.startsWith('INSERT INTO "Post"'));
    assert.equal(JSON.parse(post.params[0]).isVisible, false);
    assert.ok(
      calls.every((c) => !/^(INSERT|UPDATE|DELETE).*"Auth/.test(c.sql)),
    );
    assert.deepEqual(await fs.readdir(target), []);
    await fs.mkdir(path.dirname(storagePath(target, key)), { recursive: true });
    await fs.writeFile(storagePath(target, key), 'different-production-file');
    await assert.rejects(
      importContent(client, bundle, source, target, false),
      /Target file conflict/,
    );
    assert.equal(
      await fs.readFile(storagePath(target, key), 'utf8'),
      'different-production-file',
    );
  } finally {
    await fs.rm(root, { recursive: true, force: true });
  }
});
