import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import ts from 'typescript';
const require = createRequire(import.meta.url);
function component(file, overrides = {}, state = (value) => value) {
  const components = new Map();
  const calls = [];
  const modules = {
    react: {
      useState: (value) => [state(value), () => {}],
      useRef: (value) => ({ current: value }),
      useEffect: () => {},
      useLayoutEffect: () => {},
      useTransition: () => [false, (fn) => fn()],
    },
    'next/navigation': {
      usePathname: () => '/',
      useRouter: () => ({
        replace: (path) => calls.push(path),
        refresh: () => calls.push('refresh'),
      }),
    },
    '@/lib/admin-list': {
      emptyProjectSearch: {},
      emptyBoardSearch: {},
      paginate: (items) => ({ items, totalPages: 1, page: 1 }),
    },
    '@/lib/admin-assets': {
      emptyAssetSearch: {},
      formatAssetSize: (value) => `${value}B`,
    },
    '@/lib/project-detail': { formatProjectPeriod: () => '' },
    '@/lib/files': { thumbnailUrl: () => false },
    '@/content/site': { categories: [] },
    '@/lib/post-categories': {
      defaultPostCategories: [],
      postCategoryLabel: (code) => code,
    },
    ...overrides,
  };
  const output = ts.transpileModule(
    readFileSync(new URL(file, import.meta.url), 'utf8'),
    {
      compilerOptions: {
        module: ts.ModuleKind.CommonJS,
        jsx: ts.JsxEmit.ReactJSX,
        target: ts.ScriptTarget.ES2022,
        esModuleInterop: true,
      },
    },
  ).outputText;
  const exports = {};
  new Function('require', 'exports', output)((id) => {
    if (id === 'react/jsx-runtime') return require(id);
    if (id in modules) return modules[id];
    if (id.endsWith('.css')) return { __esModule: true, default: {} };
    if (!components.has(id))
      components.set(
        id,
        new Proxy(
          {},
          {
            get: (_target, name) => {
              if (name === '__esModule') return true;
              return String(name);
            },
          },
        ),
      );
    return components.get(id);
  }, exports);
  return { exports, calls };
}
function elements(node) {
  if (Array.isArray(node)) return node.flatMap(elements);
  if (!node || typeof node !== 'object' || !node.props) return [];
  return [
    node,
    ...elements(node.props.children),
    ...elements(node.props.actions),
  ];
}
const copy = {
  title: 'Public title',
  summary: '',
  body: { type: 'doc', content: [] },
};
const post = {
  id: 'id',
  category: '개발',
  isVisible: true,
  translations: { ko: copy, en: copy },
};

test('post detail keeps preview and list available while blocking inputs, editor, save and delete', () => {
  const { exports } = component('../src/app/admin/PostEditor.tsx');
  const nodes = elements(
    exports.PostEditor({ initialPost: post, readOnly: true }),
  );
  for (const label of ['저장', '삭제'])
    assert.equal(
      nodes.find((n) => n.type === 'CommonButton' && n.props.children === label)
        .props.disabled,
      true,
    );
  for (const label of ['목록', '미리보기'])
    assert.equal(
      nodes.find((n) => n.type === 'CommonButton' && n.props.children === label)
        .props.disabled,
      false,
    );
  for (const node of nodes.filter((n) =>
    [
      'CommonInput',
      'CommonTextArea',
      'CommonSelectBox',
      'CommonRichTextEditor',
      'Switch',
    ].includes(n.type),
  ))
    assert.equal(node.props.disabled, true);
  assert.equal(
    nodes.find((n) => n.type === 'CommonRichTextEditor').props.uploadsEnabled,
    false,
  );
});

test('project modal retains preview while blocking form fields, editor, uploads and save', () => {
  let injected = false;
  const draft = {
    ...post,
    customerName: '',
    startedOn: '',
    endedOn: '',
    thumbnail: '',
    originCode: '',
    typeCode: '',
    technologies: [],
    tags: [],
    thumbnailFile: {
      id: 'thumb',
      name: 'thumb.png',
      size: 100,
      downloadUrl: '/download/thumb',
    },
    attachmentIds: ['file'],
    files: [
      {
        id: 'file',
        name: 'file.pdf',
        size: 100,
        downloadUrl: '/download/file',
      },
    ],
  };
  const { exports } = component(
    '../src/app/admin/ProjectManager.tsx',
    {},
    (value) => {
      if (value === null && !injected) {
        injected = true;
        return draft;
      }
      return value;
    },
  );
  const nodes = elements(
    exports.ProjectManager({
      projects: [],
      codes: [],
      total: 0,
      initialSearch: {},
      readOnly: true,
    }),
  );
  assert.equal(nodes.find((n) => n.type === 'fieldset').props.disabled, true);
  const links = nodes.filter((n) => n.type === 'a');
  assert.equal(links.length, 2);
  for (const link of links) {
    assert.equal(link.props.href, undefined);
    assert.equal(link.props['aria-disabled'], true);
  }
  assert.equal(
    nodes.find(
      (n) => n.type === 'CommonButton' && n.props.children === '미리보기',
    ).props.disabled,
    false,
  );
  assert.equal(
    nodes.find((n) => n.type === 'CommonButton' && n.props.children === '저장')
      .props.disabled,
    true,
  );
  for (const node of nodes.filter((n) =>
    ['CommonRichTextEditor', 'CommonFileUpload'].includes(n.type),
  ))
    assert.equal(node.props.disabled, true);
});

test('asset preview disables downloading and source navigation', () => {
  const { exports } = component('../src/app/admin/AssetManager.tsx');
  const nodes = elements(
    exports.AssetManager({
      assets: [],
      totals: { total: 0, size: 0, unused: 0, unusedSize: 0 },
      initialSearch: {},
      readOnly: true,
    }),
  );
  const columns = nodes.find((n) => n.type === 'CommonGrid').props.columns;
  assert.equal(
    nodes.find((n) => n.props['aria-label'] === '파일명 검색').props.disabled,
    true,
  );
  const asset = {
    id: 'id',
    name: 'image.png',
    usages: [{ type: 'post', id: 'post', title: 'Public title' }],
  };
  const name = columns.find((c) => c.key === 'name').render(asset);
  assert.equal(name.props.href, undefined);
  assert.equal(name.props['aria-disabled'], true);
  for (const link of elements(
    columns.find((c) => c.key === 'source').render(asset),
  ).filter((n) => n.type === 'a')) {
    assert.equal(link.props.href, undefined);
    assert.equal(link.props['aria-disabled'], true);
  }
  assert.equal(
    nodes.find((n) => n.type === 'CommonButton' && n.props.children === '삭제')
      .props.disabled,
    true,
  );
});

test('signed-in headers render sign-out on desktop and mobile and refresh after signing out', async () => {
  const { exports, calls } = component('../src/components/Header.tsx', {
    '@/lib/auth-client': {
      authClient: {
        useSession: () => ({
          data: { user: { id: 'owner' } },
          isPending: false,
        }),
        signOut: async () => ({}),
      },
    },
  });
  const nodes = elements(
    exports.Header({
      labels: {},
      locale: 'ko',
      languageLabels: {},
      theme: 'dark',
      themeLabels: {},
    }),
  );
  const buttons = nodes.filter(
    (n) => n.type === 'button' && n.props.children === '로그아웃',
  );
  assert.equal(buttons.length, 2);
  assert.ok(
    !nodes.some((n) => n.type === 'default' && n.props.href === '/login'),
  );
  await buttons[0].props.onClick();
  assert.deepEqual(calls, ['/', 'refresh']);
});

test('management controls default to read-only and explicitly enable writes for admins', () => {
  const { exports } = component('../src/app/admin/PostEditor.tsx');
  for (const [readOnly, disabled] of [
    [undefined, true],
    [false, false],
  ]) {
    const nodes = elements(exports.PostEditor({ initialPost: post, readOnly }));
    for (const label of ['저장', '삭제'])
      assert.equal(
        nodes.find(
          (n) => n.type === 'CommonButton' && n.props.children === label,
        ).props.disabled,
        disabled,
      );
  }
});
test('restricted menus stay visible and disabled for visitors', () => {
  const { exports } = component('../src/app/admin/AdminNav.tsx');
  const nodes = elements(exports.AdminNav({ admin: false }));
  for (const label of ['문의사항 관리', '공통코드 관리']) {
    assert.equal(
      nodes.find((n) => n.type === 'button' && n.props.children === label).props
        .disabled,
      true,
    );
  }
  assert.ok(nodes.some((n) => n.props.href === '/admin/assets'));
  const adminNodes = elements(exports.AdminNav({ admin: true }));
  assert.ok(adminNodes.some((n) => n.props.href === '/admin/inquiries'));
  assert.ok(adminNodes.some((n) => n.props.href === '/admin/codes'));
});

function reactiveHooks() {
  const states = [],
    refs = [];
  let stateIndex = 0,
    refIndex = 0;
  return {
    reset() {
      stateIndex = 0;
      refIndex = 0;
    },
    react: {
      useState(initial) {
        const index = stateIndex++;
        if (!(index in states)) states[index] = initial;
        return [
          states[index],
          (next) => {
            states[index] = next;
          },
        ];
      },
      useRef(initial) {
        const index = refIndex++;
        if (!(index in refs)) refs[index] = { current: initial };
        return refs[index];
      },
      useEffect() {},
      useLayoutEffect() {},
    },
  };
}
test('sign-in keeps its label, shows the shared overlay and prevents duplicate requests', async () => {
  const hooks = reactiveHooks();
  let finish,
    requests = 0;
  const response = new Promise((resolve) => {
    finish = resolve;
  });
  const { exports } = component('../src/app/login/LoginActions.tsx', {
    react: hooks.react,
    '@/lib/auth-client': {
      authClient: {
        signIn: {
          social: () => {
            requests++;
            return response;
          },
        },
      },
    },
  });
  const props = {
    signedIn: false,
    copy: {
      signIn: 'GitHub로 로그인',
      signOut: '로그아웃',
      connectionFailed: '연결 실패',
    },
  };
  const render = () => {
    hooks.reset();
    return elements(exports.LoginActions(props));
  };
  const button = render().find((n) => n.type === 'CommonButton');
  const first = button.props.onClick();
  await button.props.onClick();
  assert.equal(requests, 1);
  let nodes = render();
  assert.equal(nodes.find((n) => n.type === 'CommonLoading').props.open, true);
  const pendingButton = nodes.find((n) => n.type === 'CommonButton');
  assert.equal(pendingButton.props.disabled, true);
  assert.ok(
    elements(pendingButton).some((n) => n.props.children === 'GitHub로 로그인'),
  );
  finish({ error: {} });
  await first;
  nodes = render();
  assert.equal(nodes.find((n) => n.type === 'CommonLoading').props.open, false);
  assert.equal(
    nodes.find((n) => n.type === 'CommonButton').props.disabled,
    false,
  );
});
test('header sign-out shows the shared overlay and deduplicates desktop and mobile clicks', async () => {
  const hooks = reactiveHooks();
  let finish,
    requests = 0;
  const response = new Promise((resolve) => {
    finish = resolve;
  });
  const { exports, calls } = component('../src/components/Header.tsx', {
    react: hooks.react,
    '@/lib/auth-client': {
      authClient: {
        useSession: () => ({
          data: { user: { id: 'owner' } },
          isPending: false,
        }),
        signOut: () => {
          requests++;
          return response;
        },
      },
    },
  });
  const props = {
    labels: {},
    locale: 'ko',
    languageLabels: {},
    theme: 'dark',
    themeLabels: {},
  };
  const render = () => {
    hooks.reset();
    return elements(exports.Header(props));
  };
  const buttons = render().filter(
    (n) => n.type === 'button' && n.props.children === '로그아웃',
  );
  const first = buttons[0].props.onClick();
  await buttons[1].props.onClick();
  assert.equal(requests, 1);
  assert.equal(
    render().find((n) => n.type === 'CommonLoading').props.open,
    true,
  );
  finish({});
  await first;
  assert.equal(
    render().find((n) => n.type === 'CommonLoading').props.open,
    false,
  );
  assert.deepEqual(calls, ['/', 'refresh']);
});
test('empty common grids center the message across every column', () => {
  const Table = Object.assign(() => null, {
    Caption: 'caption',
    Thead: 'thead',
    Tbody: 'tbody',
    Tr: 'tr',
    Th: 'th',
    Td: 'td',
  });
  const { exports } = component('../src/components/ui/CommonGrid.tsx', {
    '@mantine/core': { Table },
  });
  const nodes = elements(
    exports.CommonGrid({
      rows: [],
      columns: [
        { key: 'a', header: 'A' },
        { key: 'b', header: 'B' },
      ],
      getRowKey: (row) => row.id,
      caption: 'Grid',
      emptyMessage: '검색 결과가 없습니다.',
      minWidth: 500,
      wrapClassName: '',
      tableClassName: '',
    }),
  );
  const cell = nodes.find((n) => n.type === 'td');
  assert.equal(cell.props.colSpan, 2);
  assert.equal(cell.props.children, '검색 결과가 없습니다.');
  assert.equal(cell.props.style.textAlign, 'center');
  assert.equal(cell.props.style.verticalAlign, 'middle');
});

test('post editor category options follow the site locale rather than the authored language', async () => {
  const categories = await import('../src/lib/post-categories.ts');
  for (const [displayLocale, label] of [
    ['ko', '개발일지'],
    ['en', 'Development'],
  ]) {
    const { exports } = component('../src/app/admin/PostEditor.tsx', {
      '@/lib/post-categories': categories,
    });
    const nodes = elements(
      exports.PostEditor({
        initialPost: { ...post, category: 'DEV_LOG' },
        displayLocale,
      }),
    );
    const select = nodes.find(
      (n) =>
        n.type === 'CommonSelectBox' &&
        n.props['aria-label'] === '게시글 카테고리',
    );
    assert.equal(
      select.props.options.find((o) => o.value === 'DEV_LOG').label,
      label,
    );
  }
});
