import { withRequestLogging } from '@/server/logging';
import { savePostRequest } from '@/server/services/admin-posts';
export const POST = withRequestLogging(
  '/api/admin/posts',
  async (request: Request) => {
    return savePostRequest(request);
  },
);
export const DELETE = withRequestLogging(
  '/api/admin/posts',
  async (request: Request) => {
    return savePostRequest(request);
  },
);
