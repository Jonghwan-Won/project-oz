import { loadRequestOrigin } from './request-origin-helper.mjs';
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import ts from 'typescript';

const require = createRequire(import.meta.url);
function service(pool) {
  const source = readFileSync('src/server/services/inquiries.ts', 'utf8');
  const code = ts.transpileModule(source, {
    compilerOptions: {
      module: ts.ModuleKind.CommonJS,
      target: ts.ScriptTarget.ES2022,
    },
  }).outputText;
  const exports = {};
  new Function('require', 'exports', code)(
    (id) =>
      id === '@/server/logging'
        ? { logError: () => {}, logEvent: () => {}, setLogUser: () => {} }
        : id === '@/server/request-origin'
          ? loadRequestOrigin()
          : id === 'server-only'
            ? {}
            : id === '@/server/db'
              ? { pool }
              : require(id),
    exports,
  );
  return exports.submitInquiry;
}
function request(body, origin = 'http://localhost') {
  return new Request('http://localhost/api/inquiries', {
    method: 'POST',
    headers: { origin },
    body,
  });
}

test('inquiries validate input and origin before accessing the database', async () => {
  const submit = service({
    connect: () => {
      throw Error('unexpected database access');
    },
  });
  for (const input of [
    { type: '2', body: 'text' },
    { type: '0', body: 'legacy number is rejected' },
    { type: 'BUG_REPORT', body: '  ' },
    { type: 'GENERAL', body: 'x'.repeat(4001) },
  ])
    assert.equal((await submit(request(JSON.stringify(input)))).status, 400);
  assert.equal((await submit(request('{'))).status, 400);
  assert.equal(
    (
      await submit(
        request(
          JSON.stringify({ type: 'BUG_REPORT', body: 'x' }),
          'https://other.example',
        ),
      )
    ).status,
    403,
  );
  assert.equal((await submit(request('x'.repeat(24001)))).status, 413);
});

test('inquiry writes commit or roll back and release the connection', async () => {
  for (const fail of [false, true]) {
    const calls = [];
    const submit = service({
      connect: async () => ({
        query: async (sql, values) => {
          calls.push([sql, values]);
          if (fail && sql.startsWith('INSERT')) throw Error('failed');
        },
        release: () => calls.push(['release']),
      }),
    });
    const result = await submit(
      request(JSON.stringify({ type: 'BUG_REPORT', body: ' report ' })),
    );
    assert.equal(result.status, fail ? 503 : 201);
    assert.equal(result.headers.get('cache-control'), 'no-store');
    assert.deepEqual(calls[1][1].slice(1), ['BUG_REPORT', 'report']);
    assert.equal(calls[2][0], fail ? 'ROLLBACK' : 'COMMIT');
    assert.equal(calls[3][0], 'release');
  }
});
