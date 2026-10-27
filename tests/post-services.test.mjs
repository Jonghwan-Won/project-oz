import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import path from 'node:path';
import ts from 'typescript';
const require = createRequire(import.meta.url);
export function loadPostModule(
  file,
  pool = {},
  env = { NODE_ENV: 'development', DATABASE_URL: 'configured' },
) {
  const absolute = path.resolve(file);
  const output = ts.transpileModule(readFileSync(absolute, 'utf8'), {
    compilerOptions: {
      module: ts.ModuleKind.CommonJS,
      target: ts.ScriptTarget.ES2022,
      esModuleInterop: true,
    },
  }).outputText;
  const exports = {};
  new Function('require', 'exports', 'process', output)(
    (id) => {
      if (id === 'server-only') return {};
      if (id === '@/server/db') return { pool };
      if (id.startsWith('@/'))
        return loadPostModule('src/' + id.slice(2) + '.ts', pool, env);
      if (id.startsWith('.'))
        return loadPostModule(
          path.resolve(path.dirname(absolute), id + '.ts'),
          pool,
          env,
        );
      return require(id);
    },
    exports,
    { env },
  );
  return exports;
}
const form = loadPostModule('src/lib/post-form.ts');
test('admin post list omits body while editor detail reads one ID', async () => {
  const queries = [];
  const api = loadPostModule('src/server/services/posts.ts', {
    query: async (sql, values) => {
      queries.push({ sql, values });
      return sql.includes('current_database')
        ? { rows: [{ name: 'oz_dev' }] }
        : { rows: [] };
    },
  });
  await api.getAdminPosts();
  const listQuery = queries.find(({ sql }) => sql.includes('FROM "Post" p'));
  assert.doesNotMatch(listQuery.sql, /'body',body/);
  await api.getAdminPost('00000000-0000-0000-0000-000000000001');
  const detailQuery = queries
    .filter(({ sql }) => sql.includes('FROM "Post" p'))
    .at(-1);
  assert.match(detailQuery.sql, /'body',body/);
  assert.match(detailQuery.sql, /WHERE p\.id=\$1/);
  assert.deepEqual(detailQuery.values, [
    '00000000-0000-0000-0000-000000000001',
  ]);
});
test('post form validates bilingual rich text, categories, visibility and identity without thumbnails', () => {
  const input = form.blankPost();
  input.slug = 'a-post';
  input.translations.ko.title = '제목';
  assert.equal(form.parsePostForm(input).translations.ko.title, '제목');
  assert.equal(
    'thumbnail' in form.parsePostForm({ ...input, thumbnail: 'ignored' }),
    false,
  );
  for (const patch of [
    { slug: '../x' },
    { category: '전체' },
    { isVisible: 'true' },
    { id: 'invalid' },
    { version: -1 },
    {
      translations: {
        ...input.translations,
        ko: { ...input.translations.ko, body: { type: 'html' } },
      },
    },
  ])
    assert.throws(() => form.parsePostForm({ ...input, ...patch }));
});
test('post writes reject production, remote and cross-origin requests before DB access', async () => {
  for (const method of ['POST', 'DELETE'])
    for (const [mode, url, origin] of [
      ['production', 'http://localhost/api/admin/posts', 'http://localhost'],
      [
        'development',
        'https://example.com/api/admin/posts',
        'https://example.com',
      ],
      [
        'development',
        'http://localhost/api/admin/posts',
        'https://other.example',
      ],
    ]) {
      const api = loadPostModule(
        'src/server/services/admin-posts.ts',
        {},
        { NODE_ENV: mode },
      );
      const response = await api.savePostRequest(
        new Request(url, { method, headers: { origin }, body: '{}' }),
      );
      assert.equal(response.status, 403);
      assert.equal(response.headers.get('cache-control'), 'no-store');
    }
});
test('post deletion rejects invalid and duplicate selection, request size is bounded', async () => {
  const api = loadPostModule('src/server/services/admin-posts.ts');
  const item = { id: '00000000-0000-0000-0000-000000000001', version: 1 };
  for (const input of [
    null,
    [],
    [{}],
    [item, item],
    [{ ...item, version: 0 }],
    Array(101).fill(item),
  ])
    await assert.rejects(api.deletePosts(input), (e) => e.status === 400);
  assert.equal(
    (
      await api.savePostRequest(
        new Request('http://localhost/api/admin/posts', {
          method: 'POST',
          headers: { origin: 'http://localhost' },
          body: 'x'.repeat(512001),
        }),
      )
    ).status,
    413,
  );
});
test('public post list excludes body and detail query selects one visible post', async () => {
  const queries = [];
  const api = loadPostModule('src/server/services/posts.ts', {
    query: async (sql, values) => {
      queries.push({ sql, values });
      assert.match(sql, /p\."isVisible"=true AND p\."deletedAt" IS NULL/);
      return { rows: [] };
    },
  });
  assert.deepEqual(await api.getPublicPosts('en'), []);
  assert.doesNotMatch(queries[0].sql, /COALESCE\(t\.body,k\.body\)/);
  assert.deepEqual(queries[0].values, ['en']);
  assert.equal(
    await api.getPublicPost('00000000-0000-0000-0000-000000000001', 'en'),
    null,
  );
  assert.match(queries[1].sql, /p\.id=\$1::uuid/);
  assert.match(queries[1].sql, /COALESCE\(t\.body,k\.body\)/);
  assert.deepEqual(queries[1].values, [
    '00000000-0000-0000-0000-000000000001',
    'en',
  ]);
  assert.deepEqual(
    await loadPostModule('src/server/services/posts.ts', {}, {}).getPublicPosts(
      'ko',
    ),
    [],
  );
  await assert.rejects(
    loadPostModule('src/server/services/posts.ts', {
      query: async () => {
        throw Error('private driver detail');
      },
    }).getPublicPosts('ko'),
    { message: 'Could not load public posts' },
  );
});
