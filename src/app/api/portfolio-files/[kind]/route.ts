import { withRequestLogging } from '@/server/logging';
import { readPortfolioFile } from '@/server/services/assets';
export const runtime = 'nodejs';
export const GET = withRequestLogging(
  '/api/portfolio-files/[kind]',
  async (
    request: Request,
    { params }: { params: Promise<{ kind: string }> },
  ) => {
    // ?download=1이면 저장, 아니면 브라우저에서 바로 보기(inline)
    const download = new URL(request.url).searchParams.get('download') === '1';
    return readPortfolioFile((await params).kind, download);
  },
);
