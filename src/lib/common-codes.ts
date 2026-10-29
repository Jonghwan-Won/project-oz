export type CodeGroup = {
  key: string;
  nameKo: string;
  nameEn: string;
  description: string;
  isActive: boolean;
  revision: string;
};
export type CodeItem = {
  groupKey: string;
  code: string;
  nameKo: string;
  nameEn: string;
  position: number;
  isActive: boolean;
  revision: string;
};

export function validCodeInput(
  input: unknown,
): input is Record<string, unknown> {
  if (!input || typeof input !== 'object' || Array.isArray(input)) return false;
  const v = input as Record<string, unknown>;
  const key = (x: unknown) =>
    typeof x === 'string' && /^[A-Za-z0-9_-]{1,60}$/.test(x);
  const name = (x: unknown) =>
    typeof x === 'string' && x.trim().length > 0 && x.length <= 100;
  return (
    (v.kind === 'group' || v.kind === 'code') &&
    typeof v.isNew === 'boolean' &&
    key(v.key) &&
    name(v.nameKo) &&
    name(v.nameEn) &&
    typeof v.isActive === 'boolean' &&
    (v.isNew ||
      (typeof v.revision === 'string' &&
        v.revision.length > 0 &&
        v.revision.length <= 100)) &&
    (v.kind === 'group'
      ? typeof v.description === 'string' && v.description.length <= 1000
      : key(v.groupKey) &&
        typeof v.position === 'number' &&
        Number.isInteger(v.position) &&
        v.position >= 0 &&
        v.position <= 2147483647)
  );
}
