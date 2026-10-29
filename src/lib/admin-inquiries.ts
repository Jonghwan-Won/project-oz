export const emptyInquirySearch = { type: '', status: '', keyword: '' };
export type InquiryRow = {
  id: string;
  typeCode: string;
  typeName: string;
  statusCode: string;
  statusName: string;
  body: string;
  createdAt: string;
  revision: string;
};
export type InquiryCode = { code: string; name: string; isActive: boolean };
export function validInquiryUpdate(
  input: unknown,
): input is { id: string; status: string; revision: string } {
  if (!input || typeof input !== 'object' || Array.isArray(input)) return false;
  const v = input as Record<string, unknown>;
  return (
    typeof v.id === 'string' &&
    /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
      v.id,
    ) &&
    typeof v.status === 'string' &&
    /^[A-Za-z0-9_-]{1,60}$/.test(v.status) &&
    typeof v.revision === 'string' &&
    v.revision.length > 0 &&
    v.revision.length <= 100
  );
}
