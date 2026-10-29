import assert from 'node:assert/strict';
import { createHmac, randomUUID } from 'node:crypto';
import { readFileSync, existsSync } from 'node:fs';
import { loadEnvFile } from 'node:process';
import pg from 'pg';
import { betterAuth } from 'better-auth';

if (existsSync('.env.local')) loadEnvFile('.env.local');
if (!process.env.MIGRATION_DATABASE_URL)
  throw Error('MIGRATION_DATABASE_URL is required');
const schema = `oz_auth_test_${randomUUID().replaceAll('-', '')}`;
const admin = new pg.Client({
  connectionString: process.env.MIGRATION_DATABASE_URL,
  connectionTimeoutMillis: 5000,
});
let created = false,
  pool;
try {
  await admin.connect();
  assert.equal(
    (await admin.query('SELECT current_database() AS name')).rows[0].name,
    'oz_dev',
  );
  await admin.query(`CREATE SCHEMA "${schema}"`);
  created = true;
  await admin.query(`SET search_path TO "${schema}"`);
  await admin.query(
    readFileSync(
      new URL(
        '../prisma/migrations/20261029000000_auth_foundation/migration.sql',
        import.meta.url,
      ),
      'utf8',
    ),
  );
  pool = new pg.Pool({
    connectionString: process.env.MIGRATION_DATABASE_URL,
    options: `-c search_path=${schema}`,
    connectionTimeoutMillis: 5000,
  });
  const secret = 'test-only-secret-with-sufficient-entropy-123456789';
  const auth = betterAuth({
    database: pool,
    baseURL: 'http://localhost:3000',
    secret,
    user: { modelName: 'AuthUser' },
    session: { modelName: 'AuthSession', cookieCache: { enabled: false } },
    account: {
      modelName: 'AuthAccount',
      encryptOAuthTokens: true,
      accountLinking: { enabled: false },
    },
    verification: { modelName: 'AuthVerification' },
  });
  await pool.query(
    'INSERT INTO "AuthUser" (id,name,email,"emailVerified","updatedAt") VALUES ($1,$2,$3,false,now())',
    ['test-user', 'Test', 'test@example.invalid'],
  );
  const token = randomUUID();
  await pool.query(
    'INSERT INTO "AuthSession" (id,"userId",token,"expiresAt","updatedAt") VALUES ($1,$2,$3,now()+interval \'1 hour\',now())',
    ['test-session', 'test-user', token],
  );
  const signature = createHmac('sha256', secret).update(token).digest('base64');
  const headers = new Headers({
    cookie: `better-auth.session_token=${encodeURIComponent(`${token}.${signature}`)}`,
  });
  assert.equal(
    (
      await auth.api.getSession({
        headers,
        query: { disableCookieCache: true },
      })
    )?.user.id,
    'test-user',
  );
  await pool.query(
    'UPDATE "AuthSession" SET "expiresAt"=now()-interval \'1 minute\' WHERE id=$1',
    ['test-session'],
  );
  assert.equal(
    await auth.api.getSession({ headers, query: { disableCookieCache: true } }),
    null,
  );
  await pool.query(
    'INSERT INTO "AuthSession" (id,"userId",token,"expiresAt","updatedAt") VALUES ($1,$2,$3,now()+interval \'1 hour\',now()) ON CONFLICT (id) DO UPDATE SET "expiresAt"=excluded."expiresAt"',
    ['test-session', 'test-user', token],
  );
  const response = await auth.handler(
    new Request('http://localhost:3000/api/auth/sign-out', {
      method: 'POST',
      headers: {
        cookie: headers.get('cookie'),
        origin: 'http://localhost:3000',
        'content-type': 'application/json',
      },
      body: '{}',
    }),
  );
  assert.equal(response.status, 200);
  assert.equal(
    await auth.api.getSession({ headers, query: { disableCookieCache: true } }),
    null,
  );
  console.log('Auth schema, session, expiry and revocation verified.');
} catch (error) {
  console.error('Auth smoke failed:', error.code ?? error.name, error.message);
  process.exitCode = 1;
} finally {
  if (pool) await pool.end();
  if (created) await admin.query(`DROP SCHEMA "${schema}" CASCADE`);
  await admin.end();
}
