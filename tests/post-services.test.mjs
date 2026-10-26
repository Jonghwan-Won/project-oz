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
test('public post queries only visible undeleted rows and filters direct URLs', async () => {
  const api = loadPostModule('src/server/services/posts.ts', {
    query: async (sql, values) => {
      assert.match(sql, /p\."isVisible"=true AND p\."deletedAt" IS NULL/);
      assert.match(sql, /p.id::text=\$2/);
      assert.match(sql, /COALESCE\(t.body,k.body\)/);
      assert.deepEqual(values, ['en', 'private-post']);
      return { rows: [] };
    },
  });
  assert.deepEqual(await api.getPublicPosts('en', 'private-post'), []);
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
