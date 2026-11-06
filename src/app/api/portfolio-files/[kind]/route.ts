import { withRequestLogging } from '@/server/logging';
import { readPortfolioFile } from '@/server/services/assets';
export const runtime = 'nodejs';
export const GET = withRequestLogging(
  '/api/portfolio-files/[kind]',
  async (
    _request: Request,
    { params }: { params: Promise<{ kind: string }> },
  ) => {
    return readPortfolioFile((await params).kind);
  },
);
