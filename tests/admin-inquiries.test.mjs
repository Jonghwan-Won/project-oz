import { loadRequestOrigin } from './request-origin-helper.mjs';
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import ts from 'typescript';
import { validInquiryUpdate } from '../src/lib/admin-inquiries.ts';
const output = ts.transpileModule(
  readFileSync(
    new URL('../src/server/services/admin-inquiries.ts', import.meta.url),
    'utf8',
  ),
  {
    compilerOptions: {
      module: ts.ModuleKind.CommonJS,
      target: ts.ScriptTarget.ES2022,
    },
  },
).outputText;
function service(
  mode,
  query = () => {
    throw Error('Unexpected DB access');
  },
) {
  const exports = {};
  new Function('require', 'exports', 'process', output)(
    (id) => {
      if (id === '@/server/logging')
        return { logError: () => {}, logEvent: () => {}, setLogUser: () => {} };
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
      if (id === '@/server/db') return { pool: { query } };
      if (id === '@/lib/admin-inquiries') return { validInquiryUpdate };
      throw Error('Unexpected import');
    },
    exports,
    { env: { NODE_ENV: mode } },
  );
  return exports;
}
const input = {
  id: 'e56a7a2b-1234-4234-8234-123456789abc',
  status: '1',
  revision: '2026-10-29 10:00:00+00',
};
test('dashboard counts only inquiries in pending status', async () => {
  const calls = [];
  const query = async (sql, params) => {
    calls.push({ sql, params });
    return sql.includes('current_database')
      ? { rows: [{ name: 'oz_dev' }] }
      : { rows: [{ count: 3 }] };
  };
  assert.equal(await service('development', query).getPendingInquiryCount(), 3);
  assert.deepEqual(calls[0].params, ['INQUIRY_STATUS', '0']);
});
test('inquiry status input validates identity, status and revision', () => {
  assert.equal(validInquiryUpdate(input), true);
  for (const bad of [
    { id: 'bad' },
    { status: '' },
    { status: 'bad code' },
    { revision: '' },
    { revision: 'x'.repeat(101) },
  ])
    assert.equal(validInquiryUpdate({ ...input, ...bad }), false);
});
test('inquiry updates reject unauthenticated and cross-origin access', async () => {
  for (const [mode, url, origin] of [
    ['production', 'http://localhost/api/admin/inquiries', 'http://localhost'],
    [
      'development',
      'http://example.com/api/admin/inquiries',
      'http://example.com',
    ],
    [
      'development',
      'http://localhost/api/admin/inquiries',
      'https://example.com',
    ],
  ]) {
    const r = await service(mode).updateInquiryRequest(
      new Request(url, {
        method: 'PATCH',
        headers: { Origin: origin },
        body: JSON.stringify(input),
      }),
    );
    assert.equal(r.status, 403);
  }
});
test('updates reject invalid input and stale or inactive status', async () => {
  const request = (value) =>
    new Request('http://localhost/api/admin/inquiries', {
      method: 'PATCH',
      headers: { Origin: 'http://localhost' },
      body: JSON.stringify(value),
    });
  assert.equal(
    (await service('development').updateInquiryRequest(request({}))).status,
    400,
  );
  assert.equal(
    (
      await service('development', async () => ({
        rows: [{ name: 'production' }],
      })).updateInquiryRequest(request(input))
    ).status,
    409,
  );
  const calls = [];
  const query = async (sql, params) => {
    calls.push({ sql, params });
    return sql.includes('current_database')
      ? { rows: [{ name: 'oz_dev' }] }
      : { rowCount: 0, rows: [] };
  };
  assert.equal(
    (await service('development', query).updateInquiryRequest(request(input)))
      .status,
    409,
  );
  assert.match(calls[0].sql, /"updatedAt"=\$3::timestamptz/);
  assert.match(calls[0].sql, /"isActive"/);
  assert.deepEqual(calls[0].params, [input.id, input.status, input.revision]);
});
