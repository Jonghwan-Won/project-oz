import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import ts from 'typescript';
import { projects } from '../src/content/projects.ts';
import { ko } from '../src/i18n/ko.ts';
import { publicProjectDetail } from '../src/lib/project-detail.ts';

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
  if (id === '@/lib/project-detail') return { publicProjectDetail };
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

test('project cards group details and use orbit/title only without a thumbnail', () => {
  const render = (project) =>
    renderToStaticMarkup(
      createElement(exports.ProjectCard, { project, labels: ko }),
    );
  const project = {
    ...projects[0],
    ...ko.projectItems[projects[0].slug],
    originLabel: '개인',
    typeLabel: '웹사이트',
    contentLocale: 'ko',
    tags: [],
    attachments: [],
  };
  const fallback = render(project);
  assert.match(fallback, /class="details"/);
  assert.match(fallback, /class="coverTitle">ddoza/);
  assert.match(fallback, /<svg/);
  const image = render({ ...project, thumbnail: '/images/project.webp' });
  assert.match(image, /src="\/images\/project.webp"/);
  assert.doesNotMatch(image, /class="coverTitle"|<svg/);
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
    typeLabel: '웹사이트',
    lifecycle: 'BUILDING',
    contentLocale: 'ko',
    placeholder: false,
    attachments: [{ id: 'file' }],
    tags: [
      { kind: 'TECHNOLOGY', name: 'TypeScript' },
      { kind: 'TOPIC', name: '포트폴리오' },
    ],
  };
  const detail = publicProjectDetail(project, ko);
  assert.equal(detail.customerName, '고객사');
  assert.equal(detail.statusLabel, ko.projectStatuses.BUILDING);
  assert.deepEqual(detail.technologies, ['TypeScript']);
  assert.deepEqual(detail.tags, ['포트폴리오']);
  assert.equal(detail.body, project.body);
  assert.equal(detail.attachments, project.attachments);
  assert.equal(detail.contentLocale, 'ko');
});
