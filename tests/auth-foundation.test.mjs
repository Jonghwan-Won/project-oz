import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import ts from 'typescript';
const source = ts.transpileModule(
  readFileSync(new URL('../src/server/auth.ts', import.meta.url), 'utf8'),
  {
    compilerOptions: {
      module: ts.ModuleKind.CommonJS,
      target: ts.ScriptTarget.ES2022,
    },
  },
).outputText;
const config = {
  NODE_ENV: 'development',
  DATABASE_URL: 'configured',
  BETTER_AUTH_URL: 'http://localhost:3000',
  BETTER_AUTH_SECRET: 'x'.repeat(40),
  GITHUB_CLIENT_ID: 'client',
  GITHUB_CLIENT_SECRET: 'secret',
  GITHUB_ADMIN_ID: '123',
};
function service(env, session, match = true) {
  const calls = [];
  const exports = {};
  let options;
  new Function('require', 'exports', 'process', source)(
    (id) => {
      if (id === 'server-only') return {};
      if (id === 'better-auth/api') return { APIError: class extends Error {} };
      if (id === 'better-auth')
        return {
          betterAuth: (value) => {
            options = value;
            return {
              api: {
                getSession: async (args) => {
                  calls.push(args);
                  return session;
                },
              },
            };
          },
        };
      if (id === '@/server/db')
        return {
          pool: {
            query: async (sql, params) => {
              calls.push({ sql, params });
              return { rowCount: match ? 1 : 0 };
            },
          },
        };
      throw Error('unexpected import');
    },
    exports,
    { env },
  );
  return {
    api: exports,
    calls,
    get options() {
      return options;
    },
  };
}
test('authentication is unavailable without complete secure configuration', () => {
  for (const overrides of [
    { BETTER_AUTH_SECRET: '' },
    { GITHUB_CLIENT_ID: '' },
    { DATABASE_URL: '' },
    { BETTER_AUTH_URL: 'http://example.com' },
    { BETTER_AUTH_URL: 'invalid' },
    { NODE_ENV: 'production', BETTER_AUTH_URL: 'http://localhost:3000' },
  ])
    assert.equal(service({ ...config, ...overrides }).api.getAuth(), null);
  const result = service(config);
  assert.ok(result.api.getAuth());
  assert.equal(result.options.session.cookieCache.enabled, false);
  assert.equal(result.options.account.accountLinking.enabled, false);
  assert.equal(result.options.account.encryptOAuthTokens, true);
});
test('admin requires current session and matching GitHub provider identity', async () => {
  const headers = new Headers();
  const noSession = service(config, null);
  assert.equal(await noSession.api.getAdminSession(headers), null);
  assert.equal(noSession.calls.length, 1);
  const other = service(config, { user: { id: 'local-user' } }, false);
  assert.equal(await other.api.getAdminSession(headers), null);
  const admin = service(config, { user: { id: 'local-user' } }, true);
  assert.ok(await admin.api.getAdminSession(headers));
  assert.deepEqual(admin.calls[1].params, ['local-user', 'github', '123']);
  assert.equal(admin.calls[0].query.disableCookieCache, true);
  assert.equal(
    await service(
      { ...config, GITHUB_ADMIN_ID: '' },
      { user: { id: 'local-user' } },
    ).api.getAdminSession(headers),
    null,
  );
});

test('only the configured GitHub identity can complete sign-in', () => {
  const result = service(config);
  result.api.getAuth();
  const map = result.options.socialProviders.github.mapProfileToUser;
  assert.deepEqual(map({ id: 123 }), {});
  assert.throws(() => map({ id: 456 }));
  const missing = service({ ...config, GITHUB_ADMIN_ID: '' });
  missing.api.getAuth();
  assert.throws(() =>
    missing.options.socialProviders.github.mapProfileToUser({ id: 123 }),
  );
});
