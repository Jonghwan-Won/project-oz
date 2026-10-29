import { saveCodeRequest } from '@/server/services/admin-codes';
export async function POST(request: Request) {
  return saveCodeRequest(request);
}
