export const maxMarkdownBytes = 1024 * 1024;

/** 화면은 code로 locale에 맞는 문구를 고르고, message는 기본 한국어 설명으로 둔다. */
export class MarkdownFileError extends Error {
  code: 'extension' | 'size' | 'binary';
  constructor(code: 'extension' | 'size' | 'binary', message: string) {
    super(message);
    this.name = 'MarkdownFileError';
    this.code = code;
  }
}

export function validateMarkdownFile(file: { name: string; size: number }) {
  if (!/\.(md|markdown)$/i.test(file.name)) {
    throw new MarkdownFileError(
      'extension',
      '.md 또는 .markdown 파일을 선택해 주세요.',
    );
  }
  if (file.size > maxMarkdownBytes) {
    throw new MarkdownFileError('size', '1 MiB 이하의 파일을 선택해 주세요.');
  }
}

export function decodeMarkdown(buffer: ArrayBuffer) {
  const text = new TextDecoder('utf-8', { fatal: true }).decode(buffer);
  if (text.includes('\0'))
    throw new MarkdownFileError('binary', '텍스트 파일이 아닙니다.');
  return text;
}
