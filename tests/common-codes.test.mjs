import { loadRequestOrigin } from './request-origin-helper.mjs';
import test from 'node:test';
import assert from 'node:assert/strict';
import { validCodeInput } from '../src/lib/common-codes.ts';
import { readFileSync } from 'node:fs';
import ts from 'typescript';

const output = ts.transpileModule(
  readFileSync(
    new URL('../src/server/services/admin-codes.ts', import.meta.url),
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
    throw Error('Unexpected database access');
  },
) {
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
      if (id === '@/server/db') return { pool: { query } };
      if (id === '@/lib/common-codes') return { validCodeInput };
      throw Error(`Unexpected import ${id}`);
    },
    exports,
    { env: { NODE_ENV: mode } },
  );
  return exports;
}
test('code writes reject unauthenticated and cross-origin requests before database access', async () => {
  for (const [mode, url, origin] of [
    ['production', 'http://localhost/api/admin/codes', 'http://localhost'],
    ['development', 'http://example.com/api/admin/codes', 'http://example.com'],
    ['development', 'http://localhost/api/admin/codes', 'https://example.com'],
  ]) {
    const result = await service(mode).saveCodeRequest(
      new Request(url, {
        method: 'POST',
        headers: { Origin: origin },
        body: '{}',
      }),
    );
    assert.equal(result.status, 403);
  }
});
test('code writes reject invalid input and unavailable or conflicting rows', async () => {
  const url = 'http://localhost/api/admin/codes';
  const request = (body) =>
    new Request(url, {
      method: 'POST',
      headers: { Origin: 'http://localhost' },
      body: JSON.stringify(body),
    });
  assert.equal(
    (await service('development').saveCodeRequest(request({}))).status,
    400,
  );
  const query = async () => ({ rows: [{ name: 'production' }] });
  const valid = {
    kind: 'code',
    isNew: true,
    key: 'X',
    groupKey: 'G',
    nameKo: '이름',
    nameEn: 'Name',
    position: 0,
    isActive: true,
  };
  assert.equal(
    (await service('development', query).saveCodeRequest(request(valid)))
      .status,
    409,
  );
});

test('common codes validate identifiers, names, positions and revisions', () => {
  const code = {
    kind: 'code',
    isNew: true,
    key: 'NEXT_JS',
    groupKey: 'TECHNOLOGY',
    nameKo: 'Next.js',
    nameEn: 'Next.js',
    position: 0,
    isActive: true,
  };
  assert.equal(validCodeInput(code), true);
  for (const bad of [
    { key: 'bad code' },
    { nameKo: ' ' },
    { position: -1 },
    { position: 1.5 },
    { position: 2147483648 },
    { groupKey: '' },
    { isActive: 'true' },
    { isNew: false },
  ])
    assert.equal(validCodeInput({ ...code, ...bad }), false);
  assert.equal(
    validCodeInput({
      ...code,
      isNew: false,
      revision: '2026-10-29 10:00:00+00',
    }),
    true,
  );
  assert.equal(
    validCodeInput({ ...code, kind: 'group', description: '' }),
    true,
  );
  assert.equal(
    validCodeInput({ ...code, kind: 'group', description: 'x'.repeat(1001) }),
    false,
  );
});
