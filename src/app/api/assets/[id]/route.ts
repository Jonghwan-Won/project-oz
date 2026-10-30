import { withRequestLogging } from '@/server/logging';
import { readAsset } from '@/server/services/assets';
export const runtime = 'nodejs';
export const GET = withRequestLogging(
  '/api/assets/[id]',
  async (request: Request, { params }: { params: Promise<{ id: string }> }) => {
    return readAsset(request, (await params).id);
  },
);
