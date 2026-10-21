import { saveProjectRequest } from '@/server/services/admin-projects';
export async function POST(request: Request) {
  return saveProjectRequest(request);
}
export async function DELETE(request: Request) {
  return saveProjectRequest(request);
}
