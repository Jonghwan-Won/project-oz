import { loadRequestOrigin } from './request-origin-helper.mjs';
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import ts from 'typescript';
const require = createRequire(import.meta.url);
const output = ts.transpileModule(
  readFileSync(
    new URL('../src/server/services/admin-projects.ts', import.meta.url),
    'utf8',
  ),
  {
    compilerOptions: {
      module: ts.ModuleKind.CommonJS,
      target: ts.ScriptTarget.ES2022,
    },
  },
).outputText;
function service(mode, query = async () => ({ rows: [] })) {
  const exports = {};
  new Function('require', 'exports', 'process', output)(
    (id) => {
      if (id === '@/server/request-origin') return loadRequestOrigin();
      if (id === 'server-only') return {};
      if (id === '@/server/admin-access')
        return {
          requireAdmin: async () => {
            if (mode === 'production') throw Error('Unauthorized');
            return {};
          },
        };
      if (id === '@/server/auth')
        return {
          getAdminSession: async (headers) =>
            mode !== 'production' &&
            headers.get('origin') === 'http://localhost'
              ? {}
              : null,
        };
      if (id === '@/server/db')
        return {
          pool: {
            query,
            connect: () => {
              throw Error('Unexpected DB access');
            },
          },
        };
      if (id === '@/lib/project-form')
        return { uuid: (value) => /^[0-9a-f-]{36}$/.test(value) };
      return require(id);
    },
    exports,
    { env: { NODE_ENV: mode } },
  );
  return exports;
}
test('dashboard project totals exclude deleted records and count visible items', async () => {
  const queries = [];
  const api = service('development', async (sql) => {
    queries.push(sql);
    return sql.includes('current_database')
      ? { rows: [{ name: 'oz_dev' }] }
      : { rows: [{ total: 4, visible: 3 }] };
  });
  assert.deepEqual(await api.getAdminProjectSummary(), {
    total: 4,
    visible: 3,
  });
  assert.match(queries[0], /"deletedAt" IS NULL/);
  assert.match(queries[0], /FILTER \(WHERE "isVisible"\)/);
});
test('admin project list omits edit body and selected project detail queries one ID', async () => {
  const queries = [];
  const query = async (sql, params) => {
    queries.push({ sql, params });
    return sql.includes('current_database')
      ? { rows: [{ name: 'oz_dev' }] }
      : { rows: [] };
  };
  const api = service('development', query);
  await api.getAdminProjects();
  const listQuery = queries.find(({ sql }) => sql.includes('FROM "Project" p'));
  assert.doesNotMatch(listQuery.sql, /'body',body|AS files|attachmentIds/);
  await api.getAdminProjects({
    keyword: ' test ',
    originCode: 'personal',
    typeCode: '__unset__',
    isVisible: 'false',
  });
  assert.deepEqual(
    queries.filter(({ sql }) => sql.includes('FROM "Project" p')).at(-1).params,
    ['test', 'personal', '__unset__', 'false'],
  );
  await api.getAdminProject('00000000-0000-0000-0000-000000000001');
  const detailQuery = queries
    .filter(({ sql }) => sql.includes('FROM "Project" p'))
    .at(-1);
  assert.match(detailQuery.sql, /'body',body/);
  assert.match(detailQuery.sql, /WHERE p\.id=\$1/);
  assert.deepEqual(detailQuery.params, [
    '00000000-0000-0000-0000-000000000001',
  ]);
});
test('project changes deny unauthenticated and cross-origin requests before DB access', async () => {
  for (const method of ['POST', 'DELETE'])
    for (const [mode, url, origin] of [
      ['production', 'http://localhost/api/admin/projects', 'http://localhost'],
      [
        'development',
        'http://example.com/api/admin/projects',
        'http://example.com',
      ],
      [
        'development',
        'http://localhost/api/admin/projects',
        'https://other.example',
      ],
    ])
      assert.equal(
        (
          await service(mode).saveProjectRequest(
            new Request(url, {
              method,
              headers: { Origin: origin },
              body: '[]',
            }),
          )
        ).status,
        403,
      );
});
test('project deletion rejects malformed, empty, duplicate and oversized selections before DB access', async () => {
  const item = { id: '00000000-0000-0000-0000-000000000001', version: 1 };
  for (const input of [
    null,
    [],
    [{}],
    [{ ...item, version: 0 }],
    [{ ...item, id: 'invalid' }],
    [item, item],
    Array(101).fill(item),
  ])
    await assert.rejects(
      service('development').deleteProjects(input),
      (error) => error.status === 400,
    );
});
