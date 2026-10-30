import { withRequestLogging } from '@/server/logging';
import { submitInquiry } from '@/server/services/inquiries';

export const POST = withRequestLogging(
  '/api/inquiries',
  async (request: Request) => {
    return submitInquiry(request);
  },
);
