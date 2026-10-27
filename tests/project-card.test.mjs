import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import ts from 'typescript';
import { projects } from '../src/content/projects.ts';
import { ko } from '../src/i18n/ko.ts';
import {
  formatProjectPeriod,
  publicProjectDetail,
} from '../src/lib/project-detail.ts';

const require = createRequire(import.meta.url);
const { outputText } = ts.transpileModule(
  readFileSync(
    new URL('../src/components/ProjectCard.tsx', import.meta.url),
    'utf8',
  ),
  {
    compilerOptions: {
      module: ts.ModuleKind.CommonJS,
      jsx: ts.JsxEmit.ReactJSX,
    },
  },
);
const exports = {};
new Function('require', 'exports', outputText)((id) => {
  if (id === './ProjectPreviewLink')
    return {
      ProjectPreviewLink: ({ href, className, children }) =>
        createElement('a', { href, className }, children),
    };
  if (id === './ProjectTag')
    return {
      ProjectTag: ({ label, className, role }) =>
        createElement('span', { className, role }, label),
    };
  if (id === '@/lib/project-detail')
    return { formatProjectPeriod, publicProjectDetail };
  if (id === 'next/link')
    return {
      default: ({ children, ...props }) => createElement('a', props, children),
    };
  if (id === 'next/image')
    return { default: ({ src, alt }) => createElement('img', { src, alt }) };
  if (id.endsWith('.css'))
    return { default: new Proxy({}, { get: (_, key) => key }) };
  return require(id);
}, exports);

test('project cards group title, period and technologies with an orbit placeholder', () => {
  const render = (project) =>
    renderToStaticMarkup(createElement(exports.ProjectCard, { project }));
  const project = {
    ...projects[0],
    id: '00000000-0000-0000-0000-000000000001',
    ...ko.projectItems[projects[0].slug],
    originLabel: '개인',
    typeLabel: '웹',
    contentLocale: 'ko',
    tags: [],
    attachments: [],
  };
  const fallback = render(project);
  assert.match(fallback, /class="details"/);
  assert.match(fallback, /<svg/);
  assert.match(fallback, /<h3>ddoza<\/h3>/);
  assert.match(fallback, /href="\/work\/00000000-0000-0000-0000-000000000001"/);
  const image = render({ ...project, thumbnail: '/images/project.webp' });
  assert.match(image, /src="\/images\/project.webp"/);
  assert.doesNotMatch(image, /<svg/);
  assert.match(image, /<h3>ddoza<\/h3>/);
});

test('shared public detail keeps client, content language, attachments and separates technology/topic tags', () => {
  const project = {
    title: '제목',
    summary: '요약',
    body: { type: 'doc', content: [] },
    thumbnail: '/image.webp',
    customerName: '고객사',
    originLabel: '회사',
    typeLabel: '웹',
    lifecycle: 'BUILDING',
    contentLocale: 'ko',
    placeholder: false,
    attachments: [{ id: 'file' }],
    tags: [
      { kind: 'TECHNOLOGY', name: 'TypeScript' },
      { kind: 'TOPIC', name: '포트폴리오' },
    ],
  };
  const detail = publicProjectDetail(project);
  assert.equal(detail.customerName, '고객사');
  assert.equal('statusLabel' in detail, false);
  assert.deepEqual(detail.technologies, ['TypeScript']);
  assert.deepEqual(detail.tags, ['포트폴리오']);
  assert.equal(detail.body, project.body);
  assert.equal(detail.attachments, project.attachments);
  assert.equal(detail.contentLocale, 'ko');
});
