export const maxMarkdownBytes = 1024 * 1024;

export function validateMarkdownFile(file: { name: string; size: number }) {
  if (!/\.(md|markdown)$/i.test(file.name)) {
    throw new Error('.md 또는 .markdown 파일을 선택해 주세요.');
  }
  if (file.size > maxMarkdownBytes) {
    throw new Error('1 MiB 이하의 파일을 선택해 주세요.');
  }
}

export function decodeMarkdown(buffer: ArrayBuffer) {
  const text = new TextDecoder('utf-8', { fatal: true }).decode(buffer);
  if (text.includes('\0')) throw new Error('텍스트 파일이 아닙니다.');
  return text;
}
