import 'server-only';
import { betterAuth } from 'better-auth';
import { APIError } from 'better-auth/api';
import { pool } from '@/server/db';
import { setLogUser } from '@/server/logging';

function createInstance(
  base: URL,
  secret: string,
  clientId: string,
  clientSecret: string,
) {
  return betterAuth({
    database: pool,
    baseURL: base.origin,
    secret,
    socialProviders: {
      github: {
        clientId,
        clientSecret,
        mapProfileToUser(profile) {
          const owner = process.env.GITHUB_ADMIN_ID;
          if (
            !owner ||
            !/^[1-9]\d*$/.test(owner) ||
            String(profile.id) !== owner
          )
            throw new APIError('FORBIDDEN', {
              message: '지정된 관리자 계정만 로그인할 수 있습니다.',
            });
          return {};
        },
      },
    },
    user: { modelName: 'AuthUser' },
    session: {
      modelName: 'AuthSession',
      expiresIn: 60 * 60 * 24,
      updateAge: 60 * 60,
      cookieCache: { enabled: false },
    },
    account: {
      modelName: 'AuthAccount',
      encryptOAuthTokens: true,
      accountLinking: { enabled: false },
    },
    verification: { modelName: 'AuthVerification' },
    advanced: { useSecureCookies: base.protocol === 'https:' },
  });
}
let instance: ReturnType<typeof createInstance> | undefined;
export function getAuth() {
  const {
    BETTER_AUTH_SECRET,
    BETTER_AUTH_URL,
    GITHUB_CLIENT_ID,
    GITHUB_CLIENT_SECRET,
    DATABASE_URL,
  } = process.env;
  if (
    !DATABASE_URL ||
    !BETTER_AUTH_SECRET ||
    BETTER_AUTH_SECRET.length < 32 ||
    !BETTER_AUTH_URL ||
    !GITHUB_CLIENT_ID ||
    !GITHUB_CLIENT_SECRET
  )
    return null;
  let base: URL;
  try {
    base = new URL(BETTER_AUTH_URL);
  } catch {
    return null;
  }
  if (
    base.protocol !== 'https:' &&
    !(
      process.env.NODE_ENV === 'development' &&
      base.protocol === 'http:' &&
      ['localhost', '127.0.0.1'].includes(base.hostname)
    )
  )
    return null;
  instance ??= createInstance(
    base,
    BETTER_AUTH_SECRET,
    GITHUB_CLIENT_ID,
    GITHUB_CLIENT_SECRET,
  );
  return instance;
}

export async function getAdminSession(headers: Headers) {
  const auth = getAuth();
  const owner = process.env.GITHUB_ADMIN_ID;
  if (!auth || !owner || !/^[1-9]\d*$/.test(owner)) return null;
  const session = await auth.api.getSession({
    headers,
    query: { disableCookieCache: true },
  });
  if (!session) return null;
  const result = await pool.query(
    'SELECT 1 FROM "AuthAccount" WHERE "userId"=$1 AND "providerId"=$2 AND "accountId"=$3 LIMIT 1',
    [session.user.id, 'github', owner],
  );
  if (result.rowCount !== 1) return null;
  setLogUser(session.user.id);
  return session;
}
