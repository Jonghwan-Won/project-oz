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
function service(mode) {
  const exports = {};
  new Function('require', 'exports', 'process', output)(
    (id) => {
      if (id === 'server-only') return {};
      if (id === '@/server/db')
        return {
          pool: {
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
test('project changes deny production, remote hosts and cross-origin requests before DB access', async () => {
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
