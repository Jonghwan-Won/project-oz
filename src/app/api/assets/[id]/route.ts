import { readAsset } from '@/server/services/assets';
export const runtime = 'nodejs';
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  return readAsset(request, (await params).id);
}
