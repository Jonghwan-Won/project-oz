export const maxUploadBytes = 10 * 1024 * 1024;
export type UploadedAsset = {
  id: string;
  name: string;
  size: number;
  mimeType: string;
  url: string;
  downloadUrl: string;
};
export function thumbnailUrl(value: string): boolean {
  if (!value) return true;
  if (/^\/(?![\/\\])/.test(value)) return !/[\\\r\n]/.test(value);
  try {
    const url = new URL(value);
    return (
      ['http:', 'https:'].includes(url.protocol) &&
      !url.username &&
      !url.password
    );
  } catch {
    return false;
  }
}
export function fileFormat(
  bytes: Uint8Array,
  name: string,
  mime: string,
): { extension: string; mimeType: string } | null {
  const hex = (start: number, values: number[]) =>
    values.every((v, i) => bytes[start + i] === v);
  const ascii = (start: number, text: string) =>
    [...text].every((v, i) => bytes[start + i] === v.charCodeAt(0));
  const ext = name.split('.').at(-1)?.toLowerCase();
  if (
    ext === 'png' &&
    mime === 'image/png' &&
    hex(0, [137, 80, 78, 71, 13, 10, 26, 10])
  )
    return { extension: 'png', mimeType: 'image/png' };
  if (
    ['jpg', 'jpeg'].includes(ext ?? '') &&
    mime === 'image/jpeg' &&
    hex(0, [255, 216, 255])
  )
    return { extension: 'jpg', mimeType: 'image/jpeg' };
  if (
    ext === 'webp' &&
    mime === 'image/webp' &&
    ascii(0, 'RIFF') &&
    ascii(8, 'WEBP')
  )
    return { extension: 'webp', mimeType: 'image/webp' };
  if (ext === 'pdf' && mime === 'application/pdf' && ascii(0, '%PDF-'))
    return { extension: 'pdf', mimeType: 'application/pdf' };
  return null;
}

export function isUploadedAsset(value: unknown): value is UploadedAsset {
  if (!value || typeof value !== 'object') return false;
  return (
    'id' in value &&
    typeof value.id === 'string' &&
    /^[0-9a-f-]{36}$/.test(value.id) &&
    'name' in value &&
    typeof value.name === 'string' &&
    'size' in value &&
    typeof value.size === 'number' &&
    'mimeType' in value &&
    typeof value.mimeType === 'string' &&
    'url' in value &&
    value.url === '/api/assets/' + value.id &&
    'downloadUrl' in value &&
    value.downloadUrl === value.url + '?download=1'
  );
}
