import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import ts from 'typescript';
const output = ts.transpileModule(
  readFileSync(
    new URL('../src/server/services/projects.ts', import.meta.url),
    'utf8',
  ),
  {
    compilerOptions: {
      module: ts.ModuleKind.CommonJS,
      target: ts.ScriptTarget.ES2022,
    },
  },
).outputText;
function service(env, query) {
  const exports = {};
  new Function('require', 'exports', 'process', output)(
    (id) => {
      if (id === 'server-only') return {};
      if (id === 'react') return { cache: (fn) => fn };
      if (id === '@/server/db') return { pool: { query } };
      throw Error('Unexpected dependency');
    },
    exports,
    { env },
  );
  return exports;
}
test('a DB-free production image renders an empty project list without querying a DB', async () => {
  let called = false;
  assert.deepEqual(
    await service({}, async () => {
      called = true;
    }).getPublicProjects('ko'),
    [],
  );
  assert.equal(called, false);
});
test('configured project reads require public, undeleted projects and hide driver errors', async () => {
  const api = service({ DATABASE_URL: 'configured' }, async (sql, params) => {
    assert.match(sql, /p\."isVisible"=true AND p\."deletedAt" IS NULL/);
    assert.deepEqual(params, ['en']);
    throw Error('private driver detail');
  });
  await assert.rejects(api.getPublicProjects('en'), {
    message: 'Could not load public projects',
  });
});
test('project list excludes detail body and attachments; detail reads one visible project by key', async () => {
  const queries = [];
  const api = service({ DATABASE_URL: 'configured' }, async (sql, params) => {
    queries.push({ sql, params });
    return { rows: [] };
  });
  await api.getPublicProjects('ko');
  assert.doesNotMatch(queries[0].sql, /t\.body|AS attachments/);
  assert.deepEqual(queries[0].params, ['ko']);
  await api.getPublicProject('00000000-0000-0000-0000-000000000001', 'ko');
  assert.match(queries[1].sql, /p\.id=\$1::uuid/);
  assert.match(queries[1].sql, /t\.body/);
  assert.match(queries[1].sql, /AS attachments/);
  assert.deepEqual(queries[1].params, [
    '00000000-0000-0000-0000-000000000001',
    'ko',
  ]);
});
