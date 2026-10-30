import { withRequestLogging } from '@/server/logging';
import { uploadAsset } from '@/server/services/assets';
export const runtime = 'nodejs';
export const POST = withRequestLogging(
  '/api/assets',
  async (request: Request) => {
    return uploadAsset(request);
  },
);
