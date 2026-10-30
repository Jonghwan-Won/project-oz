import { loadRequestOrigin } from './request-origin-helper.mjs';
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import ts from 'typescript';
import { assetIdsValid, formatAssetSize } from '../src/lib/admin-assets.ts';
const require = createRequire(import.meta.url);
const source = ts.transpileModule(
  readFileSync(
    new URL('../src/server/services/admin-assets.ts', import.meta.url),
    'utf8',
  ),
  {
    compilerOptions: {
      module: ts.ModuleKind.CommonJS,
      target: ts.ScriptTarget.ES2022,
      esModuleInterop: true,
    },
  },
).outputText;
function service(
  mode,
  query = () => {
    throw Error('unexpected DB access');
  },
  extra = {},
) {
  const exports = {};
  new Function('require', 'exports', 'process', source)(
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
        return { pool: { query, connect: extra.connect } };
      if (id === '@/lib/admin-assets') return { assetIdsValid };
      if (id === 'node:fs/promises' && extra.fs) return extra.fs;
      return require(id);
    },
    exports,
    { env: { NODE_ENV: mode, STORAGE_ROOT: 'C:/storage' } },
  );
  return exports;
}
const id = 'e56a7a2b-1234-4234-8234-123456789abc';
test('dashboard excludes files referenced by projects or posts', async () => {
  const calls = [];
  const query = async (sql) => {
    calls.push(sql);
    return sql.includes('current_database')
      ? { rows: [{ name: 'oz_dev' }] }
      : { rows: [{ count: 2, size: 1024 }] };
  };
  assert.deepEqual(
    await service('development', query).getUnusedAssetSummary(),
    { count: 2, size: 1024 },
  );
  assert.match(calls[0], /NOT EXISTS \(SELECT 1 FROM "ProjectAsset"/);
  assert.match(calls[0], /NOT EXISTS \(SELECT 1 FROM "PostAsset"/);
});
test('asset search is sent to the database while totals stay unfiltered', async () => {
  const calls = [];
  const query = async (sql, params) => {
    calls.push({ sql, params });
    return sql.includes('current_database')
      ? { rows: [{ name: 'oz_dev' }] }
      : sql.includes('count(*)')
        ? { rows: [{ total: 9, size: 100, unused: 2, unusedSize: 20 }] }
        : { rows: [] };
  };
  const result = await service('development', query).getAdminAssets({
    keyword: ' file ',
    filter: 'unused',
    sort: 'size',
  });
  assert.deepEqual(
    calls.find((call) => call.sql.includes('position(lower')).params,
    ['file', 'unused', 'size'],
  );
  assert.equal(result.totals.total, 9);
  await service('development', query).getAdminAssets({
    keyword: '',
    filter: 'invalid',
    sort: 'invalid',
  });
  assert.deepEqual(
    calls.filter((call) => call.sql.includes('position(lower')).at(-1).params,
    ['', 'all', 'new'],
  );
});
test('asset selection validates identifiers, duplicates and limit', () => {
  assert.equal(assetIdsValid([id]), true);
  for (const value of [
    [],
    [id, id.toUpperCase()],
    ['invalid'],
    Array(101).fill(id),
    null,
  ])
    assert.equal(assetIdsValid(value), false);
  assert.equal(formatAssetSize(1024), '1.0 KB');
});
test('deletion rechecks references while locked and restores a staged file on database failure', async () => {
  const url = 'http://localhost/api/admin/assets';
  const request = () =>
    new Request(url, {
      method: 'DELETE',
      headers: { Origin: 'http://localhost' },
      body: JSON.stringify([id]),
    });
  const calls = [];
  let used = true;
  const client = {
    query: async (sql) => {
      calls.push(sql);
      if (sql.includes('current_database'))
        return { rows: [{ name: 'oz_dev' }] };
      if (sql.includes('FOR UPDATE'))
        return { rows: [{ storageKey: `2026/10/${id}.png` }] };
      if (sql.includes('EXISTS')) return { rows: [{ used }] };
      if (sql.startsWith('DELETE')) throw Error('database failure');
      return { rows: [] };
    },
    release: () => {},
  };
  const moves = [];
  const fs = {
    realpath: async (p) => p,
    rename: async (a, b) => moves.push([a, b]),
    unlink: async () => {
      throw Error('unexpected unlink');
    },
  };
  const api = service(
    'development',
    async () => ({ rows: [{ name: 'oz_dev' }] }),
    { connect: async () => client, fs },
  );
  const first = await (await api.deleteAssetsRequest(request())).json();
  assert.equal(first.deleted, 0);
  assert.match(first.failures[0].message, /사용 중/);
  assert.equal(moves.length, 0);
  used = false;
  const second = await (await api.deleteAssetsRequest(request())).json();
  assert.equal(second.deleted, 0);
  assert.equal(moves.length, 2);
  assert.equal(moves[0][0], moves[1][1]);
  assert.equal(moves[0][1], moves[1][0]);
  assert.ok(calls.some((sql) => sql.includes('FOR UPDATE')));
  assert.ok(calls.includes('ROLLBACK'));
});
test('asset deletion rejects unauthenticated and cross-origin requests before DB access', async () => {
  for (const [mode, url, origin] of [
    ['production', 'http://localhost/api/admin/assets', 'http://localhost'],
    [
      'development',
      'http://example.com/api/admin/assets',
      'http://example.com',
    ],
    ['development', 'http://localhost/api/admin/assets', 'https://example.com'],
  ]) {
    const response = await service(mode).deleteAssetsRequest(
      new Request(url, {
        method: 'DELETE',
        headers: { Origin: origin },
        body: JSON.stringify([id]),
      }),
    );
    assert.equal(response.status, 403);
  }
});
test('asset deletion validates selection and reports per-file DB connection failures', async () => {
  const request = (body) =>
    new Request('http://localhost/api/admin/assets', {
      method: 'DELETE',
      headers: { Origin: 'http://localhost' },
      body: JSON.stringify(body),
    });
  assert.equal(
    (await service('development').deleteAssetsRequest(request([]))).status,
    400,
  );
  assert.equal(
    (
      await service('development', async () => ({
        rows: [{ name: 'production' }],
      })).deleteAssetsRequest(request([id]))
    ).status,
    200,
  );
});
