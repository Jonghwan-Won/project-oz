import { withRequestLogging } from '@/server/logging';
import { checkGuideDatabase } from '@/server/services/guide';
import { getAdminSession } from '@/server/auth';
import { cookies } from 'next/headers';
import { guideMessagesFor } from '@/i18n/guide-server';
import { localeCookie, resolveLocale } from '@/i18n/locale';

export const GET = withRequestLogging(
  '/api/guide',
  async (request: Request) => {
    const headers = { 'Cache-Control': 'no-store' };
    // 응답 문구만 locale을 따르고 접근·입력 검증은 그대로 유지한다.
    const copy = guideMessagesFor(
      resolveLocale((await cookies()).get(localeCookie)?.value),
    ).api;
    if (
      process.env.NODE_ENV !== 'development' ||
      !(await getAdminSession(request.headers))
    ) {
      return Response.json(
        { ok: false, message: copy.notFound },
        { status: 404, headers },
      );
    }
    const check = new URL(request.url).searchParams.get('check');
    if (check === 'api') {
      return Response.json(
        {
          ok: true,
          message: copy.apiSuccess,
          serverTime: new Date().toISOString(),
        },
        { headers },
      );
    }
    if (check === 'database') {
      const result = await checkGuideDatabase(copy);
      return Response.json(result.body, { status: result.status, headers });
    }
    return Response.json(
      { ok: false, message: copy.invalidCheck },
      { status: 400, headers },
    );
  },
);
