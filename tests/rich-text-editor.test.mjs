import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import ts from 'typescript';

const require = createRequire(import.meta.url);
const code = ts.transpileModule(
  readFileSync('src/components/ui/CommonRichTextEditor.tsx', 'utf8'),
  {
    compilerOptions: {
      module: ts.ModuleKind.CommonJS,
      target: ts.ScriptTarget.ES2022,
      jsx: ts.JsxEmit.ReactJSX,
      esModuleInterop: true,
    },
  },
).outputText;

test('editor changes propagate when an uploaded image is inserted before focus returns', () => {
  let options;
  const modules = {
    react: {
      useCallback: (callback) => callback,
      useState: (initial) => [initial, () => {}],
      useEffect: () => {},
      useRef: (value) => ({ current: value }),
    },
    '@tiptap/react': {
      useEditor: (value) => {
        options = value;
        return null;
      },
    },
    '@/lib/rich-text': {
      parseRichText: (value) => value,
      richTextExtensions: [],
    },
    './CommonSelectBox': {},
    './EditorColorPicker': {},
    '@tiptap/react/menus': {},
    './CommonFileUpload': {},
    './CommonFilePicker': {},
    './CommonButton': {},
    './CommonLoading': {},
    '@/lib/files': { maxUploadBytes: 10 * 1024 * 1024 },
    '@/lib/upload-file': {},
    './CommonRichText.module.css': { __esModule: true, default: {} },
  };
  const exports = {};
  new Function('require', 'exports', code)(
    (id) => modules[id] ?? require(id),
    exports,
  );
  const changes = [];
  exports.CommonRichTextEditor({
    id: 'editor',
    label: '본문',
    value: { type: 'doc' },
    onChange: (...args) => changes.push(args),
  });
  const body = {
    type: 'doc',
    content: [
      {
        type: 'image',
        attrs: { src: '/api/assets/00000000-0000-0000-0000-000000000001' },
      },
    ],
  };
  options.onUpdate({
    editor: { isFocused: false, getJSON: () => body, getText: () => '' },
  });
  assert.deepEqual(changes, [[body, '']]);
});

test('pasted image uploads before insertion and keeps save blocked while uploading', async () => {
  let options, resolveUpload;
  const busy = [],
    inserted = [],
    files = [];
  const modules = {
    react: {
      useCallback: (callback) => callback,
      useState: (initial) => [initial, () => {}],
      useEffect: () => {},
      useRef: (value) => ({ current: value }),
    },
    '@tiptap/react': {
      useEditor: (value) => {
        options = value;
        return null;
      },
    },
    '@/lib/rich-text': {
      parseRichText: (value) => value,
      richTextExtensions: [],
    },
    '@/lib/files': { maxUploadBytes: 10 * 1024 * 1024 },
    '@/lib/upload-file': {
      uploadFile: (file) => {
        files.push(file);
        return new Promise((resolve) => {
          resolveUpload = resolve;
        });
      },
    },
    './CommonSelectBox': {},
    './EditorColorPicker': {},
    '@tiptap/react/menus': {},
    './CommonFileUpload': {},
    './CommonFilePicker': {},
    './CommonButton': {},
    './CommonLoading': {},
    './CommonRichText.module.css': { __esModule: true, default: {} },
  };
  const exports = {};
  new Function('require', 'exports', code)(
    (id) => modules[id] ?? require(id),
    exports,
  );
  exports.CommonRichTextEditor({
    id: 'editor',
    label: '본문',
    value: { type: 'doc' },
    onChange: () => {},
    onUploadBusyChange: (value) => busy.push(value),
  });
  const view = {
    isDestroyed: false,
    state: {
      schema: { nodes: { image: { create: (attrs) => attrs } } },
      tr: { replaceSelectionWith: (node) => node },
    },
    dispatch: (node) => inserted.push(node),
  };
  const file = new File(['image'], 'capture', { type: 'image/png' });
  let prevented = false;
  const event = {
    clipboardData: {
      items: [{ kind: 'file', type: 'image/png', getAsFile: () => file }],
    },
    preventDefault: () => {
      prevented = true;
    },
  };
  assert.equal(options.editorProps.handlePaste(view, event), true);
  assert.equal(prevented, true);
  assert.deepEqual(busy, [true]);
  assert.equal(files[0].name, 'clipboard.png');
  resolveUpload({
    url: '/api/assets/00000000-0000-0000-0000-000000000001',
    name: 'clipboard.png',
  });
  await new Promise((resolve) => setImmediate(resolve));
  assert.equal(
    inserted[0].src,
    '/api/assets/00000000-0000-0000-0000-000000000001',
  );
  assert.deepEqual(busy, [true, false]);
  assert.equal(
    options.editorProps.handlePaste(view, { clipboardData: { items: [] } }),
    false,
  );
  assert.match(
    readFileSync('src/app/guide/GuideExamples.tsx', 'utf8'),
    /<CommonRichTextEditor[\s\S]*?uploadsEnabled=\{false\}/,
  );
  exports.CommonRichTextEditor({
    id: 'guide',
    label: '가이드 에디터',
    value: { type: 'doc' },
    onChange: () => {},
    uploadsEnabled: false,
    onLocalImage: () => 'blob:guide-image',
  });
  assert.equal(options.editorProps.handlePaste(view, event), true);
  assert.equal(files.length, 1);
  assert.equal(inserted.length, 2);
  assert.equal(inserted[1].src, 'blob:guide-image');
  assert.deepEqual(busy, [true, false]);
});

test('parent echo preserves the code block cursor, but external content still replaces it', () => {
  let options,
    effects = [],
    refs = [],
    refIndex = 0,
    replacements = 0;
  const body = {
    type: 'doc',
    content: [{ type: 'codeBlock', content: [{ type: 'text', text: 'a' }] }],
  };
  const instance = {
    setEditable: () => {},
    commands: { setContent: () => replacements++ },
    getJSON: () => ({
      ...body,
      content: [...body.content, { type: 'paragraph' }],
    }),
    getText: () => 'a',
  };
  const modules = {
    react: {
      useCallback: (callback) => callback,
      useState: (initial) => [initial, () => {}],
      useEffect: (effect) => effects.push(effect),
      useRef: (initial) =>
        refs[refIndex++] ?? (refs[refIndex - 1] = { current: initial }),
    },
    '@tiptap/react': {
      useEditor: (value) => {
        options = value;
        return null;
      },
    },
    '@tiptap/react/menus': {},
    './EditorColorPicker': {},
    '@/lib/rich-text': {
      parseRichText: (value) => value,
      richTextExtensions: [],
    },
    './CommonSelectBox': {},
    './CommonFileUpload': {},
    './CommonFilePicker': {},
    './CommonButton': {},
    './CommonLoading': {},
    '@/lib/files': {},
    '@/lib/upload-file': {},
    './CommonRichText.module.css': { __esModule: true, default: {} },
  };
  const exports = {};
  new Function('require', 'exports', code)(
    (id) => modules[id] ?? require(id),
    exports,
  );
  // Stop rendering after hooks; the synchronization effect still closes over this editor.
  modules['@tiptap/react'].useEditor = (value) => {
    options = value;
    return instance;
  };
  instance.isActive = () => false;
  instance.getAttributes = () => ({});
  instance.can = () => ({
    undo: () => false,
    redo: () => false,
    mergeCells: () => false,
    splitCell: () => false,
  });
  let echoed;
  const render = (value) => {
    refIndex = 0;
    effects = [];
    exports.CommonRichTextEditor({
      id: 'editor',
      label: '본문',
      value,
      onChange: (value) => {
        echoed = value;
      },
    });
  };
  render(body);
  options.onUpdate({ editor: { getJSON: () => body, getText: () => 'a' } });
  render(echoed);
  effects.at(-1)();
  assert.equal(replacements, 0);
  render({ type: 'doc', content: [{ type: 'paragraph' }] });
  effects.at(-1)();
  assert.equal(replacements, 1);
});

test('color palettes are hidden initially while inline table settings remain visible', async () => {
  const React = await import('react');
  const { renderToStaticMarkup } = await import('react-dom/server');
  const { MantineProvider } = require('@mantine/core');
  const source = ts.transpileModule(
    readFileSync('src/components/ui/EditorColorPicker.tsx', 'utf8'),
    {
      compilerOptions: {
        module: ts.ModuleKind.CommonJS,
        target: ts.ScriptTarget.ES2022,
        jsx: ts.JsxEmit.ReactJSX,
        esModuleInterop: true,
      },
    },
  ).outputText;
  const exports = {};
  new Function('require', 'exports', source)((id) => {
    if (id === './CommonButton')
      return { CommonButton: (props) => React.createElement('button', props) };
    if (id.endsWith('.module.css')) return { __esModule: true, default: {} };
    return require(id);
  }, exports);
  const render = (inline) =>
    renderToStaticMarkup(
      React.createElement(
        MantineProvider,
        {},
        React.createElement(exports.EditorColorPicker, {
          label: '글자 색상',
          inline,
          onChange: () => {},
        }),
      ),
    );
  assert.doesNotMatch(render(false), /HEX|최근 사용한 색|#ffcccc/);
  assert.match(render(false), /aria-expanded="false"/);
  assert.match(render(true), /HEX/);
});
