import { withRequestLogging } from '@/server/logging';
import { deleteAssetsRequest } from '@/server/services/admin-assets';
export const DELETE = withRequestLogging(
  '/api/admin/assets',
  async (request: Request) => {
    return deleteAssetsRequest(request);
  },
);
