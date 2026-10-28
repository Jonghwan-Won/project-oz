import { isUploadedAsset } from './files';

export async function uploadFile(file: File, signal: AbortSignal) {
  const form = new FormData();
  form.set('file', file);
  const response = await fetch('/api/assets', {
    method: 'POST',
    signal,
    body: form,
  });
  const result: unknown = await response.json();
  if (!response.ok || !isUploadedAsset(result))
    throw Error(
      result &&
        typeof result === 'object' &&
        'message' in result &&
        typeof result.message === 'string'
        ? result.message
        : '업로드에 실패했습니다.',
    );
  return result;
}
