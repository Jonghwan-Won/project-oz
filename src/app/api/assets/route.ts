import { uploadAsset } from '@/server/services/assets';
export const runtime = 'nodejs';
export async function POST(request: Request) {
  return uploadAsset(request);
}
