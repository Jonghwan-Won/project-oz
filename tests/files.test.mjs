import test from 'node:test';
import assert from 'node:assert/strict';
import { fileFormat, thumbnailUrl, isUploadedAsset } from '../src/lib/files.ts';
test('uploads require matching extension, MIME and file signature', () => {
  const png = new Uint8Array([137, 80, 78, 71, 13, 10, 26, 10]);
  assert.equal(fileFormat(png, 'image.png', 'image/png').extension, 'png');
  assert.equal(fileFormat(png, 'image.pdf', 'application/pdf'), null);
  assert.equal(
    fileFormat(
      new TextEncoder().encode('<svg onload="alert(1)"/>'),
      'image.svg',
      'image/svg+xml',
    ),
    null,
  );
  assert.equal(fileFormat(new Uint8Array(), 'fake.png', 'image/png'), null);
});
test('thumbnail URLs reject script/data URLs, credentials and protocol-relative hosts', () => {
  for (const url of ['https://example.com/a.png', '/api/assets/abc', ''])
    assert.equal(thumbnailUrl(url), true);
  for (const url of [
    'javascript:alert(1)',
    'data:image/svg+xml,test',
    '//example.com/a',
    'https://user:pass@example.com/a',
    '/\\evil',
  ])
    assert.equal(thumbnailUrl(url), false);
  assert.equal(isUploadedAsset({ id: 'x', url: 'https://evil.test' }), false);
});
