import { getAuth } from '@/server/auth';
export const dynamic = 'force-dynamic';
async function handle(request: Request) {
  const auth = getAuth();
  if (!auth)
    return Response.json(
      { message: '로그인 설정이 준비되지 않았습니다.' },
      { status: 503, headers: { 'Cache-Control': 'no-store' } },
    );
  return auth.handler(request);
}
export const GET = handle;
export const POST = handle;
