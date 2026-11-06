import { loadRequestOrigin } from './request-origin-helper.mjs';
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import ts from 'typescript';
import * as files from '../src/lib/files.ts';
const require = createRequire(import.meta.url);
function service(mode, query = async () => ({ rows: [] }), env = {}) {
  const output = ts.transpileModule(
    readFileSync(
      new URL('../src/server/services/assets.ts', import.meta.url),
      'utf8',
    ),
    {
      compilerOptions: {
        module: ts.ModuleKind.CommonJS,
        target: ts.ScriptTarget.ES2020,
        esModuleInterop: true,
      },
    },
  ).outputText;
  const exports = {};
  new Function('require', 'exports', 'process', output)(
    (id) =>
      id === '@/server/logging'
        ? { logError: () => {}, logEvent: () => {}, setLogUser: () => {} }
        : id === '@/server/request-origin'
          ? loadRequestOrigin()
          : id === '@/server/auth'
            ? {
                getAdminSession: async (headers) =>
                  mode !== 'production' &&
                  headers.get('origin') === 'http://localhost'
                    ? {}
                    : null,
              }
            : id === 'server-only'
              ? {}
              : id === '@/server/db'
                ? { pool: { query } }
                : id === '@/lib/files'
                  ? files
                  : require(id),
    exports,
    { env: { NODE_ENV: mode, ...env } },
  );
  return exports;
}
test('asset writes deny production, remote development hosts and cross-origin requests', async () => {
  assert.equal(
    (
      await service('production').uploadAsset(
        new Request('http://localhost/api/assets', { method: 'POST' }),
      )
    ).status,
    403,
  );
  assert.equal(
    (
      await service('development').uploadAsset(
        new Request('http://example.com/api/assets', {
          method: 'POST',
          headers: { Origin: 'http://example.com' },
        }),
      )
    ).status,
    403,
  );
  assert.equal(
    (
      await service('development').uploadAsset(
        new Request('http://localhost/api/assets', {
          method: 'POST',
          headers: { Origin: 'https://other.example' },
        }),
      )
    ).status,
    403,
  );
});
test('production asset reads do not use the development private-file exception', async () => {
  let params;
  const api = service('production', async (_sql, values) => {
    assert.match(_sql, /p\."deletedAt" IS NULL/);
    assert.match(_sql, /FROM "PostAsset" pa JOIN "Post" p/);
    assert.equal(
      (_sql.match(/p\."isVisible"=true AND p\."deletedAt" IS NULL/g) ?? [])
        .length,
      2,
    );
    params = values;
    return { rows: [] };
  });
  const response = await api.readAsset(
    new Request('http://localhost/api/assets/id'),
    '00000000-0000-0000-0000-000000000001',
  );
  assert.equal(response.status, 404);
  assert.equal(params[1], false);
  assert.equal(
    (
      await api.readAsset(
        new Request('http://localhost/api/assets/id'),
        '../secret',
      )
    ).status,
    404,
  );
});

const resumeId = '00000000-0000-0000-0000-0000000000a1';
test('portfolio PDF downloads only serve the asset IDs configured on the server', async () => {
  let queries = 0;
  const none = service('production', async () => {
    queries += 1;
    return { rows: [] };
  });
  assert.deepEqual(none.portfolioFileStatus(), {
    resume: false,
    portfolio: false,
  });
  for (const kind of [
    'resume',
    'portfolio',
    'unknown',
    '__proto__',
    'constructor',
  ])
    assert.equal((await none.readPortfolioFile(kind)).status, 404);
  assert.equal(queries, 0);

  const invalid = service('production', undefined, {
    PORTFOLIO_RESUME_ASSET_ID: '../secret',
  });
  assert.equal(invalid.portfolioFileStatus().resume, false);
  assert.equal((await invalid.readPortfolioFile('resume')).status, 404);

  const params = [];
  const configured = service(
    'production',
    async (_sql, values) => {
      params.push(values);
      return {
        rows: [
          {
            storageKey: '2026/11/00000000-0000-0000-0000-0000000000a1.png',
            originalName: 'image.png',
            mimeType: 'image/png',
          },
        ],
      };
    },
    { PORTFOLIO_RESUME_ASSET_ID: resumeId },
  );
  assert.deepEqual(configured.portfolioFileStatus(), {
    resume: true,
    portfolio: false,
  });
  // PDF가 아닌 파일은 지정되어 있어도 내려주지 않는다.
  assert.equal((await configured.readPortfolioFile('resume')).status, 404);
  assert.deepEqual(params, [[resumeId]]);
  assert.equal((await configured.readPortfolioFile('portfolio')).status, 404);
  assert.equal(params.length, 1);
});
