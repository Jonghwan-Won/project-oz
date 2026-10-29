import { checkGuideDatabase } from '@/server/services/guide';
import { getAdminSession } from '@/server/auth';

export async function GET(request: Request) {
  const headers = { 'Cache-Control': 'no-store' };
  if (
    process.env.NODE_ENV !== 'development' ||
    !(await getAdminSession(request.headers))
  ) {
    return Response.json(
      { ok: false, message: '찾을 수 없습니다.' },
      { status: 404, headers },
    );
  }
  const check = new URL(request.url).searchParams.get('check');
  if (check === 'api') {
    return Response.json(
      {
        ok: true,
        message: 'API 호출 성공',
        serverTime: new Date().toISOString(),
      },
      { headers },
    );
  }
  if (check === 'database') {
    const result = await checkGuideDatabase();
    return Response.json(result.body, { status: result.status, headers });
  }
  return Response.json(
    { ok: false, message: 'check는 api 또는 database여야 합니다.' },
    { status: 400, headers },
  );
}
