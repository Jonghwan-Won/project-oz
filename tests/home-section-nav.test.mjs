import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import ts from 'typescript';

test('section position follows scrolling, restores the first section and cleans listeners', () => {
  const require = createRequire(import.meta.url);
  const listeners = new Map();
  let effect;
  let active;
  const tops = { about: 76, projects: 900, board: 1500, help: 2100 };
  const exports = {};
  const { outputText } = ts.transpileModule(readFileSync(new URL('../src/components/HomeSectionNav.tsx', import.meta.url), 'utf8'), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.ReactJSX },
  });
  new Function('require', 'exports', 'window', 'document', 'requestAnimationFrame', 'cancelAnimationFrame', outputText)(
    (id) => {
      if (id === 'react') return { useState: () => ['about', (value) => { active = value; }], useEffect: (callback) => { effect = callback; } };
      if (id.endsWith('.css')) return { default: {} };
      return require(id);
    }, exports,
    { addEventListener: (name, callback) => listeners.set(name, callback), removeEventListener: (name) => listeners.delete(name) },
    { getElementById: (id) => ({ getBoundingClientRect: () => ({ top: tops[id] }) }) },
    (callback) => { callback(); return 1; }, () => {},
  );
  const nav = exports.HomeSectionNav({ labels: {} });
  assert.equal(nav.props.style['--active-index'], 0);
  assert.equal(nav.props.children[0].props['aria-hidden'], 'true');
  const cleanup = effect();
  assert.equal(active, 'about');
  tops.projects = -100;
  tops.board = 160;
  listeners.get('scroll')();
  assert.equal(active, 'board');
  tops.help = 80;
  listeners.get('resize')();
  assert.equal(active, 'help');
  Object.assign(tops, { projects: 900, board: 1500, help: 2100 });
  listeners.get('scroll')();
  assert.equal(active, 'about');
  cleanup();
  assert.equal(listeners.size, 0);
});
