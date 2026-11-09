import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';
import ts from 'typescript';

const load = (file, context = {}, modules = {}) => {
  const exports = {};
  const { outputText } = ts.transpileModule(
    readFileSync(new URL(`../src/app/${file}`, import.meta.url), 'utf8'),
    {
      compilerOptions: {
        module: ts.ModuleKind.CommonJS,
        target: ts.ScriptTarget.ES2022,
        jsx: ts.JsxEmit.ReactJSX,
      },
    },
  );
  vm.runInNewContext(outputText, {
    exports,
    require: (name) => modules[name] ?? { default: {} },
    ...context,
  });
  return exports;
};

// Node 24 strips the types itself; vm contexts would run the simulation ~30× slower.
const flowModule = await import('../src/app/heroFlowField.ts');
const { createFlowField, FLOW_GRID } = flowModule;
const cell = (field, x, y) => {
  const k =
    (Math.floor(y * FLOW_GRID) * FLOW_GRID + Math.floor(x * FLOW_GRID)) * 4;
  return [...field.bytes.slice(k, k + 4)];
};
const liquidCentroidX = (field) => {
  let sum = 0;
  let weight = 0;
  for (let k = 0; k < FLOW_GRID * FLOW_GRID; k++) {
    const liquid = field.bytes[k * 4 + 2];
    sum += (k % FLOW_GRID) * liquid;
    weight += liquid;
  }
  return weight ? sum / weight / FLOW_GRID : NaN;
};

test('the flow field stays empty until the pointer moves', () => {
  const field = createFlowField();
  assert.deepEqual(cell(field, 0.5, 0.5), [127, 127, 0, 255]);
  assert.equal(field.step(1 / 60, null, 1.6), false);
  assert.equal(field.step(1 / 60, { x: 0.5, y: 0.5 }, 1.6), false);
  assert.equal(field.step(1 / 60, { x: 0.5, y: 0.5 }, 1.6), false);
  assert.ok(field.settled);
});

test('moving the pointer pours liquid that drifts along and fades out', () => {
  const field = createFlowField();
  let x = 0.3;
  field.step(1 / 60, { x, y: 0.5 }, 1.6);
  for (let i = 0; i < 20; i++) {
    x += 0.01;
    assert.equal(field.step(1 / 60, { x, y: 0.5 }, 1.6), true);
  }
  const [flowX, flowY, liquid] = cell(field, x, 0.5);
  assert.ok(liquid > 0, 'liquid is poured under the pointer');
  assert.ok(flowX > 127, 'the flow points the way the pointer moved');
  assert.ok(
    Math.abs(flowY - 127) <= 1,
    'horizontal motion adds no vertical flow',
  );
  assert.equal(cell(field, 0.5, 0.9)[2], 0, 'far cells stay dry');

  const before = liquidCentroidX(field);
  for (let i = 0; i < 20; i++) field.step(1 / 60, { x, y: 0.5 }, 1.6);
  assert.ok(liquidCentroidX(field) > before, 'liquid keeps drifting forward');

  let frames = 0;
  while (field.step(1 / 60, { x, y: 0.5 }, 1.6)) frames++;
  assert.ok(field.settled);
  assert.ok(
    frames > 120 && frames < 900,
    `fades in seconds (${frames} frames)`,
  );
  assert.ok(
    field.bytes.every((value, k) => k % 4 !== 2 || value === 0),
    'no liquid is left behind',
  );

  field.step(1 / 60, null, 1.6);
  field.step(1 / 60, { x: 0.9, y: 0.1 }, 1.6);
  assert.ok(field.settled, 'returning from outside does not splash');
});

test('background swirls when idle, respects reduced motion and releases its graphics resources', () => {
  let effect, pointer, tick, motionChange;
  let now = 1000;
  let draws = 0;
  let uploads = 0;
  let scheduled = 0;
  let deleted = 0;
  const uniforms = new Map();
  const motion = {
    matches: true,
    addEventListener: (_, handler) => {
      motionChange = handler;
    },
    removeEventListener() {},
  };
  const gl = new Proxy(
    {},
    {
      get: (_, name) => {
        if (name === 'getShaderParameter' || name === 'getProgramParameter')
          return () => true;
        if (name === 'getUniformLocation') return (_, name) => name;
        if (name === 'drawArrays') return () => draws++;
        if (name === 'texSubImage2D') return () => uploads++;
        if (name === 'uniform1f')
          return (name, value) => uniforms.set(name, value);
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
        if (name === 'pointermove') pointer = handler;
      },
      removeEventListener: (name) => {
        if (name === 'pointermove') pointer = undefined;
      },
    },
    getContext: () => gl,
    getBoundingClientRect: () => ({
      left: 0,
      bottom: 800,
      width: 1280,
      height: 800,
    }),
  };
  const { HeroBackground } = load(
    'HeroBackground.tsx',
    {
      matchMedia: () => motion,
      performance: { now: () => now },
      devicePixelRatio: 2,
      document: {
        hidden: false,
        addEventListener() {},
        removeEventListener() {},
      },
      requestAnimationFrame: (callback) => {
        tick = callback;
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
    },
    {
      react: {
        useEffect: (callback) => {
          effect = callback;
        },
        useRef: () => ({ current: canvas }),
      },
      'react/jsx-runtime': { jsx: () => null },
      './heroFlowField': flowModule,
    },
  );
  HeroBackground();
  const cleanup = effect();
  assert.equal(canvas.width, 768, 'the canvas renders at 60% of CSS pixels');
  assert.equal(scheduled, 0, 'reduced motion draws one still frame');
  assert.equal(draws, 1);
  assert.equal(uniforms.get('time'), 0);
  pointer({ pointerType: 'mouse', clientX: 100, clientY: 100 });
  assert.equal(scheduled, 0);

  motion.matches = false;
  motionChange();
  assert.equal(scheduled, 1, 'the swirl animates once motion is allowed');
  const frame = (ms = 16) => {
    now += ms;
    tick(now);
  };
  const resetUploads = uploads;
  pointer({ pointerType: 'touch', clientX: 100, clientY: 100 });
  frame();
  frame();
  assert.equal(uploads, resetUploads, 'touch does not stir the liquid');

  pointer({ pointerType: 'mouse', clientX: 400, clientY: 400 });
  frame();
  let drawsBefore = draws;
  for (let i = 1; i <= 10; i++) {
    pointer({ pointerType: 'mouse', clientX: 400 + i * 20, clientY: 400 });
    frame();
  }
  assert.equal(draws, drawsBefore + 10, 'moving liquid redraws every frame');
  assert.ok(uploads >= resetUploads + 10);
  assert.ok(uniforms.get('time') > 0, 'the swirl advances with time');

  for (let i = 0; i < 600; i++) frame();
  const settledUploads = uploads;
  drawsBefore = draws;
  frame();
  frame();
  assert.equal(uploads, settledUploads, 'a settled field is not re-uploaded');
  assert.equal(
    draws,
    drawsBefore + 1,
    'the swirl alone draws every other frame',
  );

  motion.matches = true;
  const stopped = scheduled;
  frame();
  assert.equal(scheduled, stopped, 'reduced motion stops the loop');
  cleanup();
  assert.equal(pointer, undefined);
  assert.equal(deleted, 5, 'shaders, texture, buffer and program are released');
});
