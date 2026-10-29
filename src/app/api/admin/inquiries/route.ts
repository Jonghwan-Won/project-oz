import { updateInquiryRequest } from '@/server/services/admin-inquiries';
export async function PATCH(request: Request) {
  return updateInquiryRequest(request);
}
