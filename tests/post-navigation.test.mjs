import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { renderToStaticMarkup } from 'react-dom/server';
import ts from 'typescript';
import { paginate } from '../src/lib/admin-list.ts';

const require = createRequire(import.meta.url);
const React = require('react');
const code = ts.transpileModule(
  readFileSync('src/app/board/[id]/page.tsx', 'utf8'),
  {
    compilerOptions: {
      module: ts.ModuleKind.CommonJS,
      target: ts.ScriptTarget.ES2022,
      jsx: ts.JsxEmit.ReactJSX,
      esModuleInterop: true,
    },
  },
).outputText;
const posts = Array.from({ length: 7 }, (_, index) => ({
  id: `post-${index + 1}`,
  title: `Post ${index + 1}`,
  category: '개발',
  date: '2026.10.28',
}));
posts.push({
  id: 'other',
  title: 'Other category',
  category: '기타',
  date: '2026.10.28',
});
const messages = {
  board: {
    back: 'Back',
    postNavigation: 'Post navigation',
    previousPost: 'Previous',
    nextPost: 'Next',
    noAdjacentPost: 'No post',
    count: 'Posts',
    allLink: 'All posts',
    postTitle: 'Title',
    postDate: 'Date',
    paginationLabel: 'Pages',
    previousPage: 'Previous page',
    nextPage: 'Next page',
    pageLabel: 'Page',
    previousGroup: '‹ Previous',
    nextGroup: 'Next ›',
  },
};
const modules = {
  '@/lib/post-categories': { normalizePostCategory: (c) => c },
  '@/server/services/post-categories': {
    getPostCategories: async () => [
      { code: '개발', nameKo: '개발', nameEn: 'Development', isActive: true },
    ],
  },
  'next/navigation': {
    notFound: () => {
      throw Error('not found');
    },
  },
  'next/link': {
    __esModule: true,
    default: ({ children, scroll, ...props }) =>
      React.createElement(
        'a',
        { ...props, ...(scroll === false ? { 'data-scroll': 'false' } : {}) },
        children,
      ),
  },
  '@/server/services/posts': {
    getPublicPost: async (id) => {
      const post = posts.find(
        (item) => item.id === (id === 'old-slug' ? 'post-6' : id),
      );
      return (
        post && {
          ...post,
          category: '개발',
          date: '2026.10.28',
          contentLocale: 'ko',
          body: {},
        }
      );
    },
    getPublicPosts: async () => posts,
  },
  '@/components/ui/CommonRichTextView': { CommonRichTextView: () => null },
  '@/lib/admin-list': { paginate },
  '@/content/site': { getCategoryLabel: (category) => category },
  '@/i18n/server': { getMessages: async () => ({ messages, locale: 'ko' }) },
  './post.module.css': { __esModule: true, default: {} },
};
const exports = {};
new Function('require', 'exports', code)(
  (id) => modules[id] ?? require(id),
  exports,
);
const render = async (id, page) =>
  renderToStaticMarkup(
    await exports.default({
      params: Promise.resolve({ id }),
      searchParams: Promise.resolve({ page }),
    }),
  );

test('detail list shows all categories and starts on the current post page', async () => {
  const html = await render('old-slug');
  assert.match(html, /href="\/board">All posts/);
  assert.match(html, /href="\/board\/post-6" aria-current="page"/);
  assert.match(html, /href="\/board\/post-7"/);
  assert.doesNotMatch(html, /href="\/board\/post-1"/);
  assert.match(html, /Other category/);
  assert.match(html, /href="\?page=1"[^>]*data-scroll="false"/);
  const first = await render('old-slug', '1');
  assert.match(first, /href="\/board\/post-1"/);
  assert.match(first, /href="\/board\/post-5"/);
  assert.doesNotMatch(first, /href="\/board\/post-6"/);
  assert.match(first, /href="\?page=2"[^>]*data-scroll="false"/);
});

test('pagination moves between groups of five without changing scroll behavior', async () => {
  for (let index = 8; index <= 65; index++)
    posts.push({
      id: `post-${index}`,
      title: `Post ${index}`,
      category: '개발',
      date: '2026.10.28',
    });
  for (const page of ['2', '5']) {
    const html = await render('post-1', page);
    assert.match(
      html,
      /href="\?page=6" aria-label="Next page" data-scroll="false"/,
    );
    assert.doesNotMatch(html, /aria-label="Previous page"/);
    assert.match(html, /aria-label="Page 5"/);
    assert.doesNotMatch(html, /aria-label="Page 6"/);
  }
  for (const page of ['6', '7']) {
    const html = await render('post-1', page);
    assert.match(
      html,
      /href="\?page=5" aria-label="Previous page" data-scroll="false"/,
    );
    assert.match(
      html,
      /href="\?page=11" aria-label="Next page" data-scroll="false"/,
    );
    assert.match(html, /aria-label="Page 6"/);
    assert.match(html, /aria-label="Page 10"/);
  }
  const last = await render('post-1', '14');
  assert.match(
    last,
    /href="\?page=10" aria-label="Previous page" data-scroll="false"/,
  );
  assert.doesNotMatch(last, /aria-label="Next page"/);
});
