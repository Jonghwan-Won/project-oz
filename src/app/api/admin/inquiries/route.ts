import { withRequestLogging } from '@/server/logging';
import { updateInquiryRequest } from '@/server/services/admin-inquiries';
export const PATCH = withRequestLogging(
  '/api/admin/inquiries',
  async (request: Request) => {
    return updateInquiryRequest(request);
  },
);
