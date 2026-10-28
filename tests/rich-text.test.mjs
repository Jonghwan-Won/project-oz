import test from 'node:test';
import assert from 'node:assert/strict';
import { renderToStaticMarkup } from 'react-dom/server';
import { renderToReactElement } from '@tiptap/static-renderer/pm/react';
import {
  parseRichText,
  textDocument,
  richTextExtensions,
} from '../src/lib/rich-text.ts';

test('quote styles survive validation and rendering while invalid styles are rejected', () => {
  const doc = (attrs) => ({
    type: 'doc',
    content: [
      {
        type: 'blockquote',
        attrs,
        content: [
          { type: 'paragraph', content: [{ type: 'text', text: '인용' }] },
        ],
      },
    ],
  });
  const quotation = parseRichText(doc({ quoteStyle: 'quotation' }));
  assert.equal(quotation.content[0].attrs.quoteStyle, 'quotation');
  const html = renderToStaticMarkup(
    renderToReactElement({
      extensions: richTextExtensions,
      content: quotation,
    }),
  );
  assert.match(html, /data-quote-style="quotation"/);
  assert.ok(parseRichText(doc(undefined)));
  assert.equal(parseRichText(doc({ quoteStyle: 'invalid' })), null);
});

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
test('editor formatting and safe links survive validation and rendering', () => {
  const text = (marks) => ({
    type: 'doc',
    content: [
      {
        type: 'paragraph',
        attrs: { indent: 2 },
        content: [{ type: 'text', text: '예시', marks }],
      },
    ],
  });
  const content = parseRichText(
    text([
      { type: 'strike' },
      {
        type: 'textStyle',
        attrs: { color: '#123456', backgroundColor: '#fedcba' },
      },
      { type: 'link', attrs: { href: 'https://example.com' } },
    ]),
  );
  assert.ok(content);
  const html = renderToStaticMarkup(
    renderToReactElement({ extensions: richTextExtensions, content }),
  );
  assert.match(html, /<s>/);
  assert.match(html, /color:\s*#123456/);
  assert.match(html, /background-color:\s*#fedcba/);
  assert.match(html, /href="https:\/\/example.com"/);
  assert.match(html, /rel="noopener noreferrer nofollow"/);
  assert.match(html, /data-indent="2"/);
  for (const href of [
    'javascript:alert(1)',
    '//evil.example',
    'https://user:pass@example.com',
  ])
    assert.equal(
      parseRichText(text([{ type: 'link', attrs: { href } }])),
      null,
    );
  assert.equal(
    parseRichText(
      text([{ type: 'textStyle', attrs: { color: 'red;display:none' } }]),
    ),
    null,
  );
  assert.equal(
    parseRichText({
      type: 'doc',
      content: [{ type: 'paragraph', attrs: { indent: 7 } }],
    }),
    null,
  );
});

test('table cell styles and quotation alignment are validated and rendered', () => {
  const doc = {
    type: 'doc',
    content: [
      {
        type: 'blockquote',
        attrs: { quoteStyle: 'quotation', textAlign: 'right' },
        content: [
          { type: 'paragraph', content: [{ type: 'text', text: '인용' }] },
        ],
      },
      {
        type: 'table',
        content: [
          {
            type: 'tableRow',
            content: [
              {
                type: 'tableCell',
                attrs: {
                  backgroundColor: '#abcdef',
                  borderColor: '#123456',
                  borderWidth: 2,
                  borderStyle: 'dashed',
                  verticalAlign: 'middle',
                },
                content: [{ type: 'paragraph' }],
              },
            ],
          },
        ],
      },
    ],
  };
  const content = parseRichText(doc);
  assert.ok(content);
  const html = renderToStaticMarkup(
    renderToReactElement({ extensions: richTextExtensions, content }),
  );
  assert.match(html, /data-text-align="right"/);
  assert.match(html, /data-cell-background="#abcdef"/);
  assert.match(html, /border-width:\s*2px/);
  assert.match(html, /border-style:\s*dashed/);
  assert.match(html, /vertical-align:\s*middle/);
  const bad = structuredClone(doc);
  bad.content[1].content[0].content[0].attrs.borderColor = 'red;display:none';
  assert.equal(parseRichText(bad), null);
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
  const local = 'blob:https://example.com/local-image';
  const localDoc = {
    ...doc,
    content: [{ type: 'image', attrs: { src: local } }],
  };
  assert.equal(parseRichText(localDoc), null);
  assert.ok(parseRichText(localDoc, new Set([local])));
  assert.equal(parseRichText(localDoc, new Set()), null);
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

test('quote Enter exits the quote and preserves text on both sides of the cursor', async () => {
  const { Editor } = await import('@tiptap/core');
  for (const quoteStyle of [null, 'quotation']) {
    const editor = new Editor({
      element: null,
      extensions: richTextExtensions,
      content: {
        type: 'doc',
        content: [
          {
            type: 'blockquote',
            attrs: { quoteStyle },
            content: [
              { type: 'paragraph', content: [{ type: 'text', text: 'abcd' }] },
            ],
          },
        ],
      },
    });
    editor.commands.setTextSelection(4);
    const extension = richTextExtensions.find(
      (item) => item.name === 'quoteStyle',
    );
    const shortcuts = extension.config.addKeyboardShortcuts.call({ editor });
    assert.equal(shortcuts.Enter(), true);
    assert.equal(editor.getJSON().content[0].type, 'blockquote');
    assert.equal(editor.getJSON().content[0].content[0].content[0].text, 'ab');
    assert.equal(editor.getJSON().content[1].type, 'paragraph');
    assert.equal(editor.getJSON().content[1].content[0].text, 'cd');
    editor.destroy();
  }
});

test('table properties survive saving and reject arbitrary CSS', () => {
  const doc = (tableAttrs, cellAttrs) => ({
    type: 'doc',
    content: [
      {
        type: 'table',
        attrs: tableAttrs,
        content: [
          {
            type: 'tableRow',
            content: [
              {
                type: 'tableCell',
                attrs: cellAttrs,
                content: [{ type: 'paragraph' }],
              },
            ],
          },
        ],
      },
    ],
  });
  const value = parseRichText(
    doc(
      { tableWidth: '75%', tableAlign: 'auto', tableLayout: 'fixed' },
      {
        cellPadding: '12px',
        cellWrap: 'nowrap',
        cellAlign: 'right',
        borderStyle: 'none',
      },
    ),
  );
  assert.ok(value);
  const html = renderToStaticMarkup(
    renderToReactElement({ extensions: richTextExtensions, content: value }),
  );
  assert.match(html, /width:75%/);
  assert.match(html, /padding:12px/);
  assert.match(html, /white-space:nowrap/);
  assert.equal(
    parseRichText(doc({ tableWidth: 'expression(alert(1))' }, {})),
    null,
  );
  assert.equal(parseRichText(doc({}, { cellPadding: '-999px' })), null);
});

test('code typing stays in its block and quote soft breaks retain quotation', async () => {
  const { Editor } = await import('@tiptap/core');
  const editor = new Editor({
    element: null,
    extensions: richTextExtensions,
    content: { type: 'doc', content: [{ type: 'codeBlock' }] },
  });
  editor.commands.setTextSelection(1);
  for (const letter of 'abcdef')
    editor.commands.insertContent({ type: 'text', text: letter });
  assert.equal(editor.getJSON().content[0].type, 'codeBlock');
  assert.equal(editor.getJSON().content[0].content[0].text, 'abcdef');
  assert.equal(editor.state.selection.$from.parent.type.name, 'codeBlock');
  const shortcuts = richTextExtensions
    .find((item) => item.name === 'quoteStyle')
    .config.addKeyboardShortcuts.call({ editor });
  assert.equal(shortcuts.Enter(), false);
  editor.commands.setContent({
    type: 'doc',
    content: [
      {
        type: 'blockquote',
        content: [
          { type: 'paragraph', content: [{ type: 'text', text: 'ab' }] },
        ],
      },
    ],
  });
  editor.commands.setTextSelection(3);
  editor.commands.setHardBreak();
  assert.equal(
    editor.getJSON().content[0].content[0].content[1].type,
    'hardBreak',
  );
  editor.commands.setContent({
    type: 'doc',
    content: [{ type: 'blockquote', content: [{ type: 'paragraph' }] }],
  });
  editor.commands.setTextSelection(2);
  assert.equal(shortcuts.Enter(), true);
  assert.equal(editor.getJSON().content[0].type, 'paragraph');
  editor.destroy();
});

test('whole-table resizing scales columns and rows together and clamps dimensions', async () => {
  const { getScaledTableSize } = await import('../src/lib/rich-text.ts');
  assert.deepEqual(getScaledTableSize([120, 240], [40, 80], 1.5), {
    widths: [180, 360],
    heights: [60, 120],
  });
  assert.deepEqual(getScaledTableSize([120, 240], [40, 80], 0.1), {
    widths: [60, 120],
    heights: [20, 40],
  });
  const maximum = getScaledTableSize([120, 240], [40, 80], 1000);
  assert.deepEqual(maximum, { widths: [3000, 6000], heights: [1000, 2000] });
  assert.equal(getScaledTableSize([0], [40], 1), null);
  assert.equal(getScaledTableSize([120], [40], NaN), null);
});

test('resizing merged cells persists all dimensions and undo restores the whole table', async () => {
  const { applyTableSize } = await import('../src/lib/rich-text.ts');
  const { getSchema } = await import('@tiptap/core');
  const { EditorState } = await import('@tiptap/pm/state');
  const { history, undo } = await import('@tiptap/pm/history');
  const schema = getSchema(richTextExtensions);
  const cell = (attrs = {}) => ({
    type: 'tableCell',
    attrs,
    content: [{ type: 'paragraph' }],
  });
  const doc = schema.nodeFromJSON({
    type: 'doc',
    content: [
      {
        type: 'table',
        content: [
          {
            type: 'tableRow',
            content: [cell({ rowspan: 2 }), cell({ colspan: 2 })],
          },
          { type: 'tableRow', content: [cell(), cell()] },
        ],
      },
    ],
  });
  let state = EditorState.create({ schema, doc, plugins: [history()] });
  const tr = state.tr;
  assert.equal(
    applyTableSize(tr, 0, { widths: [120, 180, 240], heights: [60, 90] }),
    true,
  );
  state = state.apply(tr);
  const parsed = parseRichText(state.doc.toJSON());
  assert.ok(parsed);
  const table = parsed.content[0];
  assert.equal(table.attrs.tableWidth, '540px');
  assert.deepEqual(table.content[0].content[1].attrs.colwidth, [180, 240]);
  assert.deepEqual(table.content[1].content[0].attrs.colwidth, [180]);
  assert.equal(table.content[0].content[0].attrs.rowspan, 2);
  assert.equal(table.content[1].attrs.rowHeight, 90);
  const html = renderToStaticMarkup(
    renderToReactElement({ extensions: richTextExtensions, content: parsed }),
  );
  assert.match(html, /width:540px/);
  assert.match(html, /height:90px/);
  assert.equal(
    undo(state, (transaction) => {
      state = state.apply(transaction);
    }),
    true,
  );
  assert.ok(state.doc.eq(doc));
  assert.equal(
    applyTableSize(state.tr, 0, { widths: [60], heights: [40] }),
    false,
  );
  table.attrs.tableWidth = '999999px';
  assert.equal(parseRichText(parsed), null);
});

test('selection-only table updates preserve an active resize preview', () => {
  const View = richTextExtensions.find(
    (extension) => extension.name === 'tableKit',
  ).options.table.View;
  const node = {};
  let cancelled = false;
  const view = {
    node,
    stopResize: () => {
      cancelled = true;
    },
  };
  assert.equal(View.prototype.update.call(view, node), true);
  assert.equal(cancelled, false);
});
