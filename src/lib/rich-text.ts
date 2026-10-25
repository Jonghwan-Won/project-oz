import { TableKit } from '@tiptap/extension-table';
import Image from '@tiptap/extension-image';
import {
  getSchema,
  Mark,
  mergeAttributes,
  type JSONContent,
} from '@tiptap/core';
import StarterKit from '@tiptap/starter-kit';

const fontFamilies = {
  system: 'Arial, "Malgun Gothic", sans-serif',
  serif: 'Georgia, "Batang", serif',
  mono: 'Consolas, monospace',
} as const;
const fontSizes = ['12', '14', '16', '18', '24', '32'] as const;
export const textStyleFontOptions = [
  { value: '', label: '기본' },
  { value: 'system', label: '고딕' },
  { value: 'serif', label: '명조' },
  { value: 'mono', label: '고정폭' },
];
export const textStyleSizeOptions = [
  { value: '', label: '크기' },
  ...fontSizes.map((size) => ({ value: size, label: `${size}px` })),
];
const isFontFamily = (value: unknown): value is keyof typeof fontFamilies =>
  typeof value === 'string' && Object.hasOwn(fontFamilies, value);
const isFontSize = (value: unknown): value is (typeof fontSizes)[number] =>
  typeof value === 'string' &&
  fontSizes.includes(value as (typeof fontSizes)[number]);
const normalizeFont = (value: string) =>
  value.toLowerCase().replaceAll('"', '').replaceAll(' ', '');
const TextStyle = Mark.create({
  name: 'textStyle',
  addAttributes() {
    return {
      fontFamily: {
        default: null,
        parseHTML: (element) => {
          const value = normalizeFont(
            (element as HTMLElement).style.fontFamily,
          );
          return (
            Object.entries(fontFamilies).find(
              ([, family]) => normalizeFont(family) === value,
            )?.[0] ?? null
          );
        },
        renderHTML: (attributes) =>
          isFontFamily(attributes.fontFamily)
            ? { style: `font-family:${fontFamilies[attributes.fontFamily]}` }
            : {},
      },
      fontSize: {
        default: null,
        parseHTML: (element) => {
          const value = (element as HTMLElement).style.fontSize.match(
            /^(\d+)px$/,
          )?.[1];
          return isFontSize(value) ? value : null;
        },
        renderHTML: (attributes) =>
          isFontSize(attributes.fontSize)
            ? { style: `font-size:${attributes.fontSize}px` }
            : {},
      },
    };
  },
  parseHTML: () => [{ tag: 'span[style]' }],
  renderHTML: ({ HTMLAttributes }) => [
    'span',
    mergeAttributes(HTMLAttributes),
    0,
  ],
});

export const richTextExtensions = [
  TableKit.configure({
    table: { resizable: true, cellMinWidth: 60, handleWidth: 6 },
  }),
  StarterKit.configure({ link: false, heading: { levels: [2, 3] } }),
  TextStyle,
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
      for (const mark of child.marks)
        if (
          mark.type.name === 'textStyle' &&
          ((mark.attrs.fontFamily !== null &&
            !isFontFamily(mark.attrs.fontFamily)) ||
            (mark.attrs.fontSize !== null && !isFontSize(mark.attrs.fontSize)))
        )
          throw new Error('Invalid text style');
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
