import { submitInquiry } from '@/server/services/inquiries';

export async function POST(request: Request) {
  return submitInquiry(request);
}
