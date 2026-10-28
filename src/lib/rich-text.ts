import { TableKit, TableView } from '@tiptap/extension-table';
import type { Node as ProseMirrorNode } from '@tiptap/pm/model';
import {
  TableMap,
  CellSelection,
  addColumnBefore,
  addColumnAfter,
  addRowBefore,
  addRowAfter,
} from '@tiptap/pm/tables';
import type { Transaction } from '@tiptap/pm/state';
import { closeHistory } from '@tiptap/pm/history';
import type { ViewMutationRecord } from '@tiptap/pm/view';
import Image from '@tiptap/extension-image';
import {
  Extension,
  getSchema,
  Mark,
  mergeAttributes,
  type JSONContent,
} from '@tiptap/core';
import { Plugin, NodeSelection } from '@tiptap/pm/state';
import type { EditorView } from '@tiptap/pm/view';
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
const isColor = (value: unknown): value is string =>
  typeof value === 'string' && /^#[0-9a-f]{6}$/i.test(value);
const htmlColor = (value: string) => {
  if (isColor(value)) return value;
  const match = /^rgb\(\s*(\d{1,3}),\s*(\d{1,3}),\s*(\d{1,3})\s*\)$/.exec(
    value,
  );
  if (!match || match.slice(1).some((part) => Number(part) > 255)) return null;
  return (
    '#' +
    match
      .slice(1)
      .map((part) => Number(part).toString(16).padStart(2, '0'))
      .join('')
  );
};
export const isSafeLink = (value: unknown): value is string => {
  if (typeof value !== 'string' || value.length > 2048) return false;
  if (/^\/(?![\/\\])/.test(value)) return !/[\s\\]/.test(value);
  try {
    const url = new URL(value);
    return (
      ['https:', 'http:'].includes(url.protocol) &&
      !url.username &&
      !url.password
    );
  } catch {
    return false;
  }
};
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
      color: {
        default: null,
        parseHTML: (element) => htmlColor((element as HTMLElement).style.color),
        renderHTML: (attributes) =>
          isColor(attributes.color)
            ? { style: `color:${attributes.color}` }
            : {},
      },
      backgroundColor: {
        default: null,
        parseHTML: (element) =>
          htmlColor((element as HTMLElement).style.backgroundColor),
        renderHTML: (attributes) =>
          isColor(attributes.backgroundColor)
            ? { style: `background-color:${attributes.backgroundColor}` }
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
const QuoteStyle = Extension.create({
  name: 'quoteStyle',
  priority: 1100,
  addKeyboardShortcuts() {
    return {
      Enter: () => {
        if (
          !this.editor.isActive('blockquote') ||
          this.editor.isActive('codeBlock') ||
          this.editor.isActive('listItem')
        )
          return false;
        if (!this.editor.state.selection.$from.parent.content.size)
          return this.editor.commands.lift('blockquote');
        return this.editor.chain().splitBlock().lift('blockquote').run();
      },
    };
  },
  addGlobalAttributes() {
    return [
      {
        types: ['blockquote'],
        attributes: {
          quoteStyle: {
            default: null,
            parseHTML: (element: HTMLElement) =>
              element.getAttribute('data-quote-style') === 'quotation'
                ? 'quotation'
                : null,
            renderHTML: (attributes: { quoteStyle?: unknown }) =>
              attributes.quoteStyle === 'quotation'
                ? { 'data-quote-style': 'quotation' }
                : {},
          },
        },
      },
    ];
  },
});
const TextAlign = Extension.create({
  name: 'textAlign',
  addGlobalAttributes() {
    return [
      {
        types: ['paragraph', 'heading', 'image', 'blockquote'],
        attributes: {
          textAlign: {
            default: null,
            parseHTML: (element: HTMLElement) => {
              const value =
                element.tagName === 'IMG' || element.tagName === 'BLOCKQUOTE'
                  ? element.getAttribute('data-text-align')
                  : element.style.textAlign;
              return value === 'left' || value === 'center' || value === 'right'
                ? value
                : null;
            },
            renderHTML: (attributes: {
              textAlign?: unknown;
              src?: unknown;
            }) => {
              const alignment = attributes.textAlign;
              if (
                alignment !== 'left' &&
                alignment !== 'center' &&
                alignment !== 'right'
              )
                return {};
              if ('src' in attributes || 'quoteStyle' in attributes)
                return { 'data-text-align': alignment };
              return { style: `text-align:${alignment}` };
            },
          },
        },
      },
    ];
  },
});
const Indent = Extension.create({
  name: 'indent',
  addGlobalAttributes() {
    return [
      {
        types: ['paragraph', 'heading'],
        attributes: {
          indent: {
            default: 0,
            parseHTML: (element: HTMLElement) =>
              Number(element.getAttribute('data-indent')) || 0,
            renderHTML: (attributes: { indent?: unknown }) =>
              typeof attributes.indent === 'number' &&
              Number.isInteger(attributes.indent) &&
              attributes.indent > 0 &&
              attributes.indent <= 6
                ? {
                    'data-indent': String(attributes.indent),
                    style: `margin-left:${attributes.indent * 2}em`,
                  }
                : {},
          },
        },
      },
    ];
  },
});
const CellStyle = Extension.create({
  name: 'cellStyle',
  addGlobalAttributes() {
    return [
      {
        types: ['tableCell', 'tableHeader'],
        attributes: {
          backgroundColor: {
            default: null,
            parseHTML: (element: HTMLElement) =>
              element.getAttribute('data-cell-background'),
            renderHTML: (attrs: { backgroundColor?: unknown }) =>
              isColor(attrs.backgroundColor)
                ? {
                    'data-cell-background': attrs.backgroundColor,
                    style: `background-color:${attrs.backgroundColor}`,
                  }
                : {},
          },
          borderColor: {
            default: null,
            parseHTML: (element: HTMLElement) =>
              element.getAttribute('data-cell-border-color'),
            renderHTML: (attrs: { borderColor?: unknown }) =>
              isColor(attrs.borderColor)
                ? {
                    'data-cell-border-color': attrs.borderColor,
                    style: `border-color:${attrs.borderColor}`,
                  }
                : {},
          },
          borderWidth: {
            default: null,
            parseHTML: (element: HTMLElement) => {
              const value = element.getAttribute('data-cell-border-width');
              return value ? Number(value) : null;
            },
            renderHTML: (attrs: { borderWidth?: unknown }) =>
              typeof attrs.borderWidth === 'number' &&
              [1, 2, 3].includes(attrs.borderWidth)
                ? {
                    'data-cell-border-width': String(attrs.borderWidth),
                    style: `border-width:${attrs.borderWidth}px`,
                  }
                : {},
          },
          borderStyle: {
            default: null,
            parseHTML: (element: HTMLElement) =>
              element.getAttribute('data-cell-border-style'),
            renderHTML: (attrs: { borderStyle?: unknown }) =>
              typeof attrs.borderStyle === 'string' &&
              ['solid', 'dashed', 'dotted', 'none'].includes(attrs.borderStyle)
                ? {
                    'data-cell-border-style': attrs.borderStyle,
                    style: `border-style:${attrs.borderStyle}`,
                  }
                : {},
          },
          verticalAlign: {
            default: null,
            parseHTML: (element: HTMLElement) =>
              element.getAttribute('data-cell-vertical-align'),
            renderHTML: (attrs: { verticalAlign?: unknown }) =>
              typeof attrs.verticalAlign === 'string' &&
              ['top', 'middle', 'bottom'].includes(attrs.verticalAlign)
                ? {
                    'data-cell-vertical-align': attrs.verticalAlign,
                    style: `vertical-align:${attrs.verticalAlign}`,
                  }
                : {},
          },
        },
      },
    ];
  },
});

const tableProperties = {
  cellAlign: {
    css: 'text-align',
    values: ['left', 'center', 'right', 'justify'],
  },
  cellPadding: {
    css: 'padding',
    values: ['0px', '4px', '8px', '12px', '16px', '24px'],
  },
  cellWrap: { css: 'white-space', values: ['normal', 'nowrap'] },
  tableWidth: { css: 'width', values: ['auto', '50%', '75%', '100%'] },
  tableLayout: { css: 'table-layout', values: ['auto', 'fixed'] },
  tableAlign: { css: 'margin-inline', values: ['0 auto', 'auto', 'auto 0'] },
} as const;
function isTablePropertyValue(name: string, value: unknown) {
  if (typeof value !== 'string') return false;
  if (name === 'tableWidth' && /^\d+px$/.test(value))
    return Number.parseInt(value) >= 60 && Number.parseInt(value) <= 20000;
  const property = tableProperties[name as keyof typeof tableProperties];
  return !!property && (property.values as readonly string[]).includes(value);
}
const TableProperties = Extension.create({
  name: 'tableProperties',
  addGlobalAttributes() {
    return Object.entries(tableProperties).map(([name, property]) => ({
      types: name.startsWith('cell') ? ['tableCell', 'tableHeader'] : ['table'],
      attributes: {
        [name]: {
          default: null,
          parseHTML: (element: HTMLElement) =>
            element.getAttribute('data-' + name.toLowerCase()),
          renderHTML: (attrs: Record<string, unknown>) =>
            isTablePropertyValue(name, attrs[name])
              ? {
                  ['data-' + name.toLowerCase()]: attrs[name],
                  style: property.css + ':' + attrs[name],
                }
              : {},
        },
      },
    }));
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
              return Number.isFinite(height) && height >= 16 && height <= 2000
                ? height
                : null;
            },
            renderHTML: (attributes: { rowHeight?: unknown }) =>
              typeof attributes.rowHeight === 'number' &&
              Number.isFinite(attributes.rowHeight) &&
              attributes.rowHeight >= 16 &&
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
              if (
                row.type.name === 'table' &&
                state.selection.from > rowPos &&
                state.selection.to < rowPos + row.nodeSize
              )
                handles.push(
                  Decoration.node(rowPos, rowPos + row.nodeSize, {
                    'data-table-focused': 'true',
                  }),
                );
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
                  16,
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

export function getScaledTableSize(
  widths: number[],
  heights: number[],
  requestedScale: number,
  verticalScale = requestedScale,
) {
  if (
    !widths.length ||
    !heights.length ||
    !Number.isFinite(requestedScale) ||
    [...widths, ...heights].some(
      (value) => !Number.isFinite(value) || value <= 0,
    )
  )
    return null;
  const minimum = Math.max(
    ...widths.map((value) => 60 / value),
    ...heights.map((value) => 16 / value),
  );
  const maximum = Math.min(
    20000 / widths.reduce((sum, value) => sum + value, 0),
    ...heights.map((value) => 2000 / value),
  );
  if (minimum > maximum) return null;
  const scale = Math.max(minimum, Math.min(maximum, requestedScale));
  return {
    widths: widths.map((value) => Math.max(60, Math.floor(value * scale))),
    heights: heights.map((value) =>
      Math.round(
        value *
          (verticalScale === requestedScale
            ? scale
            : Math.max(
                Math.max(...heights.map((height) => 16 / height)),
                Math.min(
                  Math.min(...heights.map((height) => 2000 / height)),
                  verticalScale,
                ),
              )),
      ),
    ),
  };
}

export function applyTableSize(
  tr: Transaction,
  position: number,
  size: { widths: number[]; heights: number[] },
) {
  const table = tr.doc.nodeAt(position);
  if (!table || table.type.name !== 'table') return false;
  const map = TableMap.get(table);
  if (map.width !== size.widths.length || map.height !== size.heights.length)
    return false;
  closeHistory(tr);
  tr.setNodeMarkup(position, undefined, {
    ...table.attrs,
    tableWidth: `${size.widths.reduce((sum, value) => sum + value, 0)}px`,
    tableLayout: 'fixed',
  });
  let rowIndex = 0;
  table.forEach((row, offset) => {
    tr.setNodeMarkup(position + 1 + offset, undefined, {
      ...row.attrs,
      rowHeight: size.heights[rowIndex++],
    });
  });
  for (const offset of new Set(map.map)) {
    const cell = table.nodeAt(offset);
    if (!cell) continue;
    const { left, right } = map.findCell(offset);
    tr.setNodeMarkup(position + 1 + offset, undefined, {
      ...cell.attrs,
      colwidth: size.widths.slice(left, right),
    });
  }
  return true;
}

const tableViews = new WeakMap<Node, StyledTableView>();
const TableControls = Extension.create({
  name: 'tableControls',
  addProseMirrorPlugins() {
    return [
      new Plugin({
        view(view) {
          const update = () =>
            view.state.doc.descendants((node, position) => {
              if (node.type.name !== 'table') return true;
              const dom = view.nodeDOM(position);
              if (dom) tableViews.get(dom)?.refreshControls(view, position);
              return false;
            });
          update();
          return { update };
        },
      }),
    ];
  },
});
class StyledTableView extends TableView {
  private controls: HTMLDivElement;
  private stopResize: () => void = () => {};
  private resizeHandle: HTMLButtonElement;
  private resizeObserver: ResizeObserver;
  constructor(...args: ConstructorParameters<typeof TableView>) {
    super(...args);
    const view = args[2];
    tableViews.set(this.dom, this);
    this.controls = document.createElement('div');
    this.controls.className = 'table-edge-controls';
    this.controls.contentEditable = 'false';
    this.dom.appendChild(this.controls);
    this.resizeHandle = document.createElement('button');
    this.resizeHandle.type = 'button';
    this.resizeHandle.className = 'table-resize-handle';
    this.resizeHandle.contentEditable = 'false';
    this.resizeHandle.setAttribute(
      'aria-label',
      '표 전체 크기 조절 (방향키로 확대·축소)',
    );
    this.resizeHandle.title = '드래그로 표 비율 유지 · 방향키로 확대/축소';
    this.dom.appendChild(this.resizeHandle);
    this.resizeObserver = new ResizeObserver(() => {
      this.resizeHandle.style.left = `${this.table.offsetLeft + this.table.offsetWidth - 12}px`;
      this.resizeHandle.style.top = `${this.table.offsetTop + this.table.offsetHeight - 12}px`;
      if (view && !view.isDestroyed)
        view.state.doc.descendants((node, pos) => {
          if (node === this.node) {
            this.refreshControls(view, pos);
            return false;
          }
        });
    });
    this.resizeObserver.observe(this.table);
    this.resizeObserver.observe(this.dom);
    const start = () => {
      if (!view?.editable) return null;
      let position = -1;
      view.state.doc.descendants((node, pos) => {
        if (node.type.name === 'table' && view.nodeDOM(pos) === this.dom) {
          position = pos;
          return false;
        }
      });
      if (position < 0) return null;
      const columns = Array.from(
        this.colgroup.children,
      ) as HTMLTableColElement[];
      const rows = Array.from(this.contentDOM.rows);
      return {
        position,
        columns,
        rows,
        widths: columns.map((col) => col.getBoundingClientRect().width),
        heights: rows.map((row) => row.getBoundingClientRect().height),
      };
    };
    this.resizeHandle.onkeydown = (event) => {
      if (
        !['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown'].includes(event.key)
      )
        return;
      event.preventDefault();
      event.stopPropagation();
      const initial = start();
      if (!initial || !view) return;
      const size = getScaledTableSize(
        initial.widths,
        initial.heights,
        ['ArrowRight', 'ArrowDown'].includes(event.key) ? 1.05 : 0.95,
      );
      const tr = view.state.tr;
      if (size && applyTableSize(tr, initial.position, size)) view.dispatch(tr);
    };
    this.resizeHandle.onpointerdown = (event) => {
      if (event.button !== 0 || !view) return;
      const initial = start();
      if (!initial) return;
      event.preventDefault();
      event.stopPropagation();
      this.stopResize();
      const bounds = this.table.getBoundingClientRect();
      const originalStyles = [
        this.table,
        ...initial.columns,
        ...initial.rows,
      ].map((element) => element.style.cssText);
      let size = getScaledTableSize(initial.widths, initial.heights, 1);
      let moved = false;
      const move = (next: PointerEvent) => {
        if (next.pointerId !== event.pointerId) return;
        const dx = next.clientX - event.clientX,
          dy = next.clientY - event.clientY;
        if (Math.abs(dx) + Math.abs(dy) < 3) return;
        // Project the pointer onto the original diagonal so both axes use one scale.
        size = getScaledTableSize(
          initial.widths,
          initial.heights,
          1 + dx / bounds.width,
          1 + dy / bounds.height,
        );
        if (!size) return;
        moved = true;
        this.table.style.width = `${size.widths.reduce((sum, value) => sum + value, 0)}px`;
        this.table.style.height = `${size.heights.reduce((sum, value) => sum + value, 0)}px`;
        this.table.style.minWidth = '';
        this.table.style.tableLayout = 'fixed';
        initial.columns.forEach((col, index) => {
          col.style.width = `${size!.widths[index]}px`;
        });
        initial.rows.forEach((row, index) => {
          row.style.height = `${size!.heights[index]}px`;
        });
      };
      const finish = (next: PointerEvent) => {
        if (next.pointerId !== event.pointerId) return;
        this.stopResize();
        if (next.type === 'pointerup' && moved && size && !view.isDestroyed) {
          const tr = view.state.tr;
          if (applyTableSize(tr, initial.position, size)) view.dispatch(tr);
        }
      };
      const cancel = (next: KeyboardEvent) => {
        if (next.key === 'Escape') {
          next.preventDefault();
          next.stopPropagation();
          this.stopResize();
        }
      };
      const blur = () => this.stopResize();
      this.stopResize = () => {
        window.removeEventListener('pointermove', move);
        window.removeEventListener('pointerup', finish);
        window.removeEventListener('pointercancel', finish);
        window.removeEventListener('keydown', cancel, true);
        window.removeEventListener('blur', blur);
        [this.table, ...initial.columns, ...initial.rows].forEach(
          (element, index) => {
            element.style.cssText = originalStyles[index];
          },
        );
        this.dom.removeAttribute('data-resizing');
        this.stopResize = () => {};
      };
      this.dom.setAttribute('data-resizing', 'true');
      window.addEventListener('pointermove', move);
      window.addEventListener('pointerup', finish);
      window.addEventListener('pointercancel', finish);
      window.addEventListener('keydown', cancel, true);
      window.addEventListener('blur', blur);
    };
    this.applyProperties();
  }
  stopEvent(event: Event) {
    return (
      event.target === this.resizeHandle ||
      (event.target instanceof Node && this.controls.contains(event.target))
    );
  }
  refreshControls(view: EditorView, position: number) {
    if (!view.editable) {
      this.controls.replaceChildren();
      return;
    }
    if (view.dragging) return;
    const map = TableMap.get(this.node);
    const selection = view.state.selection;
    let cellPosition =
      selection instanceof CellSelection ? selection.$headCell.pos : -1;
    for (
      let depth = selection.$from.depth;
      cellPosition < 0 && depth > 0;
      depth--
    )
      if (
        ['tableCell', 'tableHeader'].includes(
          selection.$from.node(depth).type.name,
        )
      )
        cellPosition = selection.$from.before(depth);
    const offset = cellPosition - position - 1;
    const active = map.map.includes(offset) ? map.findCell(offset) : null;
    this.controls.replaceChildren();
    const button = (label: string, text: string) => {
      const element = document.createElement('button');
      element.type = 'button';
      element.title = label;
      element.setAttribute('aria-label', label);
      element.textContent = text;
      element.onmousedown = (event) => event.preventDefault();
      return element;
    };
    const corner = button('전체 셀 선택 · 드래그로 표 이동', '');
    corner.className = 'table-corner-control';
    corner.style.left = `${this.table.offsetLeft - 18}px`;
    corner.style.top = `${this.table.offsetTop - 18}px`;
    corner.onclick = () => {
      view.dispatch(
        view.state.tr.setSelection(
          CellSelection.create(
            view.state.doc,
            position + 1 + map.map[0],
            position + 1 + map.map[map.map.length - 1],
          ),
        ),
      );
      view.focus();
    };
    corner.draggable = true;
    corner.onmousedown = (event) => event.stopPropagation();
    corner.ondragstart = (event) => {
      const tr = view.state.tr.setSelection(
        NodeSelection.create(view.state.doc, position),
      );
      const slice = tr.selection.content();
      view.dragging = { slice, move: true };
      view.dispatch(tr);
      event.dataTransfer?.setData('text/plain', this.node.textContent);
      if (event.dataTransfer) event.dataTransfer.effectAllowed = 'move';
    };
    corner.ondragend = () => {
      view.dragging = null;
    };
    this.controls.appendChild(corner);
    const buildRail = (
      index: number,
      column: boolean,
      start: number,
      length: number,
    ) => {
      const rail = document.createElement('div');
      rail.className = 'table-axis-control';
      rail.dataset.axis = column ? 'column' : 'row';
      rail.tabIndex = 0;
      rail.setAttribute('role', 'button');
      rail.setAttribute(
        'aria-label',
        `${index + 1}번째 ${column ? '열' : '행'} 전체 선택`,
      );
      const selectAxis = () => {
        const first =
          position + 1 + map.map[column ? index : index * map.width];
        const last =
          position +
          1 +
          map.map[
            column
              ? (map.height - 1) * map.width + index
              : (index + 1) * map.width - 1
          ];
        const $first = view.state.doc.resolve(first),
          $last = view.state.doc.resolve(last);
        view.dispatch(
          view.state.tr.setSelection(
            column
              ? CellSelection.colSelection($first, $last)
              : CellSelection.rowSelection($first, $last),
          ),
        );
        view.focus();
      };
      rail.onmousedown = (event) => event.preventDefault();
      rail.onclick = (event) => {
        if (event.target === rail) selectAxis();
      };
      rail.onkeydown = (event) => {
        if (event.key === 'Enter' || event.key === ' ') {
          event.preventDefault();
          selectAxis();
        }
      };
      rail.dataset.active = String(
        !!active &&
          (column
            ? index >= active.left && index < active.right
            : index >= active.top && index < active.bottom),
      );
      Object.assign(
        rail.style,
        column
          ? {
              left: `${start}px`,
              top: `${this.table.offsetTop - 18}px`,
              width: `${length}px`,
              height: '18px',
            }
          : {
              left: `${this.table.offsetLeft - 18}px`,
              top: `${start}px`,
              height: `${length}px`,
              width: '18px',
            },
      );
      [false, true].forEach((after) => {
        const control = button(
          `${column ? '열' : '행'} ${after ? '뒤에' : '앞에'} 추가`,
          '+',
        );
        control.dataset.after = String(after);
        control.onclick = () => {
          const cell = map.map[column ? index : index * map.width];
          view.dispatch(
            view.state.tr.setSelection(
              CellSelection.create(view.state.doc, position + 1 + cell),
            ),
          );
          const command = column
            ? after
              ? addColumnAfter
              : addColumnBefore
            : after
              ? addRowAfter
              : addRowBefore;
          command(view.state, view.dispatch);
          view.focus();
        };
        rail.appendChild(control);
      });
      this.controls.appendChild(rail);
    };
    let left = this.table.offsetLeft;
    Array.from(this.colgroup.children).forEach((col, index) => {
      const width = col.getBoundingClientRect().width;
      buildRail(index, true, left, width);
      left += width;
    });
    let top = this.table.offsetTop;
    Array.from(this.contentDOM.rows).forEach((row, index) => {
      const height = row.getBoundingClientRect().height;
      buildRail(index, false, top, height);
      top += height;
    });
  }
  ignoreMutation(mutation: ViewMutationRecord) {
    if (
      this.dom.hasAttribute('data-resizing') &&
      mutation.type === 'attributes' &&
      mutation.attributeName === 'style' &&
      mutation.target instanceof HTMLTableRowElement
    )
      return true;
    return super.ignoreMutation(mutation);
  }
  destroy() {
    this.stopResize();
    this.resizeObserver.disconnect();
  }
  update(node: ProseMirrorNode) {
    // Selection and menu transactions also update this view during a drag.
    if (node === this.node) return true;
    this.stopResize();
    if (!super.update(node)) return false;
    this.applyProperties();
    return true;
  }
  applyProperties() {
    for (const name of ['tableWidth', 'tableLayout', 'tableAlign'] as const) {
      const property = tableProperties[name];
      const value: unknown = this.node.attrs[name];
      if (typeof value === 'string' && isTablePropertyValue(name, value))
        this.table.style.setProperty(property.css, value);
      else if (name !== 'tableWidth')
        this.table.style.removeProperty(property.css);
    }
  }
}

export const richTextExtensions = [
  TableKit.configure({
    table: {
      resizable: true,
      cellMinWidth: 60,
      handleWidth: 6,
      View: StyledTableView,
    },
  }),
  StarterKit.configure({
    link: {
      openOnClick: false,
      autolink: false,
      linkOnPaste: false,
      isAllowedUri: isSafeLink,
    },
    heading: { levels: [2, 3] },
  }),
  TextStyle,
  QuoteStyle,
  TextAlign,
  Indent,
  CellStyle,
  TableProperties,
  TableRowHeight,
  TableControls,
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
export function parseRichText(
  value: unknown,
  localImages?: ReadonlySet<string>,
): JSONContent | null {
  try {
    if (!value || JSON.stringify(value).length > 200000) return null;
    const node = schema.nodeFromJSON(value);
    if (node.type.name !== 'doc') return null;
    node.check();
    node.descendants((child) => {
      if (
        child.type.name === 'blockquote' &&
        child.attrs.quoteStyle !== null &&
        child.attrs.quoteStyle !== 'quotation'
      )
        throw new Error('Invalid quote style');
      for (const mark of child.marks)
        if (
          mark.type.name === 'textStyle' &&
          ((mark.attrs.fontFamily !== null &&
            !isFontFamily(mark.attrs.fontFamily)) ||
            (mark.attrs.fontSize !== null && !isFontSize(mark.attrs.fontSize)))
        )
          throw new Error('Invalid text style');
      for (const mark of child.marks) {
        if (
          mark.type.name === 'textStyle' &&
          ((mark.attrs.color !== null && !isColor(mark.attrs.color)) ||
            (mark.attrs.backgroundColor !== null &&
              !isColor(mark.attrs.backgroundColor)))
        )
          throw new Error('Invalid color');
        if (
          mark.type.name === 'link' &&
          (!isSafeLink(mark.attrs.href) ||
            ![null, '_blank'].includes(mark.attrs.target) ||
            mark.attrs.rel !== 'noopener noreferrer nofollow' ||
            mark.attrs.class !== null ||
            (mark.attrs.title !== null &&
              (typeof mark.attrs.title !== 'string' ||
                mark.attrs.title.length > 200)))
        )
          throw new Error('Invalid link');
      }
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
          (!/^\/api\/assets\/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
            child.attrs.src,
          ) &&
            !(
              child.attrs.src.startsWith('blob:') &&
              localImages?.has(child.attrs.src)
            )))
      )
        throw new Error('Only uploaded images are supported');
      if (
        ['paragraph', 'heading', 'image', 'blockquote'].includes(
          child.type.name,
        ) &&
        child.attrs.textAlign !== null &&
        !textAlignments.includes(
          child.attrs.textAlign as (typeof textAlignments)[number],
        )
      )
        throw new Error('Invalid text alignment');
      if (
        ['paragraph', 'heading'].includes(child.type.name) &&
        (!Number.isInteger(child.attrs.indent) ||
          child.attrs.indent < 0 ||
          child.attrs.indent > 6)
      )
        throw new Error('Invalid indentation');
      if (['table', 'tableCell', 'tableHeader'].includes(child.type.name)) {
        for (const name of Object.keys(tableProperties)) {
          const value = child.attrs[name];
          if (
            value !== undefined &&
            value !== null &&
            !isTablePropertyValue(name, value)
          )
            throw new Error('Invalid table property');
        }
      }
      if (['tableCell', 'tableHeader'].includes(child.type.name)) {
        const attrs = child.attrs;
        if (
          (attrs.backgroundColor !== null && !isColor(attrs.backgroundColor)) ||
          (attrs.borderColor !== null && !isColor(attrs.borderColor)) ||
          (attrs.borderWidth !== null &&
            ![1, 2, 3].includes(attrs.borderWidth)) ||
          (attrs.borderStyle !== null &&
            !['solid', 'dashed', 'dotted', 'none'].includes(
              attrs.borderStyle,
            )) ||
          (attrs.verticalAlign !== null &&
            !['top', 'middle', 'bottom'].includes(attrs.verticalAlign))
        )
          throw new Error('Invalid table cell style');
      }
      if (
        child.type.name === 'tableRow' &&
        child.attrs.rowHeight !== null &&
        (typeof child.attrs.rowHeight !== 'number' ||
          !Number.isFinite(child.attrs.rowHeight) ||
          child.attrs.rowHeight < 16 ||
          child.attrs.rowHeight > 2000)
      )
        throw new Error('Invalid table row height');
    });
    return node.toJSON();
  } catch {
    return null;
  }
}
