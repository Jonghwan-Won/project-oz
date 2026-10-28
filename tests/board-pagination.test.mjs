import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { renderToStaticMarkup } from 'react-dom/server';
import ts from 'typescript';
import { paginate } from '../src/lib/admin-list.ts';

const require = createRequire(import.meta.url);
const code = ts.transpileModule(
  readFileSync('src/app/board/page.tsx', 'utf8'),
  {
    compilerOptions: {
      module: ts.ModuleKind.CommonJS,
      target: ts.ScriptTarget.ES2022,
      jsx: ts.JsxEmit.ReactJSX,
      esModuleInterop: true,
    },
  },
).outputText;
const copy = {
  title: 'Board',
  intro: '',
  filterLabel: 'Categories',
  searchLabel: 'Search',
  placeholder: 'Search',
  search: 'Search',
  count: 'Posts',
  paginationLabel: 'Pages',
  pageLabel: 'Page',
  previousPage: 'Previous',
  nextPage: 'Next',
  empty: 'Empty',
  emptyQuery: '',
  emptyCategory: '',
};
const posts = Array.from({ length: 22 }, (_, index) => ({
  id: String(index + 1),
  title: `Post ${String(index + 1).padStart(2, '0')}`,
  summary: '',
  category: '개발',
  date: '2026.10.28',
}));
const modules = {
  '@/components/ui/CommonInput': {
    CommonInput: (props) => require('react').createElement('input', props),
  },
  '@/components/ui/CommonButton': {
    CommonButton: ({ children, ...props }) => {
      delete props.variant;
      return require('react').createElement('button', props, children);
    },
  },
  'next/link': {
    __esModule: true,
    default: ({ children, ...props }) =>
      require('react').createElement('a', props, children),
  },
  '@/content/site': {
    categories: ['전체', '개발'],
    getCategoryLabel: (category) => category,
  },
  '@/server/services/posts': { getPublicPosts: async () => posts },
  '@/i18n/server': {
    getMessages: async () => ({
      messages: { board: copy, navigation: {} },
      locale: 'ko',
    }),
  },
  '@/components/MainPageLink': {},
  '@/lib/admin-list': { paginate },
  './board.module.css': { __esModule: true, default: {} },
};
const exports = {};
new Function('require', 'exports', code)(
  (id) => modules[id] ?? require(id),
  exports,
);
const board = async (params) =>
  renderToStaticMarkup(
    await exports.default({ searchParams: Promise.resolve(params) }),
  );

test('board paginates filtered results and keeps filters in page links', async () => {
  const html = await board({ category: '개발', q: 'Post', page: '2' });
  assert.doesNotMatch(html, /Post 10<\/h3>/);
  assert.match(html, /Post 11<\/h3>/);
  assert.match(html, /Post 20<\/h3>/);
  assert.doesNotMatch(html, /Post 21<\/h3>/);
  assert.match(html, /category=%EA%B0%9C%EB%B0%9C&amp;q=Post&amp;page=3/);
  assert.match(html, /autoComplete="off"/i);
  assert.ok(html.indexOf('aria-label="Pages"') < html.indexOf('role="search"'));
  const last = await board({ page: '999' });
  assert.match(last, /Post 22<\/h3>/);
  assert.doesNotMatch(last, /Post 20<\/h3>/);
  const filtered = await board({ q: 'Post 01', page: '2' });
  assert.match(filtered, /Post 01<\/h3>/);
  assert.match(filtered, /aria-label="Pages"/);
});
