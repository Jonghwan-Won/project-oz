import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import ts from 'typescript';

test('home links reset the current home page without intercepting modified, external or section links', () => {
  let click;
  let effect;
  const scrolls = [];
  const window = { location: { href: 'https://oz.test/#help', origin: 'https://oz.test', pathname: '/', hash: '#help' }, scrollTo: (options) => scrolls.push(options) };
  class Element {
    constructor(href) { this.href = href; }
    closest() { return this; }
    hasAttribute() { return false; }
  }
  const exports = {};
  const { outputText } = ts.transpileModule(readFileSync(new URL('../src/components/NavigationScroll.tsx', import.meta.url), 'utf8'), {
    compilerOptions: { module: ts.ModuleKind.CommonJS },
  });
  new Function('require', 'exports', 'window', 'document', 'Element', outputText)(
    (id) => {
      if (id === 'react') return { useEffect: (callback) => { effect = callback; }, useLayoutEffect() {}, useRef: (current) => ({ current }) };
      if (id === 'next/navigation') return { usePathname: () => '/' };
      throw Error(id);
    }, exports, window,
    { addEventListener: (_, callback) => { click = callback; }, removeEventListener: () => { click = null; } }, Element,
  );
  exports.NavigationScroll();
  const cleanup = effect();
  const event = (href, extra = {}) => ({ button: 0, target: new Element(href), ...extra });
  click(event('https://oz.test/'));
  assert.deepEqual(scrolls, [{ top: 0, left: 0, behavior: 'instant' }]);
  for (const e of [event('https://oz.test/#projects'), event('https://other.test/'), event('https://oz.test/', { ctrlKey: true }), event('https://oz.test/', { button: 1 })]) click(e);
  assert.equal(scrolls.length, 1);
  window.location.pathname = '/board';
  click(event('https://oz.test/'));
  assert.equal(scrolls.length, 1);
  cleanup();
  assert.equal(click, null);
});
