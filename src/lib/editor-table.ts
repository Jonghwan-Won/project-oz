import type { Editor } from '@tiptap/core';
import { CellSelection, selectedRect, TableMap } from '@tiptap/pm/tables';
import { TextSelection } from '@tiptap/pm/state';
import type { Node as ProseMirrorNode } from '@tiptap/pm/model';

export function tableSelectionBounds(editor: Editor) {
  const selection = editor.state.selection;
  const positions: number[] = [];
  if (selection instanceof CellSelection) {
    selection.forEachCell((_cell, position) => positions.push(position));
  } else {
    for (let depth = selection.$from.depth; depth > 0; depth--) {
      if (
        ['tableCell', 'tableHeader'].includes(
          selection.$from.node(depth).type.name,
        )
      ) {
        positions.push(selection.$from.before(depth));
        break;
      }
    }
  }
  const bounds = positions.flatMap((position) => {
    const dom = editor.view.nodeDOM(position);
    return dom instanceof Element ? [dom.getBoundingClientRect()] : [];
  });
  if (!bounds.length) return null;
  const left = Math.min(...bounds.map((rect) => rect.left));
  const right = Math.max(...bounds.map((rect) => rect.right));
  return new DOMRect(
    left,
    Math.max(...bounds.map((rect) => rect.bottom)),
    right - left,
    0,
  );
}

export function leaveInsertedTable(editor: Editor) {
  const { $from } = editor.state.selection;
  for (let depth = $from.depth; depth > 0; depth--) {
    if ($from.node(depth).type.name !== 'table') continue;
    const position = $from.after(depth);
    const tr = editor.state.tr;
    if (!tr.doc.nodeAt(position)?.isTextblock)
      tr.insert(position, editor.schema.nodes.paragraph.create());
    tr.setSelection(TextSelection.create(tr.doc, position + 1));
    if (editor.state.doc.textContent.length > 0)
      tr.setMeta('table-insertion-cursor', $from.before(depth));
    editor.view.dispatch(tr.scrollIntoView());
    editor.view.focus();
    return;
  }
}

export function equalizeTableCells(
  editor: Editor,
  axis: 'width' | 'height' | 'both',
) {
  if (!(editor.state.selection instanceof CellSelection)) return;
  const rect = selectedRect(editor.state);
  const tr = editor.state.tr;
  if (axis !== 'height') {
    const widths = new Map<number, number>();
    editor.state.selection.forEachCell((cell, position) => {
      const dom = editor.view.nodeDOM(position);
      if (!(dom instanceof Element)) return;
      const cellRect = rect.map.findCell(position - rect.tableStart);
      const width = dom.getBoundingClientRect().width / cell.attrs.colspan;
      for (let col = cellRect.left; col < cellRect.right; col++)
        widths.set(col, width);
    });
    if (widths.size) {
      const width = Math.max(
        25,
        Math.round(
          [...widths.values()].reduce((a, b) => a + b, 0) / widths.size,
        ),
      );
      for (const offset of new Set(rect.map.map)) {
        const cellRect = rect.map.findCell(offset);
        if (cellRect.right <= rect.left || cellRect.left >= rect.right)
          continue;
        const cell = rect.table.nodeAt(offset)!;
        const colwidth = Array.from(
          { length: cell.attrs.colspan },
          (_, index) =>
            cellRect.left + index >= rect.left &&
            cellRect.left + index < rect.right
              ? width
              : (cell.attrs.colwidth?.[index] ?? 0),
        );
        tr.setNodeMarkup(rect.tableStart + offset, undefined, {
          ...cell.attrs,
          colwidth,
        });
      }
    }
  }
  if (axis !== 'width') {
    const rows: { position: number; height: number }[] = [];
    let offset = 0;
    rect.table.forEach((row, _offset, index) => {
      if (index >= rect.top && index < rect.bottom) {
        const position = rect.tableStart + offset;
        const dom = editor.view.nodeDOM(position);
        if (dom instanceof Element)
          rows.push({ position, height: dom.getBoundingClientRect().height });
      }
      offset += row.nodeSize;
    });
    const height = Math.min(
      2000,
      Math.max(
        16,
        Math.round(
          rows.reduce((sum, row) => sum + row.height, 0) / rows.length,
        ),
      ),
    );
    for (const row of rows)
      tr.setNodeMarkup(row.position, undefined, {
        ...tr.doc.nodeAt(row.position)!.attrs,
        rowHeight: height,
      });
  }
  editor.view.dispatch(tr);
  editor.view.focus();
}

export function mergeTableCells(editor: Editor) {
  editor
    .chain()
    .focus()
    .mergeCells()
    .command(({ tr }) => {
      if (tr.selection instanceof CellSelection)
        tr.setSelection(
          TextSelection.near(tr.doc.resolve(tr.selection.$anchorCell.pos + 1)),
        );
      return true;
    })
    .run();
}

export function setTableBorderStyle(editor: Editor, style: string | null) {
  const rect = selectedRect(editor.state);
  const tr = editor.state.tr;
  for (const offset of rect.map.cellsInRect(rect)) {
    const cell = rect.table.nodeAt(offset)!;
    const attrs: Record<string, unknown> = {
      ...cell.attrs,
      borderStyle: style,
    };
    for (const side of ['Top', 'Right', 'Bottom', 'Left']) {
      const name = 'cellBorder' + side;
      if (attrs[name] && attrs[name] !== 'none') attrs[name] = style;
    }
    tr.setNodeMarkup(rect.tableStart + offset, undefined, attrs);
  }
  editor.view.dispatch(tr);
  editor.view.focus();
}

export function splitTableCell(editor: Editor, columns: number, rows: number) {
  if (
    ![columns, rows].every(
      (value) => Number.isInteger(value) && value >= 1 && value <= 10,
    )
  )
    return false;
  const rect = selectedRect(editor.state);
  const target = rect.map.map[rect.top * rect.map.width + rect.left];
  const cell = rect.table.nodeAt(target)!;
  const box = rect.map.findCell(target);
  const x = Array.from(
    { length: rect.map.width + 1 },
    (_, index) =>
      index +
      Math.max(0, Math.min(index - box.left, box.right - box.left)) *
        (columns - 1),
  );
  const y = Array.from(
    { length: rect.map.height + 1 },
    (_, index) =>
      index +
      Math.max(0, Math.min(index - box.top, box.bottom - box.top)) * (rows - 1),
  );
  if (x.at(-1)! * y.at(-1)! > 10000) return false;
  const result: { left: number; node: ProseMirrorNode }[][] = Array.from(
    { length: y.at(-1)! },
    () => [],
  );
  for (const offset of new Set(rect.map.map)) {
    const node = rect.table.nodeAt(offset)!;
    const bounds = rect.map.findCell(offset);
    const colwidth = node.attrs.colwidth
      ? node.attrs.colwidth.flatMap((width: number, index: number) => {
          const col = bounds.left + index;
          const count = x[col + 1] - x[col];
          return Array(count).fill(
            width ? Math.max(1, Math.round(width / count)) : 0,
          );
        })
      : null;
    if (offset !== target) {
      result[y[bounds.top]].push({
        left: x[bounds.left],
        node: node.type.create(
          {
            ...node.attrs,
            colspan: x[bounds.right] - x[bounds.left],
            rowspan: y[bounds.bottom] - y[bounds.top],
            colwidth,
          },
          node.content,
          node.marks,
        ),
      });
      continue;
    }
    for (let row = 0; row < rows; row++) {
      for (let col = 0; col < columns; col++) {
        const attrs = {
          ...cell.attrs,
          colwidth:
            colwidth?.slice(
              col * cell.attrs.colspan,
              (col + 1) * cell.attrs.colspan,
            ) ?? null,
        };
        const part =
          row === 0 && col === 0
            ? cell.type.create(attrs, cell.content, cell.marks)
            : cell.type.createAndFill(attrs)!;
        result[y[box.top] + row * cell.attrs.rowspan].push({
          left: x[box.left] + col * cell.attrs.colspan,
          node: part,
        });
      }
    }
  }
  const newRows: ProseMirrorNode[] = [];
  rect.table.forEach((row, _offset, index) => {
    const count = y[index + 1] - y[index];
    for (let part = 0; part < count; part++) {
      const cells = result[y[index] + part]
        .sort((a, b) => a.left - b.left)
        .map((entry) => entry.node);
      newRows.push(
        row.type.create(
          {
            ...row.attrs,
            rowHeight: row.attrs.rowHeight
              ? Math.max(16, Math.round(row.attrs.rowHeight / count))
              : null,
          },
          cells,
        ),
      );
    }
  });
  const table = rect.table.type.create(
    rect.table.attrs,
    newRows,
    rect.table.marks,
  );
  const map = TableMap.get(table);
  if (map.problems?.length) return false;
  const tr = editor.state.tr.replaceWith(
    rect.tableStart - 1,
    rect.tableStart - 1 + rect.table.nodeSize,
    table,
  );
  tr.setSelection(
    TextSelection.near(
      tr.doc.resolve(
        rect.tableStart + map.map[y[box.top] * map.width + x[box.left]] + 1,
      ),
    ),
  );
  editor.view.dispatch(tr);
  editor.view.focus();
  return true;
}

export function setTableBorders(editor: Editor, mode: string) {
  const rect = selectedRect(editor.state);
  const tr = editor.state.tr;
  const sides = ['Top', 'Right', 'Bottom', 'Left'] as const;
  const selected = new Set(rect.map.cellsInRect(rect));
  const updates = new Map<number, Record<string, unknown>>();
  for (const offset of selected) {
    const cell = rect.table.nodeAt(offset)!;
    const box = rect.map.findCell(offset);
    const outer = [
      box.top === rect.top,
      box.right === rect.right,
      box.bottom === rect.bottom,
      box.left === rect.left,
    ];
    const attrs = { ...cell.attrs };
    sides.forEach((side, index) => {
      const enabled =
        mode === 'all' ||
        (mode === 'outer' && outer[index]) ||
        (mode === 'inner' && !outer[index]) ||
        (mode === side.toLowerCase() && outer[index]) ||
        (mode === 'horizontal' && index % 2 === 0 && !outer[index]) ||
        (mode === 'vertical' && index % 2 === 1 && !outer[index]);
      attrs['cellBorder' + side] = enabled
        ? cell.attrs.borderStyle || 'solid'
        : 'none';
    });
    updates.set(offset, attrs);
  }
  // Collapsed borders share an edge: update the adjoining cell's opposite side too.
  const neighbor = (row: number, col: number, side: string, style: unknown) => {
    if (row < 0 || row >= rect.map.height || col < 0 || col >= rect.map.width)
      return;
    const offset = rect.map.map[row * rect.map.width + col];
    if (selected.has(offset)) return;
    const attrs = updates.get(offset) ?? {
      ...rect.table.nodeAt(offset)!.attrs,
    };
    attrs['cellBorder' + side] = style;
    updates.set(offset, attrs);
  };
  for (const offset of selected) {
    const box = rect.map.findCell(offset);
    const attrs = updates.get(offset)!;
    for (let col = box.left; col < box.right; col++) {
      neighbor(box.top - 1, col, 'Bottom', attrs.cellBorderTop);
      neighbor(box.bottom, col, 'Top', attrs.cellBorderBottom);
    }
    for (let row = box.top; row < box.bottom; row++) {
      neighbor(row, box.left - 1, 'Right', attrs.cellBorderLeft);
      neighbor(row, box.right, 'Left', attrs.cellBorderRight);
    }
  }
  for (const [offset, attrs] of updates)
    tr.setNodeMarkup(rect.tableStart + offset, undefined, attrs);
  editor.view.dispatch(tr);
  editor.view.focus();
}
