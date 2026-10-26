import { TableKit } from '@tiptap/extension-table';
import Image from '@tiptap/extension-image';
import {
  Extension,
  getSchema,
  Mark,
  mergeAttributes,
  type JSONContent,
} from '@tiptap/core';
import { Plugin } from '@tiptap/pm/state';
import { Decoration, DecorationSet } from '@tiptap/pm/view';
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
const textAlignments = ['left', 'center', 'right'] as const;
const TextAlign = Extension.create({
  name: 'textAlign',
  addGlobalAttributes() {
    return [
      {
        types: ['paragraph', 'heading', 'image'],
        attributes: {
          textAlign: {
            default: null,
            parseHTML: (element: HTMLElement) => {
              const value =
                element.tagName === 'IMG'
                  ? element.getAttribute('data-text-align')
                  : element.style.textAlign;
              return value === 'left' || value === 'center' || value === 'right'
                ? value
                : null;
            },
            renderHTML: (attributes: { textAlign?: unknown; src?: unknown }) => {
              const alignment = attributes.textAlign;
              if (
                alignment !== 'left' &&
                alignment !== 'center' &&
                alignment !== 'right'
              )
                return {};
              if ('src' in attributes)
                return { 'data-text-align': alignment };
              return { style: `text-align:${alignment}` };
            },
          },
        },
      },
    ];
  },
});
const TableRowHeight = Extension.create({
  name: 'tableRowHeight',
  addGlobalAttributes() {
    return [
      {
        types: ['tableRow'],
        attributes: {
          rowHeight: {
            default: null,
            parseHTML: (element: HTMLElement) => {
              const height = Number.parseFloat(element.style.height);
              return Number.isFinite(height) && height >= 24 && height <= 2000
                ? height
                : null;
            },
            renderHTML: (attributes: { rowHeight?: unknown }) =>
              typeof attributes.rowHeight === 'number' &&
              Number.isFinite(attributes.rowHeight) &&
              attributes.rowHeight >= 24 &&
              attributes.rowHeight <= 2000
                ? { style: `height:${attributes.rowHeight}px` }
                : {},
          },
        },
      },
    ];
  },
  addProseMirrorPlugins() {
    let stopResize: () => void = () => {};
    return [
      new Plugin({
        props: {
          decorations(state) {
            const handles: Decoration[] = [];
            state.doc.descendants((row, rowPos) => {
              if (row.type.name !== 'tableRow') return true;
              row.descendants((cell, offset) => {
                if (
                  cell.type.name !== 'tableCell' &&
                  cell.type.name !== 'tableHeader'
                )
                  return true;
                const cellPos = rowPos + 1 + offset;
                const handlePos = cellPos + cell.nodeSize - 1;
                handles.push(
                  Decoration.widget(
                    handlePos,
                    () => {
                      const handle = document.createElement('span');
                      handle.className = 'row-resize-handle';
                      handle.dataset.rowPos = String(rowPos);
                      handle.contentEditable = 'false';
                      handle.setAttribute('aria-hidden', 'true');
                      return handle;
                    },
                    { side: 1, key: `row-resize-${rowPos}-${cellPos}` },
                  ),
                );
                return false;
              });
              return false;
            });
            return DecorationSet.create(state.doc, handles);
          },
          handleDOMEvents: {
            mousedown(view, event) {
              const mouseEvent = event as MouseEvent;
              if (mouseEvent.button !== 0) return false;
              const target =
                event.target instanceof HTMLElement
                  ? event.target.closest<HTMLElement>('.row-resize-handle')
                  : null;
              if (!target) return false;
              const rowPos = Number(target.dataset.rowPos);
              const row = view.state.doc.nodeAt(rowPos);
              const rowElement = view.nodeDOM(rowPos);
              if (!row || row.type.name !== 'tableRow') return false;
              mouseEvent.preventDefault();
              stopResize();
              const startY = mouseEvent.clientY;
              const initialHeight =
                row.attrs.rowHeight ??
                (rowElement instanceof HTMLElement
                  ? rowElement.getBoundingClientRect().height
                  : 40);
              const onMove = (moveEvent: MouseEvent) => {
                const currentRow = view.state.doc.nodeAt(rowPos);
                if (!currentRow || currentRow.type.name !== 'tableRow') return;
                const rowHeight = Math.max(
                  24,
                  Math.min(
                    2000,
                    Math.round(initialHeight + moveEvent.clientY - startY),
                  ),
                );
                view.dispatch(
                  view.state.tr.setNodeMarkup(rowPos, currentRow.type, {
                    ...currentRow.attrs,
                    rowHeight,
                  }),
                );
              };
              const onUp = () => stopResize();
              stopResize = () => {
                window.removeEventListener('mousemove', onMove);
                window.removeEventListener('mouseup', onUp);
                stopResize = () => {};
              };
              window.addEventListener('mousemove', onMove);
              window.addEventListener('mouseup', onUp, { once: true });
              return true;
            },
          },
        },
        view() {
          return { destroy: () => stopResize() };
        },
      }),
    ];
  },
});

export const richTextExtensions = [
  TableKit.configure({
    table: { resizable: true, cellMinWidth: 60, handleWidth: 6 },
  }),
  StarterKit.configure({ link: false, heading: { levels: [2, 3] } }),
  TextStyle,
  TextAlign,
  TableRowHeight,
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
      if (
        ['paragraph', 'heading', 'image'].includes(child.type.name) &&
        child.attrs.textAlign !== null &&
        !textAlignments.includes(
          child.attrs.textAlign as (typeof textAlignments)[number],
        )
      )
        throw new Error('Invalid text alignment');
      if (
        child.type.name === 'tableRow' &&
        child.attrs.rowHeight !== null &&
        (typeof child.attrs.rowHeight !== 'number' ||
          !Number.isFinite(child.attrs.rowHeight) ||
          child.attrs.rowHeight < 24 ||
          child.attrs.rowHeight > 2000)
      )
        throw new Error('Invalid table row height');
    });
    return node.toJSON();
  } catch {
    return null;
  }
}
