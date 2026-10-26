import { savePostRequest } from '@/server/services/admin-posts';
export async function POST(request: Request) {
  return savePostRequest(request);
}
export async function DELETE(request: Request) {
  return savePostRequest(request);
}
