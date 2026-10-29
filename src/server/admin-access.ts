import 'server-only';
import { headers } from 'next/headers';
import { getAdminSession } from '@/server/auth';

export class AdminAccessError extends Error {
  readonly status = 403;
  constructor() {
    super('관리자 로그인이 필요합니다.');
  }
}
export async function requireAdmin(requestHeaders?: Headers) {
  const session = await getAdminSession(requestHeaders ?? (await headers()));
  if (!session) throw new AdminAccessError();
  return session;
}
