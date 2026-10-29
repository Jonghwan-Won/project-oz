import { deleteAssetsRequest } from '@/server/services/admin-assets';
export async function DELETE(request: Request) {
  return deleteAssetsRequest(request);
}
