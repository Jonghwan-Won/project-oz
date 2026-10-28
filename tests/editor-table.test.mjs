import test from 'node:test';
import assert from 'node:assert/strict';
import { getSchema } from '@tiptap/core';
import { EditorState, TextSelection } from '@tiptap/pm/state';
import { CellSelection, TableMap, mergeCells } from '@tiptap/pm/tables';
import { richTextExtensions, parseRichText } from '../src/lib/rich-text.ts';
import {
  tableSelectionBounds,
  leaveInsertedTable,
  splitTableCell,
  equalizeTableCells,
  setTableBorders,
  mergeTableCells,
} from '../src/lib/editor-table.ts';

const schema = getSchema(richTextExtensions);
const p = (text) =>
  schema.nodes.paragraph.create(null, text ? schema.text(text) : null);
const cell = (text, attrs) => schema.nodes.tableCell.create(attrs, p(text));
const row = (...cells) => schema.nodes.tableRow.create(null, cells);
const table = (...rows) => schema.nodes.table.create(null, rows);
function fixture(
  node,
  selection = (doc) => TextSelection.create(doc, 4),
  trailing = true,
) {
  const doc = schema.nodes.doc.create(
    null,
    trailing ? [node, p('after')] : [node],
  );
  const editor = {
    schema,
    state: EditorState.create({ doc, selection: selection(doc) }),
  };
  editor.view = {
    dispatch: (tr) => {
      editor.state = editor.state.apply(tr);
    },
    focus() {},
    nodeDOM: () => null,
  };
  return editor;
}
function selectCells(doc, first, last) {
  const map = TableMap.get(doc.firstChild);
  return CellSelection.create(doc, 1 + map.map[first], 1 + map.map[last]);
}
class Rect {
  constructor(x, y, width, height) {
    Object.assign(this, {
      x,
      y,
      left: x,
      top: y,
      width,
      height,
      right: x + width,
      bottom: y + height,
    });
  }
}
class ElementStub {
  constructor(rect) {
    this.rect = rect;
  }
  getBoundingClientRect() {
    return this.rect;
  }
}

// Layout-only geometry is supplied without launching a browser.
test('anchor follows the current cell and the full selection in either drag direction', () => {
  const previous = [globalThis.Element, globalThis.DOMRect];
  globalThis.Element = ElementStub;
  globalThis.DOMRect = Rect;
  try {
    const editor = fixture(
      table(row(cell('a'), cell('b')), row(cell('c'), cell('d'))),
    );
    const map = TableMap.get(editor.state.doc.firstChild);
    editor.view.nodeDOM = (pos) => {
      const index = map.map.indexOf(pos - 1);
      return new ElementStub(
        new Rect((index % 2) * 100, Math.floor(index / 2) * 30, 100, 30),
      );
    };
    assert.deepEqual(tableSelectionBounds(editor), new Rect(0, 30, 100, 0));
    editor.view.dispatch(
      editor.state.tr.setSelection(
        TextSelection.create(editor.state.doc, 1 + map.map[3] + 2),
      ),
    );
    assert.deepEqual(tableSelectionBounds(editor), new Rect(100, 60, 100, 0));
    for (const [first, last] of [
      [0, 3],
      [3, 0],
    ]) {
      editor.view.dispatch(
        editor.state.tr.setSelection(
          selectCells(editor.state.doc, first, last),
        ),
      );
      assert.deepEqual(tableSelectionBounds(editor), new Rect(0, 60, 200, 0));
    }
  } finally {
    [globalThis.Element, globalThis.DOMRect] = previous;
  }
});

test('insertion exits the table, retaining existing following text or adding a paragraph', () => {
  for (const trailing of [true, false]) {
    const editor = fixture(table(row(cell('content'))), undefined, trailing);
    leaveInsertedTable(editor);
    assert.equal(editor.state.selection.$from.parent.type.name, 'paragraph');
    assert.equal(editor.state.selection.$from.depth, 1);
    assert.equal(editor.state.doc.childCount, 2);
    assert.equal(
      editor.state.doc.lastChild.textContent,
      trailing ? 'after' : '',
    );
  }
});

test('split ordinary and merged cells keeps content, adjacent spans and a valid table', () => {
  for (const source of [
    table(
      row(cell('keep'), cell('neighbor')),
      row(cell('below'), cell('last')),
    ),
    table(
      row(cell('merged', { colspan: 2 }), cell('right')),
      row(cell('a'), cell('b'), cell('c')),
    ),
  ]) {
    const editor = fixture(source);
    const text = editor.state.doc.textContent;
    assert.equal(splitTableCell(editor, 2, 3), true);
    assert.equal(editor.state.doc.textContent, text);
    assert.equal(TableMap.get(editor.state.doc.firstChild).problems, null);
    assert.ok(parseRichText(editor.state.doc.toJSON()));
    assert.ok(editor.state.selection instanceof TextSelection);
    const before = editor.state.doc;
    assert.equal(splitTableCell(editor, 0, 2), false);
    assert.equal(splitTableCell(editor, 2.5, 2), false);
    assert.equal(editor.state.doc, before);
  }
});

test('equal sizes uses selected columns and rows and retains cell selection', () => {
  const previous = globalThis.Element;
  globalThis.Element = ElementStub;
  try {
    const editor = fixture(
      table(row(cell('a'), cell('b')), row(cell('c'), cell('d'))),
      (doc) => selectCells(doc, 0, 3),
    );
    const map = TableMap.get(editor.state.doc.firstChild);
    editor.view.nodeDOM = (pos) => {
      const index = map.map.indexOf(pos - 1);
      return new ElementStub(
        new Rect(0, 0, index % 2 ? 180 : 100, pos === 1 ? 20 : 40),
      );
    };
    equalizeTableCells(editor, 'both');
    editor.state.doc.firstChild.forEach((row) => {
      assert.equal(row.attrs.rowHeight, 30);
      row.forEach((cell) => assert.deepEqual(cell.attrs.colwidth, [140]));
    });
    assert.ok(editor.state.selection instanceof CellSelection);
    assert.ok(parseRichText(editor.state.doc.toJSON()));
  } finally {
    globalThis.Element = previous;
  }
});

test('border presets survive validation and invalid CSS is rejected', () => {
  const editor = fixture(
    table(row(cell('a'), cell('b')), row(cell('c'), cell('d'))),
    (doc) => selectCells(doc, 0, 3),
  );
  setTableBorders(editor, 'outer');
  const first = editor.state.doc.firstChild.firstChild.firstChild;
  assert.equal(first.attrs.cellBorderTop, 'solid');
  assert.equal(first.attrs.cellBorderRight, 'none');
  assert.ok(parseRichText(editor.state.doc.toJSON()));
  const json = structuredClone(editor.state.doc.toJSON());
  json.content[0].content[0].content[0].attrs.cellBorderTop =
    'url(https://bad)';
  assert.equal(parseRichText(json), null);
  const wide = structuredClone(editor.state.doc.toJSON());
  wide.content[0].content[0].content[0].attrs.borderWidth = 10;
  wide.content[0].content[0].content[0].attrs.borderStyle = 'double';
  assert.ok(parseRichText(wide));
  wide.content[0].content[0].content[0].attrs.borderWidth = 11;
  assert.equal(parseRichText(wide), null);
});

test('merging clears cell selection and preserves all content', () => {
  const editor = fixture(table(row(cell('a'), cell('b'))), (doc) =>
    selectCells(doc, 0, 1),
  );
  let tr;
  const chain = {
    focus() {
      return this;
    },
    mergeCells() {
      mergeCells(editor.state, (value) => {
        tr = value;
      });
      return this;
    },
    command(fn) {
      fn({ tr });
      return this;
    },
    run() {
      editor.view.dispatch(tr);
      return true;
    },
  };
  editor.chain = () => chain;
  mergeTableCells(editor);
  assert.ok(editor.state.selection instanceof TextSelection);
  assert.equal(editor.state.doc.firstChild.firstChild.childCount, 1);
  assert.equal(editor.state.doc.firstChild.textContent, 'ab');
});

test('insertion caret is transient and typing resumes outside the table', () => {
  const extension = richTextExtensions.find(
    (extension) => extension.name === 'tableInsertionCursor',
  );
  const plugins = extension.config.addProseMirrorPlugins();
  const node = table(row(cell('inside')));
  const editor = fixture(node, undefined, false);
  editor.state = EditorState.create({
    doc: editor.state.doc,
    selection: editor.state.selection,
    plugins,
  });
  leaveInsertedTable(editor);
  const decorations = plugins[0].props.decorations(editor.state).find();
  assert.equal(decorations.length, 2);
  assert.equal(
    decorations[0].type.attrs['data-table-insertion-cursor'],
    'true',
  );
  editor.view.dispatch(editor.state.tr.insertText('outside'));
  assert.equal(plugins[0].props.decorations(editor.state), null);
  assert.equal(editor.state.doc.lastChild.textContent, 'outside');
  assert.equal(editor.state.doc.firstChild.textContent, 'inside');
});

test('clearing a shared border updates both cells without changing distant cells', () => {
  const editor = fixture(table(row(cell('a'), cell('b'), cell('c'))));
  setTableBorders(editor, 'none');
  const cells = editor.state.doc.firstChild.firstChild;
  assert.equal(cells.child(0).attrs.cellBorderRight, 'none');
  assert.equal(cells.child(1).attrs.cellBorderLeft, 'none');
  assert.equal(cells.child(2).attrs.cellBorderLeft, null);
});

test('Mod-a selects every table cell and leaves outside shortcuts untouched', () => {
  const editor = fixture(
    table(row(cell('a'), cell('b')), row(cell('c'), cell('d'))),
  );
  const extension = richTextExtensions.find(
    (item) => item.name === 'tableControls',
  );
  const shortcuts = extension.config.addKeyboardShortcuts.call({ editor });
  assert.equal(shortcuts['Mod-a'](), true);
  assert.ok(editor.state.selection instanceof CellSelection);
  assert.equal(editor.state.selection.ranges.length, 4);
  editor.view.dispatch(
    editor.state.tr.setSelection(
      TextSelection.create(
        editor.state.doc,
        editor.state.doc.firstChild.nodeSize + 1,
      ),
    ),
  );
  assert.equal(shortcuts['Mod-a'](), false);
});

test('outside table clicks place a text cursor before or after without changing table contents', async () => {
  const { moveCursorOutsideTable } = await import('../src/lib/rich-text.ts');
  for (const after of [false, true]) {
    for (const trailing of [false, true]) {
      const editor = fixture(table(row(cell('keep'))), undefined, trailing);
      const tableBefore = editor.state.doc.firstChild.toJSON();
      Object.defineProperty(editor.view, 'state', { get: () => editor.state });
      moveCursorOutsideTable(editor.view, 0, after);
      assert.equal(editor.state.selection.$from.depth, 1);
      assert.equal(editor.state.selection.$from.parent.type.name, 'paragraph');
      assert.equal(editor.state.selection.$from.index(0), after ? 1 : 0);
      const tableAfter = editor.state.doc.child(after ? 0 : 1);
      assert.deepEqual(tableAfter.toJSON(), tableBefore);
      if (trailing)
        assert.equal(editor.state.doc.lastChild.textContent, 'after');
    }
  }
});

test('table outside-click handling leaves paragraph drag and soft-break line clicks native', () => {
  const extension = richTextExtensions.find(
    (item) => item.name === 'tableControls',
  );
  const plugin = extension.config.addProseMirrorPlugins()[0];
  const original = globalThis.Element;
  class ParagraphTarget {
    closest(selector) {
      return selector.split(',').includes('p') ? this : null;
    }
  }
  globalThis.Element = ParagraphTarget;
  try {
    const view = {
      editable: true,
      state: {
        doc: {
          descendants() {
            assert.fail('must not redirect paragraph clicks');
          },
        },
      },
    };
    const event = {
      button: 0,
      target: new ParagraphTarget(),
      preventDefault() {
        assert.fail('must preserve native text selection');
      },
    };
    assert.equal(plugin.props.handleDOMEvents.mousedown(view, event), false);
  } finally {
    globalThis.Element = original;
  }
});

test('empty editor table insertion leaves a normal cursor on the following line', () => {
  const extension = richTextExtensions.find(
    (item) => item.name === 'tableInsertionCursor',
  );
  const plugins = extension.config.addProseMirrorPlugins();
  const editor = fixture(
    table(row(cell(''), cell(''), cell(''))),
    undefined,
    false,
  );
  editor.state = EditorState.create({
    doc: editor.state.doc,
    selection: editor.state.selection,
    plugins,
  });
  leaveInsertedTable(editor);
  assert.equal(editor.state.selection.$from.depth, 1);
  assert.equal(editor.state.selection.$from.index(0), 1);
  assert.equal(plugins[0].props.decorations(editor.state), null);
});

test('internal column borders redistribute width only between adjacent columns', async () => {
  const { resizeAdjacentColumns } = await import('../src/lib/rich-text.ts');
  assert.deepEqual(
    resizeAdjacentColumns([120, 120, 120], 0, -30),
    [90, 150, 120],
  );
  assert.deepEqual(
    resizeAdjacentColumns([120, 120, 120], 1, -30),
    [120, 90, 150],
  );
  assert.deepEqual(
    resizeAdjacentColumns([120, 120, 120], 0, -200),
    [60, 180, 120],
  );
  assert.deepEqual(
    resizeAdjacentColumns([120, 120, 120], 1, 200),
    [120, 180, 60],
  );
});

test('cell-targeted boundary drag changes adjacent columns and undo restores the document', async () => {
  const { columnResizingPluginKey } = await import('@tiptap/pm/tables');
  const { history, undo, redo } = await import('@tiptap/pm/history');
  const editor = fixture(
    table(
      row(
        cell('a', { colwidth: [120] }),
        cell('b', { colwidth: [120] }),
        cell('c', { colwidth: [120] }),
      ),
    ),
  );
  editor.state = EditorState.create({
    doc: editor.state.doc,
    selection: editor.state.selection,
    plugins: [history()],
  });
  const before = editor.state.doc.toJSON();
  Object.defineProperty(editor.view, 'state', { get: () => editor.state });
  const extension = richTextExtensions.find(
    (item) => item.name === 'tableControls',
  );
  const handler =
    extension.config.addProseMirrorPlugins()[0].props.handleDOMEvents.mousedown;
  const original = [globalThis.Element, globalThis.window];
  const listeners = new Map();
  const cols = [120, 120, 120].map((width) => ({
    style: { cssText: '', width: width + 'px' },
    getBoundingClientRect: () => ({ width }),
  }));
  class CellTarget {
    closest(selector) {
      return selector === 'table' ? { querySelectorAll: () => cols } : null;
    }
  }
  globalThis.Element = CellTarget;
  globalThis.window = {
    addEventListener: (name, fn) => listeners.set(name, fn),
    removeEventListener: (name) => listeners.delete(name),
  };
  editor.view.editable = true;
  editor.view.nodeDOM = () => new CellTarget();
  editor.state[columnResizingPluginKey.key] = { activeHandle: 2 };
  try {
    assert.equal(
      handler(editor.view, {
        button: 0,
        target: new CellTarget(),
        clientX: 120,
        preventDefault() {},
        stopPropagation() {},
      }),
      true,
    );
    listeners.get('mousemove')({ clientX: 90 });
    assert.deepEqual(
      cols.map((col) => col.style.width),
      ['90px', '150px', '120px'],
    );
    listeners.get('mouseup')();
    const snapshots = [before, editor.state.doc.toJSON()];
    for (let attempt = 0; attempt < 3; attempt++) {
      editor.state[columnResizingPluginKey.key] = { activeHandle: 2 };
      assert.equal(
        handler(editor.view, {
          button: 0,
          target: new CellTarget(),
          clientX: 120,
          preventDefault() {},
          stopPropagation() {},
        }),
        true,
      );
      listeners.get('mousemove')({ clientX: 100 + attempt * 5 });
      listeners.get('mouseup')();
      snapshots.push(editor.state.doc.toJSON());
    }
    for (let index = 3; index >= 0; index--) {
      assert.equal(undo(editor.state, editor.view.dispatch), true);
      assert.deepEqual(editor.state.doc.toJSON(), snapshots[index]);
    }
    for (let index = 1; index <= 4; index++) {
      assert.equal(redo(editor.state, editor.view.dispatch), true);
      assert.deepEqual(editor.state.doc.toJSON(), snapshots[index]);
    }
  } finally {
    [globalThis.Element, globalThis.window] = original;
  }
});

test('undoing the first resize clears stale DOM widths on initially automatic columns', async () => {
  const { clearUnsetColumnWidths } = await import('../src/lib/rich-text.ts');
  const node = table(row(cell('a'), cell('b'), cell('c')));
  const cols = [90, 150, 120].map((width) => ({
    style: {
      width: width + 'px',
      removeProperty(name) {
        this[name] = '';
      },
    },
  }));
  clearUnsetColumnWidths(node, cols);
  assert.deepEqual(
    cols.map((col) => col.style.width),
    ['', '', ''],
  );
});
