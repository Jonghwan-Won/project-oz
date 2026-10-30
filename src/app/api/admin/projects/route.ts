import { withRequestLogging } from '@/server/logging';
import { saveProjectRequest } from '@/server/services/admin-projects';
export const POST = withRequestLogging(
  '/api/admin/projects',
  async (request: Request) => {
    return saveProjectRequest(request);
  },
);
export const DELETE = withRequestLogging(
  '/api/admin/projects',
  async (request: Request) => {
    return saveProjectRequest(request);
  },
);
