import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';
import ts from 'typescript';

test('background respects reduced motion and releases its graphics resources', () => {
  let effect, pointer, draw;
  let now = 1000;
  const uniforms = new Map();
  let scheduled = 0;
  let deleted = 0;
  const motion = {
    matches: true,
    addEventListener() {},
    removeEventListener() {},
  };
  const gl = new Proxy(
    {},
    {
      get: (_, name) => {
        if (name === 'getShaderParameter' || name === 'getProgramParameter')
          return () => true;
        if (name === 'getUniformLocation') return (_, name) => name;
        if (name === 'uniform4fv')
          return (name, value) => uniforms.set(name, [...value]);
        if (String(name).startsWith('create')) return () => ({});
        if (String(name).startsWith('delete')) return () => deleted++;
        return () => {};
      },
    },
  );
  const canvas = {
    parentElement: {
      clientWidth: 1280,
      clientHeight: 800,
      addEventListener: (name, handler) => {
        if (name !== 'pointermove') return;
        pointer = handler;
      },
      removeEventListener: () => {
        pointer = undefined;
      },
    },
    getContext: () => gl,
    getBoundingClientRect: () => ({ left: 0, bottom: 800, height: 800 }),
  };
  const exports = {};
  const { outputText } = ts.transpileModule(
    readFileSync(
      new URL('../src/app/HeroBackground.tsx', import.meta.url),
      'utf8',
    ),
    {
      compilerOptions: {
        module: ts.ModuleKind.CommonJS,
        jsx: ts.JsxEmit.ReactJSX,
      },
    },
  );
  vm.runInNewContext(outputText, {
    exports,
    require: (name) =>
      name === 'react'
        ? {
            useEffect: (callback) => {
              effect = callback;
            },
            useRef: () => ({ current: canvas }),
          }
        : name === 'react/jsx-runtime'
          ? { jsx: () => null }
          : { default: {} },
    matchMedia: () => motion,
    performance: { now: () => now },
    devicePixelRatio: 2,
    document: {
      hidden: false,
      addEventListener() {},
      removeEventListener() {},
    },
    requestAnimationFrame: (callback) => {
      draw = callback;
      return ++scheduled;
    },
    cancelAnimationFrame() {},
    ResizeObserver: class {
      constructor(callback) {
        this.callback = callback;
      }
      observe() {
        this.callback();
      }
      disconnect() {}
    },
    IntersectionObserver: class {
      observe() {}
      disconnect() {}
    },
  });
  exports.HeroBackground();
  const cleanup = effect();
  assert.equal(canvas.width, 1280);
  pointer({ pointerType: 'mouse', clientX: 100, clientY: 100 });
  assert.equal(scheduled, 0);
  motion.matches = false;
  pointer({ pointerType: 'touch' });
  assert.equal(scheduled, 0);
  for (let i = 0; i < 100; i++)
    pointer({ pointerType: 'mouse', clientX: 100, clientY: 100 });
  assert.equal(scheduled, 1);
  now += 30;
  pointer({ pointerType: 'mouse', clientX: 200, clientY: 799 });
  draw(now);
  const strokes = uniforms.get('strokes[0]');
  assert.deepEqual(
    strokes.slice(4, 8),
    [0.125, 0.875, 0.25, Math.fround(1 / 800)],
    'the stroke connects to the preceding pointer and reaches the bottom',
  );
  now += 500;
  const whileMoving = scheduled;
  draw(now);
  assert.equal(
    scheduled,
    whileMoving + 1,
    'the trail keeps animating after the pointer stops',
  );
  assert.equal(uniforms.get('ages[0]')[1], 0.5);
  assert.deepEqual(
    uniforms.get('strokes[0]'),
    strokes,
    'the last movement direction is retained',
  );
  now += 2100;
  const before = scheduled;
  draw(now);
  assert.equal(scheduled, before, 'rendering stops after the trail fades');
  cleanup();
  assert.equal(pointer, undefined);
  assert.equal(deleted, 4);
});
