import test from 'node:test';
import assert from 'node:assert/strict';
import { renderToStaticMarkup } from 'react-dom/server';
import { renderToReactElement } from '@tiptap/static-renderer/pm/react';
import {
  parseRichText,
  textDocument,
  richTextExtensions,
} from '../src/lib/rich-text.ts';

test('rich text preserves plain text and formatting without executing HTML', () => {
  const content = textDocument('<script>alert(1)</script>\nSecond line');
  content.content[0].content[0].marks = [{ type: 'bold' }];
  const parsed = parseRichText(content);
  assert.ok(parsed);
  const html = renderToStaticMarkup(
    renderToReactElement({ extensions: richTextExtensions, content: parsed }),
  );
  assert.match(html, /<strong>&lt;script&gt;/);
  assert.doesNotMatch(html, /<script/);
  assert.match(html, /Second line/);
});
test('rich text rejects unsupported nodes and marks and oversized documents', () => {
  assert.equal(
    parseRichText({ type: 'doc', content: [{ type: 'html', content: [] }] }),
    null,
  );
  assert.equal(
    parseRichText({
      type: 'doc',
      content: [
        {
          type: 'paragraph',
          content: [
            {
              type: 'text',
              text: 'x',
              marks: [{ type: 'link', attrs: { href: 'javascript:alert(1)' } }],
            },
          ],
        },
      ],
    }),
    null,
  );
  assert.equal(parseRichText(textDocument('x'.repeat(200001))), null);
  assert.equal(parseRichText(null), null);
});

test('uploaded image references render safely and reject external or embedded sources', () => {
  const doc = {
    type: 'doc',
    content: [
      {
        type: 'image',
        attrs: {
          src: '/api/assets/00000000-0000-0000-0000-000000000001',
          alt: 'A <photo>',
        },
      },
    ],
  };
  const parsed = parseRichText(doc);
  assert.ok(parsed);
  const html = renderToStaticMarkup(
    renderToReactElement({ extensions: richTextExtensions, content: parsed }),
  );
  assert.match(html, /<img/);
  assert.match(html, /src="\/api\/assets\//);
  assert.match(html, /alt="A &lt;photo&gt;"/);
  for (const src of [
    'javascript:alert(1)',
    'data:image/png;base64,AAAA',
    'https://other.example/picture.png',
    '/api/assets/../../secret',
  ]) {
    assert.equal(
      parseRichText({ ...doc, content: [{ type: 'image', attrs: { src } }] }),
      null,
    );
  }
});

test('tables preserve headers, rows and cells in the shared renderer', () => {
  const cell = (type, text) => ({
    type,
    content: [{ type: 'paragraph', content: [{ type: 'text', text }] }],
  });
  const content = parseRichText({
    type: 'doc',
    content: [
      {
        type: 'table',
        content: [
          { type: 'tableRow', content: [cell('tableHeader', '제목')] },
          { type: 'tableRow', content: [cell('tableCell', '내용')] },
        ],
      },
    ],
  });
  assert.ok(content);
  const html = renderToStaticMarkup(
    renderToReactElement({ extensions: richTextExtensions, content }),
  );
  assert.match(html, /<table/);
  assert.match(html, /<th/);
  assert.match(html, /<td/);
  assert.match(html, /내용/);
});

test('image dimensions persist and invalid dimensions are rejected', () => {
  const image = (width, height) => ({
    type: 'doc',
    content: [
      {
        type: 'image',
        attrs: {
          src: '/api/assets/00000000-0000-0000-0000-000000000001',
          width,
          height,
        },
      },
    ],
  });
  const content = parseRichText(image(320, 180));
  assert.ok(content);
  const html = renderToStaticMarkup(
    renderToReactElement({ extensions: richTextExtensions, content }),
  );
  assert.match(html, /width="320"/);
  assert.match(html, /height="180"/);
  for (const width of [-1, 0, 20001, '320', Infinity])
    assert.equal(parseRichText(image(width, 180)), null);
});
