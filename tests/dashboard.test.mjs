import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import ts from 'typescript';
const output = ts.transpileModule(
  readFileSync('src/server/services/dashboard.ts', 'utf8'),
  {
    compilerOptions: {
      module: ts.ModuleKind.CommonJS,
      target: ts.ScriptTarget.ES2022,
    },
  },
).outputText;
function service(configured) {
  const calls = [];
  const exports = {};
  new Function('require', 'exports', 'process', output)(
    (id) =>
      id === 'server-only'
        ? {}
        : {
            pool: {
              query: async (sql, params) => {
                calls.push({ sql, params });
                return {
                  rows: [
                    sql.includes('FROM "Inquiry"')
                      ? { count: 2 }
                      : sql.includes('FROM "Asset"')
                        ? { count: 50, size: 9000000 }
                        : { total: 8, visible: 6 },
                  ],
                };
              },
            },
          },
    exports,
    { env: configured ? { DATABASE_URL: 'configured' } : {} },
  );
  return { api: exports, calls };
}
test('public dashboard returns real aggregates without exposing records', async () => {
  const { api, calls } = service(true);
  const summary = await api.getDashboardSummary();
  assert.deepEqual(summary.projectsSummary, { total: 8, visible: 6 });
  assert.equal(summary.pendingInquiries, 2);
  assert.equal(summary.unusedAssets.count, 50);
  assert.equal(calls.length, 4);
  for (const { sql } of calls) {
    assert.match(sql, /count\(\*\)/);
    assert.doesNotMatch(sql, /SELECT \*|i\.body|originalName|email/);
  }
  assert.deepEqual(calls[3].params, ['INQUIRY_STATUS', 'PENDING']);
  assert.match(
    calls[2].sql,
    /NOT EXISTS[\s\S]*"ProjectAsset"[\s\S]*"PostAsset"/,
  );
});
test('dashboard without DB configuration shows zero counts', async () => {
  const { api, calls } = service(false);
  const summary = await api.getDashboardSummary();
  assert.equal(summary.pendingInquiries, 0);
  assert.deepEqual(summary.unusedAssets, { count: 0, size: 0 });
  assert.equal(calls.length, 0);
});
