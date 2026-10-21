import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import ts from 'typescript';
import { projects } from '../src/content/projects.ts';
import { ko } from '../src/i18n/ko.ts';

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
  const fallback = render(projects[0]);
  assert.match(fallback, /class="details"/);
  assert.match(fallback, /class="coverTitle">ddoza/);
  assert.match(fallback, /<svg/);
  const image = render({ ...projects[0], thumbnail: '/images/project.webp' });
  assert.match(image, /src="\/images\/project.webp"/);
  assert.doesNotMatch(image, /class="coverTitle"|<svg/);
  assert.match(image, /<h3>ddoza<\/h3>/);
});
