/**
 * Pointer-stirred liquid for the hero background: a square grid holding a flow
 * velocity and a liquid amount per cell. Moving the pointer injects both; the
 * liquid is carried along its own flow and fades over ~1s time constant.
 *
 * Ported from the ChromaFlow effect of the `shaders` package
 * (MIT License, Copyright (c) 2026 Shader Effects Inc.,
 * https://github.com/shader-effects-inc/shaders). Constants match its defaults:
 * radius 3, momentum 30, intensity 1.
 */
export const FLOW_GRID = 128;
/** Liquid is stored ×4 so the faint tail of a fade keeps 8-bit precision. */
export const LIQUID_SCALE = 4;
const RADIUS = 3 * 0.05;
const MOMENTUM = 30;
const INTENSITY = 1;

export type FlowPoint = { x: number; y: number };

export type FlowField = {
  /** RGBA bytes: flow x/y as 127 ± 127, liquid × LIQUID_SCALE, opaque. */
  readonly bytes: Uint8Array;
  /** True once nothing is left to simulate or draw. */
  readonly settled: boolean;
  reset(): void;
  /**
   * Advances by `dt` seconds with the pointer in 0..1 coordinates (y up), or
   * null when there is none. Returns whether `bytes` changed.
   */
  step(dt: number, pointer: FlowPoint | null, aspect: number): boolean;
};

const clamp = (value: number, min: number, max: number) =>
  Math.max(min, Math.min(max, value));

export function createFlowField(size = FLOW_GRID): FlowField {
  const cells = size * size;
  let field = new Float32Array(cells * 3);
  let next = new Float32Array(cells * 3);
  const bytes = new Uint8Array(cells * 4);
  let velX = 0;
  let velY = 0;
  let previous: FlowPoint | null = null;
  let peak = 0;

  const encode = () => {
    for (let k = 0; k < cells; k++) {
      bytes[k * 4] = Math.round(127 + field[k * 3] * 127);
      bytes[k * 4 + 1] = Math.round(127 + field[k * 3 + 1] * 127);
      bytes[k * 4 + 2] = Math.round(
        Math.min(field[k * 3 + 2] * LIQUID_SCALE, 1) * 255,
      );
      bytes[k * 4 + 3] = 255;
    }
  };

  // Each cell keeps its own flow but fetches liquid from upstream along it.
  const advect = (dt: number) => {
    const fade = 1 - dt;
    const flowSpeed = MOMENTUM * 50 * dt;
    let newPeak = 0;
    for (let i = 0; i < size; i++)
      for (let j = 0; j < size; j++) {
        const idx = (i * size + j) * 3;
        const fx = field[idx];
        const fy = field[idx + 1];
        let liquid = field[idx + 2];
        if (Math.abs(fx) > 0.001 || Math.abs(fy) > 0.001) {
          const ax = j - fx * flowSpeed;
          const ay = i - fy * flowSpeed;
          const x0 = Math.floor(ax);
          const y0 = Math.floor(ay);
          if (x0 >= 0 && y0 >= 0 && x0 + 1 < size && y0 + 1 < size) {
            const tx = ax - x0;
            const ty = ay - y0;
            const at = (y: number, x: number) => field[(y * size + x) * 3 + 2];
            liquid =
              at(y0, x0) * (1 - tx) * (1 - ty) +
              at(y0, x0 + 1) * tx * (1 - ty) +
              at(y0 + 1, x0) * (1 - tx) * ty +
              at(y0 + 1, x0 + 1) * tx * ty;
          }
        }
        next[idx] = fx * fade;
        next[idx + 1] = fy * fade;
        next[idx + 2] = liquid * fade;
        newPeak = Math.max(
          newPeak,
          Math.abs(next[idx]),
          Math.abs(next[idx + 1]),
          next[idx + 2],
        );
      }
    return newPeak;
  };

  // Faster strokes paint a wider brush; slow drifting barely leaves a mark.
  const inject = (dt: number, pointer: FlowPoint, aspect: number) => {
    const speed = Math.hypot(velX, velY);
    const radius = RADIUS * Math.min(speed * speed * 20, 1);
    if (radius < 1e-4) return;
    const reach = radius * 2;
    const radSq = radius * radius;
    const add = INTENSITY * dt;
    const liquidGain = Math.min(speed * 10, 1);
    const sx = aspect >= 1 ? aspect : 1;
    const sy = aspect >= 1 ? 1 : 1 / aspect;
    const j0 = Math.max(0, Math.floor((pointer.x - reach / sx) * size));
    const j1 = Math.min(size - 1, Math.ceil((pointer.x + reach / sx) * size));
    const i0 = Math.max(0, Math.floor((pointer.y - reach / sy) * size));
    const i1 = Math.min(size - 1, Math.ceil((pointer.y + reach / sy) * size));
    for (let i = i0; i <= i1; i++)
      for (let j = j0; j <= j1; j++) {
        const dx = ((j + 0.5) / size - pointer.x) * sx;
        const dy = ((i + 0.5) / size - pointer.y) * sy;
        const distSq = dx * dx + dy * dy;
        if (distSq >= reach * reach) continue;
        const idx = (i * size + j) * 3;
        const influence = Math.exp(-distSq / radSq);
        next[idx] = clamp(next[idx] + velX * influence * add, -1, 1);
        next[idx + 1] = clamp(next[idx + 1] + velY * influence * add, -1, 1);
        next[idx + 2] = clamp(
          next[idx + 2] + influence * add * liquidGain,
          0,
          1,
        );
      }
  };

  encode();
  return {
    bytes,
    get settled() {
      return peak < 1e-4;
    },
    reset() {
      field.fill(0);
      velX = 0;
      velY = 0;
      previous = null;
      peak = 0;
      encode();
    },
    step(dt, pointer, aspect) {
      let vx = 0;
      let vy = 0;
      if (pointer && previous && dt > 0) {
        vx = (pointer.x - previous.x) / dt;
        vy = (pointer.y - previous.y) / dt;
      }
      velX = velX * 0.85 + vx * 0.15;
      velY = velY * 0.85 + vy * 0.15;
      previous = pointer && { x: pointer.x, y: pointer.y };
      const injecting = Math.abs(vx) + Math.abs(vy) > 0.01;
      if (!injecting && peak < 1e-4) return false;
      const newPeak = advect(dt);
      if (injecting && pointer) inject(dt, pointer, aspect);
      [field, next] = [next, field];
      peak = injecting ? 1 : newPeak;
      encode();
      return true;
    },
  };
}
