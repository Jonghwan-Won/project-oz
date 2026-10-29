import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import ts from 'typescript';
function load(
  path,
  imports,
  env = { NODE_ENV: 'production', DATABASE_URL: 'configured' },
) {
  const output = ts.transpileModule(
    readFileSync(new URL(path, import.meta.url), 'utf8'),
    {
      compilerOptions: {
        module: ts.ModuleKind.CommonJS,
        target: ts.ScriptTarget.ES2022,
      },
    },
  ).outputText;
  const exports = {};
  new Function('require', 'exports', 'process', output)(
    (id) => {
      if (id === 'server-only') return {};
      if (id in imports) return imports[id];
      throw Error(`Unexpected import: ${id}`);
    },
    exports,
    { env },
  );
  return exports;
}
test('admin access checks the current session every time, including revocation', async () => {
  let session = null;
  const requestHeaders = new Headers();
  const api = load('../src/server/admin-access.ts', {
    'next/headers': { headers: async () => requestHeaders },
    '@/server/auth': {
      getAdminSession: async (headers) => {
        assert.equal(headers, requestHeaders);
        return session;
      },
    },
  });
  await assert.rejects(api.requireAdmin(), (error) => error.status === 403);
  session = { user: { id: 'admin' } };
  assert.equal(await api.requireAdmin(requestHeaders), session);
  session = null;
  await assert.rejects(api.requireAdmin(), (error) => error.status === 403);
});
test('production project requests allow an admin on the site origin and deny other origins', async () => {
  let authenticated = true;
  let checks = 0;
  const api = load('../src/server/services/admin-projects.ts', {
    '@/server/admin-access': { requireAdmin: async () => ({}) },
    '@/server/auth': {
      getAdminSession: async () => {
        checks++;
        return authenticated ? {} : null;
      },
    },
    '@/server/db': {
      pool: {
        query: () => {
          throw Error('Unexpected DB access');
        },
      },
    },
    '@/lib/project-form': {},
    'node:crypto': {},
  });
  const request = (origin) =>
    new Request('https://oz.example/api/admin/projects', {
      method: 'POST',
      headers: { origin },
      body: '{',
    });
  assert.equal(
    (await api.saveProjectRequest(request('https://oz.example'))).status,
    400,
  );
  assert.equal(
    (await api.saveProjectRequest(request('https://other.example'))).status,
    403,
  );
  authenticated = false;
  assert.equal(
    (await api.saveProjectRequest(request('https://oz.example'))).status,
    403,
  );
  assert.equal(checks, 3);
});

test('all private admin read services reject before querying content', async () => {
  const cases = [
    ['admin-projects', ['getAdminProjects', 'getAdminProjectSummary']],
    ['posts', ['getAdminPosts', 'getAdminPostSummary']],
    ['admin-assets', ['getAdminAssets', 'getUnusedAssetSummary']],
    ['admin-codes', ['getAdminCodes']],
    ['admin-inquiries', ['getAdminInquiries', 'getPendingInquiryCount']],
  ];
  const { createRequire } = await import('node:module');
  const require = createRequire(import.meta.url);
  for (const [file, methods] of cases) {
    const denied = Object.assign(new Error('Unauthorized'), { status: 403 });
    const api = load(
      `../src/server/services/${file}.ts`,
      new Proxy(
        {
          '@/server/admin-access': {
            requireAdmin: async () => {
              throw denied;
            },
          },
          '@/server/auth': {},
          '@/server/db': {
            pool: {
              query: () => {
                assert.fail('Private query executed');
              },
            },
          },
          '@/lib/admin-assets': { emptyAssetSearch: {} },
          react: { cache: (fn) => fn },
        },
        {
          has: () => true,
          get: (target, id) =>
            id in target
              ? target[id]
              : id.startsWith('node:')
                ? require(id)
                : {},
        },
      ),
    );
    for (const method of methods)
      await assert.rejects(
        api[method](),
        (error) => error === denied,
        `${file}.${method}`,
      );
  }
});

test('public management reads enforce visibility in lists, details, totals and file sources', async () => {
  const { createRequire } = await import('node:module');
  const require = createRequire(import.meta.url);
  for (const file of ['admin-projects', 'posts', 'admin-assets']) {
    const queries = [];
    const api = load(
      `../src/server/services/${file}.ts`,
      new Proxy(
        {
          '@/server/admin-access': {
            requireAdmin: async () => {
              assert.fail('Public projection requested private access');
            },
          },
          '@/server/auth': {},
          '@/server/db': {
            pool: {
              query: async (sql, params) => {
                queries.push({ sql, params });
                return {
                  rows: [
                    {
                      total: 0,
                      visible: 0,
                      count: '0',
                      size: 0,
                      unused: 0,
                      unusedSize: 0,
                    },
                  ],
                };
              },
            },
          },
          '@/lib/project-form': { blankCopy: () => ({}), uuid: () => true },
          '@/lib/admin-assets': {
            emptyAssetSearch: { keyword: '', filter: 'all', sort: 'new' },
          },
          react: { cache: (fn) => fn },
        },
        {
          has: () => true,
          get: (target, id) =>
            id in target
              ? target[id]
              : id.startsWith('node:')
                ? require(id)
                : {},
        },
      ),
    );
    if (file === 'admin-projects') {
      await api.getAdminProjects(undefined, true);
      await api.getAdminProject('id', true);
      await api.getAdminProjectCount(true);
      await api.getAdminProjectSummary(true);
      const codes = queries.find(({ sql }) =>
        sql.includes('FROM "CommonCode"'),
      );
      assert.match(codes.sql, /WHERE "groupKey" IN/);
      assert.match(codes.sql, /"isActive"=true/);
    } else if (file === 'posts') {
      await api.getAdminPosts(undefined, true);
      await api.getAdminPost('id', true);
      await api.getAdminPostCount(true);
      await api.getAdminPostSummary(true);
    } else {
      await api.getAdminAssets(undefined, true);
      assert.match(queries[0].sql, /NULL::text AS id/);
      assert.match(queries[0].sql, /'프로젝트' AS title/);
      assert.match(
        queries[0].sql,
        /UNION ALL SELECT 'post',NULL::text,'게시글'/,
      );
      assert.doesNotMatch(queries[0].sql, /p\."isVisible"=true|storageKey/);
      assert.doesNotMatch(queries[1].sql, /FROM "Asset" a WHERE EXISTS/);
      continue;
    }
    for (const { sql } of queries.filter(
      ({ sql }) => !sql.includes('FROM "CommonCode"'),
    )) {
      assert.match(sql, /"isVisible"=true/, file);
      assert.match(sql, /"deletedAt" IS NULL/, file);
    }
  }
});

test('public management remains usable without a configured database', async () => {
  const imports = new Proxy(
    {
      '@/server/admin-access': {
        requireAdmin: async () => {
          assert.fail('Unexpected private access');
        },
      },
      '@/server/db': {
        pool: {
          query: () => {
            assert.fail('Unexpected DB query');
          },
        },
      },
      react: { cache: (fn) => fn },
    },
    { has: () => true, get: (target, id) => (id in target ? target[id] : {}) },
  );
  const projects = load(
    '../src/server/services/admin-projects.ts',
    imports,
    {},
  );
  assert.deepEqual(await projects.getAdminProjects(undefined, true), {
    projects: [],
    codes: [],
  });
  assert.equal(await projects.getAdminProject('id', true), null);
  assert.equal(await projects.getAdminProjectCount(true), 0);
  assert.deepEqual(await projects.getAdminProjectSummary(true), {
    total: 0,
    visible: 0,
  });
  const posts = load('../src/server/services/posts.ts', imports, {});
  assert.deepEqual(await posts.getAdminPosts(undefined, true), []);
  assert.equal(await posts.getAdminPost('id', true), null);
  assert.equal(await posts.getAdminPostCount(true), 0);
  assert.deepEqual(await posts.getAdminPostSummary(true), {
    total: 0,
    visible: 0,
  });
  const assets = load('../src/server/services/admin-assets.ts', imports, {});
  assert.deepEqual(await assets.getAdminAssets(undefined, true), {
    assets: [],
    totals: { total: 0, size: 0, unused: 0, unusedSize: 0 },
  });
});
