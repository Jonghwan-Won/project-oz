'use client';

import { useEffect, useRef } from 'react';
import {
  createFlowField,
  FLOW_GRID,
  LIQUID_SCALE,
  type FlowPoint,
} from './heroFlowField';
import s from './home.module.css';

/** Frame budget for the swirl alone; just under 33ms so 60Hz frames alternate. */
const IDLE_FRAME_MS = 30;
/** Fraction of CSS pixels the canvas renders at. */
const RENDER_SCALE = 0.6;
/** Longest simulated step, so a dropped frame does not stall the liquid. */
const MAX_STEP_S = 1 / 30;
/** The swirl's clock wraps hourly to keep shader float precision. */
const TIME_WRAP_S = 3600;

const VERTEX = `
  attribute vec2 position;
  void main() { gl_Position = vec4(position, 0.0, 1.0); }
`;

// Color layers follow the Swirl and ChromaFlow effects of the `shaders`
// package (MIT License, Copyright (c) 2026 Shader Effects Inc.); the glass
// grooves are this site's own.
const FRAGMENT = `
  #ifdef GL_FRAGMENT_PRECISION_HIGH
  precision highp float;
  #else
  precision mediump float;
  #endif
  uniform vec2 size;
  uniform float time;
  uniform sampler2D flowField;

  // Like tiptap's "subtle" intensity: the color layers sit at 55% over white.
  const float OPACITY = 0.55;
  const vec3 SWIRL_A = vec3(0.933, 0.941, 0.965);
  const vec3 SWIRL_B = vec3(0.780, 0.722, 0.961);
  const float SWIRL_SPEED = 0.5;
  const vec3 FLOW_BASE = vec3(0.643, 0.424, 0.941);
  const vec3 FLOW_UP = vec3(0.894, 0.549, 0.894);
  const vec3 FLOW_DOWN = vec3(0.337, 0.369, 0.949);
  const vec3 FLOW_LEFT = vec3(0.894, 0.549, 0.894);
  const vec3 FLOW_RIGHT = vec3(0.337, 0.369, 0.949);

  // Three layers of sine waves, each warping the next, drifting with time.
  float swirlPattern(vec2 uv, float t) {
    vec2 d1 = vec2(
      uv.x + sin(uv.y * 1.7 + t * 0.8) * 0.12 + cos(uv.x * 0.9 - t * 0.5) * 0.05,
      uv.y + cos(uv.x * 1.3 - t * 0.6) * 0.12 + sin(uv.y * 1.1 + t * 0.7) * 0.05
    );
    float p1 = sin(d1.x * 2.1 + d1.y * 1.8 + t * 0.4);
    vec2 d2 = vec2(
      d1.x + cos(d1.y * 5.67 - t * 0.45) * 0.07 + sin(d1.x * 3.99 + t * 0.6) * 0.04,
      d1.y + sin(d1.x * 4.83 + t * 0.65) * 0.07 + cos(d1.y * 3.36 - t * 0.4) * 0.04
    );
    float p2 = cos(d2.x * 2.94 - d2.y * 3.99 + t * 0.35);
    vec2 d3 = vec2(
      d2.x + sin(d2.y * 6.66 + t * 0.85) * 0.04 + cos(d2.x * 4.81 - t * 0.55) * 0.025
        + sin((d2.x + d2.y) * 2.59 + t * 0.9) * 0.02,
      d2.y + cos(d2.x * 5.92 - t * 0.75) * 0.04 + sin(d2.y * 4.07 + t * 0.5) * 0.025
        + cos((d2.x + d2.y) * 2.96 - t * 0.95) * 0.02
    );
    float p3 = sin(d3.x * 4.07 + d3.y * 5.55 - t * 0.55);
    return p1 * 0.45 + p2 * 0.35 + p3 * 0.2;
  }

  vec3 swirlColor(vec2 uv, float t) {
    float pattern = swirlPattern(uv, t);
    vec3 color = mix(SWIRL_A, SWIRL_B, smoothstep(0.3, 0.7, pattern * 0.5 + 0.5));
    return color * (1.0 + sin(t * 2.5 + pattern * 8.0) * 0.015);
  }

  // xy: flow velocity, z: liquid amount.
  vec3 flowTap(vec2 uv) {
    vec4 t = texture2D(flowField, uv);
    return vec3((t.rg * 255.0 - 127.0) / 127.0, t.b / ${LIQUID_SCALE.toFixed(1)});
  }

  // Premultiplied liquid color, tinted by the direction it flows.
  vec4 chromaFlow(vec2 uv) {
    float px = 1.0 / ${FLOW_GRID.toFixed(1)};
    vec3 s = (flowTap(uv) + flowTap(uv + vec2(px, 0.0)) + flowTap(uv + vec2(0.0, px))
      + flowTap(uv - vec2(px, 0.0)) + flowTap(uv - vec2(0.0, px))) * 0.2;
    float liquid = smoothstep(0.0, 0.1, s.z);
    float magnitude = length(s.xy);
    vec2 n = s.xy / (magnitude + 0.001);
    float right = smoothstep(0.0, 0.7, max(n.x, 0.0));
    float left = smoothstep(0.0, 0.7, max(-n.x, 0.0));
    float up = smoothstep(0.0, 0.7, max(n.y, 0.0));
    float down = smoothstep(0.0, 0.7, max(-n.y, 0.0));
    float horizontal = left + right;
    float vertical = up + down;
    float total = horizontal + vertical + 0.001;
    vec3 directed = (FLOW_LEFT * left + FLOW_RIGHT * right) * (horizontal / total)
      + (FLOW_DOWN * down + FLOW_UP * up) * (vertical / total);
    vec3 color = mix(FLOW_BASE, directed, smoothstep(0.01, 0.1, magnitude));
    return vec4(color * liquid, liquid);
  }

  void main() {
    vec2 p = gl_FragCoord.xy / size.y;
    float aspect = size.x / size.y;
    // Fixed glass grooves refract the color layers, never the page content.
    vec2 axis = vec2(0.8660254, 0.5);
    float groove = fract(dot(p, axis) * (8.0 / 1.5)) * 2.0 - 1.0;
    float slope = sign(groove) * pow(abs(groove), 4.0);
    vec2 bend = axis * slope * 0.16;
    vec2 samplePoint = p - bend;
    vec2 fringe = bend * 0.08;
    float t = time * SWIRL_SPEED;

    vec3 swirl = swirlColor(samplePoint, t);
    vec2 flowUv = vec2(samplePoint.x / aspect, samplePoint.y);
    vec2 fringeUv = vec2(fringe.x / aspect, fringe.y);
    // Color fringes split the liquid along the groove's bend.
    vec4 red = chromaFlow(flowUv - fringeUv);
    vec4 green = chromaFlow(flowUv);
    vec4 blue = chromaFlow(flowUv + fringeUv);
    vec3 layered = vec3(
      red.r + swirl.r * (1.0 - red.a),
      green.g + swirl.g * (1.0 - green.a),
      blue.b + swirl.b * (1.0 - blue.a)
    );
    vec3 under = mix(vec3(1.0), layered, OPACITY);

    float normalZ = sqrt(max(0.0, 1.0 - slope * slope));
    float reflection = pow(max(0.0, normalZ * 0.92 + slope * 0.39), 32.0);
    float seam = pow(abs(groove), 20.0);
    vec3 glass = under * (0.97 - seam * 0.10) + reflection * 0.075 + seam * 0.065;
    float edge = smoothstep(0.0, 0.16, gl_FragCoord.y / size.y);
    vec3 base = vec3(0.972549);
    gl_FragColor = vec4(clamp(mix(base, glass, edge), 0.0, 1.0), 1.0);
  }
`;

/** Decorative fluted-glass surface; CSS remains visible when WebGL is unavailable. */
export function HeroBackground() {
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = ref.current;
    const hero = canvas?.parentElement;
    if (!canvas || !hero) return;
    const gl = canvas.getContext('webgl', { alpha: false, antialias: false });
    if (!gl) return;

    const shaders: WebGLShader[] = [];
    const compile = (type: number, source: string) => {
      const shader = gl.createShader(type);
      if (!shader) return null;
      shaders.push(shader);
      gl.shaderSource(shader, source);
      gl.compileShader(shader);
      return gl.getShaderParameter(shader, gl.COMPILE_STATUS) ? shader : null;
    };
    const vertex = compile(gl.VERTEX_SHADER, VERTEX);
    const fragment = compile(gl.FRAGMENT_SHADER, FRAGMENT);
    const program = gl.createProgram();
    const buffer = gl.createBuffer();
    const texture = gl.createTexture();
    const dispose = () => {
      shaders.forEach((shader) => gl.deleteShader(shader));
      gl.deleteTexture(texture);
      gl.deleteBuffer(buffer);
      gl.deleteProgram(program);
    };
    if (!vertex || !fragment || !program || !buffer || !texture) {
      dispose();
      return;
    }
    gl.attachShader(program, vertex);
    gl.attachShader(program, fragment);
    gl.linkProgram(program);
    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
      dispose();
      return;
    }
    gl.useProgram(program);
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
    gl.bufferData(
      gl.ARRAY_BUFFER,
      new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]),
      gl.STATIC_DRAW,
    );
    const position = gl.getAttribLocation(program, 'position');
    gl.enableVertexAttribArray(position);
    gl.vertexAttribPointer(position, 2, gl.FLOAT, false, 0, 0);
    const size = gl.getUniformLocation(program, 'size');
    const timeUniform = gl.getUniformLocation(program, 'time');

    const flow = createFlowField();
    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, texture);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.texImage2D(
      gl.TEXTURE_2D,
      0,
      gl.RGBA,
      FLOW_GRID,
      FLOW_GRID,
      0,
      gl.RGBA,
      gl.UNSIGNED_BYTE,
      flow.bytes,
    );
    gl.uniform1i(gl.getUniformLocation(program, 'flowField'), 0);
    const upload = () =>
      gl.texSubImage2D(
        gl.TEXTURE_2D,
        0,
        0,
        0,
        FLOW_GRID,
        FLOW_GRID,
        gl.RGBA,
        gl.UNSIGNED_BYTE,
        flow.bytes,
      );

    const motion = matchMedia('(prefers-reduced-motion: reduce)');
    const start = performance.now();
    let pointer: FlowPoint | null = null;
    let frame = 0;
    let lastTick = start;
    let lastDraw = -Infinity;
    let visible = true;
    const animating = () => !motion.matches && visible && !document.hidden;

    const draw = (now: number) => {
      lastDraw = now;
      gl.uniform2f(size, canvas.width, canvas.height);
      // Reduced motion keeps the swirl at its starting pose.
      gl.uniform1f(
        timeUniform,
        motion.matches ? 0 : ((now - start) / 1000) % TIME_WRAP_S,
      );
      gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
    };
    // The swirl always drifts. While liquid is moving every frame is drawn;
    // the swirl alone is slow enough that ~30fps looks the same at half the cost.
    const tick = (now: number) => {
      frame = 0;
      if (!animating()) return;
      const dt = Math.min(Math.max(0, (now - lastTick) / 1000), MAX_STEP_S);
      lastTick = now;
      const stirred = flow.step(dt, pointer, canvas.width / canvas.height);
      if (stirred) upload();
      if (stirred || now - lastDraw >= IDLE_FRAME_MS) draw(now);
      frame = requestAnimationFrame(tick);
    };
    const reset = () => {
      cancelAnimationFrame(frame);
      frame = 0;
      pointer = null;
      flow.reset();
      upload();
      lastTick = performance.now();
      draw(lastTick);
      if (animating()) frame = requestAnimationFrame(tick);
    };
    const resize = new ResizeObserver(() => {
      // A soft, decorative background reads the same at a fraction of the
      // pixels; the browser scales the canvas up to fill the hero.
      const ratio = Math.min(devicePixelRatio, 1) * RENDER_SCALE;
      canvas.width = Math.max(1, Math.round(hero.clientWidth * ratio));
      canvas.height = Math.max(1, Math.round(hero.clientHeight * ratio));
      gl.viewport(0, 0, canvas.width, canvas.height);
      reset();
    });
    // Only a mouse stirs the liquid; touch scrolling should not paint.
    const move = (event: PointerEvent) => {
      if (!animating() || event.pointerType !== 'mouse') return;
      const rect = canvas.getBoundingClientRect();
      if (!rect.width || !rect.height) return;
      pointer = {
        x: (event.clientX - rect.left) / rect.width,
        y: (rect.bottom - event.clientY) / rect.height,
      };
    };
    const leave = () => {
      pointer = null;
    };
    const observer = new IntersectionObserver(([entry]) => {
      visible = entry.isIntersecting;
      reset();
    });
    resize.observe(hero);
    observer.observe(hero);
    hero.addEventListener('pointermove', move);
    hero.addEventListener('pointerleave', leave);
    motion.addEventListener('change', reset);
    document.addEventListener('visibilitychange', reset);
    return () => {
      cancelAnimationFrame(frame);
      resize.disconnect();
      observer.disconnect();
      hero.removeEventListener('pointermove', move);
      hero.removeEventListener('pointerleave', leave);
      motion.removeEventListener('change', reset);
      document.removeEventListener('visibilitychange', reset);
      dispose();
    };
  }, []);

  return <canvas ref={ref} className={s.heroBackground} aria-hidden="true" />;
}
