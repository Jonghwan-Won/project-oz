import { withRequestLogging } from '@/server/logging';
import { saveCodeRequest } from '@/server/services/admin-codes';
export const POST = withRequestLogging(
  '/api/admin/codes',
  async (request: Request) => {
    return saveCodeRequest(request);
  },
);
