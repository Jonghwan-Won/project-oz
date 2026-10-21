import { TableKit } from '@tiptap/extension-table';
import Image from '@tiptap/extension-image';
import { getSchema, type JSONContent } from '@tiptap/core';
import StarterKit from '@tiptap/starter-kit';

export const richTextExtensions = [
  TableKit.configure({ table: { resizable: false } }),
  StarterKit.configure({ link: false, heading: { levels: [2, 3] } }),
  Image.extend({
    parseHTML() {
      return [
        {
          tag: 'img[src]',
          getAttrs: (element) =>
            /^\/api\/assets\/[0-9a-f-]{36}$/i.test(
              element.getAttribute('src') ?? '',
            )
              ? null
              : false,
        },
      ];
    },
  }).configure({
    allowBase64: false,
    resize: {
      enabled: true,
      directions: ['top-left', 'top-right', 'bottom-left', 'bottom-right'],
      minWidth: 50,
      minHeight: 50,
      alwaysPreserveAspectRatio: true,
    },
  }),
];
const schema = getSchema(richTextExtensions);
export function textDocument(text: string): JSONContent {
  return {
    type: 'doc',
    content: text.split(/\r?\n/).map((line) => ({
      type: 'paragraph',
      ...(line ? { content: [{ type: 'text', text: line }] } : {}),
    })),
  };
}
export function parseRichText(value: unknown): JSONContent | null {
  try {
    if (!value || JSON.stringify(value).length > 200000) return null;
    const node = schema.nodeFromJSON(value);
    if (node.type.name !== 'doc') return null;
    node.check();
    node.descendants((child) => {
      if (child.type.name === 'image')
        for (const dimension of ['width', 'height']) {
          const value: unknown = child.attrs[dimension];
          if (
            value !== null &&
            value !== undefined &&
            (typeof value !== 'number' ||
              !Number.isFinite(value) ||
              value <= 0 ||
              value > 20000)
          )
            throw new Error('Invalid image dimensions');
        }
      if (
        child.type.name === 'image' &&
        (typeof child.attrs.src !== 'string' ||
          !/^\/api\/assets\/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
            child.attrs.src,
          ))
      )
        throw new Error('Only uploaded images are supported');
    });
    return node.toJSON();
  } catch {
    return null;
  }
}
