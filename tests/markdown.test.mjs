import test from 'node:test';
import assert from 'node:assert/strict';
import {
  decodeMarkdown,
  maxMarkdownBytes,
  validateMarkdownFile,
} from '../src/app/guide/markdown/file.ts';

test('Markdown upload accepts supported names and rejects wrong formats and oversized files', () => {
  assert.doesNotThrow(() =>
    validateMarkdownFile({ name: '작업일지.MD', size: maxMarkdownBytes }),
  );
  assert.doesNotThrow(() =>
    validateMarkdownFile({ name: 'notes.markdown', size: 0 }),
  );
  assert.throws(
    () => validateMarkdownFile({ name: 'notes.md.html', size: 10 }),
    /파일을 선택/,
  );
  assert.throws(
    () =>
      validateMarkdownFile({ name: 'large.md', size: maxMarkdownBytes + 1 }),
    /1 MiB/,
  );
});

test('Markdown decoding preserves UTF-8 and rejects invalid encoding and binary content', () => {
  assert.equal(
    decodeMarkdown(new TextEncoder().encode('# 한글 문서').buffer),
    '# 한글 문서',
  );
  assert.equal(decodeMarkdown(new ArrayBuffer(0)), '');
  assert.throws(() => decodeMarkdown(new Uint8Array([0xff]).buffer), TypeError);
  assert.throws(
    () => decodeMarkdown(new Uint8Array([65, 0, 66]).buffer),
    /텍스트 파일/,
  );
});
