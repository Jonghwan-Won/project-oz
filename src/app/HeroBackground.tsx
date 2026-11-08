'use client';

import { useEffect, useRef } from 'react';
import s from './home.module.css';

/** Decorative water surface; CSS remains visible when WebGL is unavailable. */
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
    const vertex = compile(
      gl.VERTEX_SHADER,
      `
      attribute vec2 position;
      void main() { gl_Position = vec4(position, 0.0, 1.0); }
    `,
    );
    const fragment = compile(
      gl.FRAGMENT_SHADER,
      `
      precision mediump float;
      uniform vec2 size;
      uniform vec4 strokes[12];
      uniform vec4 ages[3];
      vec3 restingColor(vec2 p) {
        float cloud = 0.5 + 0.5 * sin(p.x * 3.1 + sin(p.y * 4.0) * 1.2);
        return mix(vec3(0.975, 0.97, 0.99), vec3(0.91, 0.895, 0.96), cloud);
      }
      vec3 flowingColor(vec2 p) {
        float coverage = 0.0;
        vec3 ink = vec3(0.0);
        for (int i = 0; i < 12; i++) {
          float age = ages[i / 4][i - (i / 4) * 4];
          vec2 a = strokes[i].xy;
          vec2 direction = strokes[i].zw - a;
          vec2 heading = direction / max(length(direction), 0.0001);
          float momentum = min(length(direction) * 14.0, 0.5);
          vec2 drift = heading * momentum * (1.0 - exp(-age * 1.3));
          vec2 offset = p - a - drift;
          float along = clamp(dot(offset, direction) / max(dot(direction, direction), 0.00001), 0.0, 1.0);
          vec2 away = offset - direction * along;
          float width = 0.18 + age * 0.065;
          float brush = exp(-dot(away, away) / (width * width)) * exp(-age * 1.25);
          brush *= 1.0 - smoothstep(1.6, 2.5, age);
          vec3 tint = mix(vec3(0.47, 0.25, 0.86), vec3(0.30, 0.52, 0.94), heading.x * 0.5 + 0.5);
          tint = mix(tint, vec3(0.83, 0.50, 0.89), max(heading.y, 0.0) * 0.5);
          ink += tint * brush;
          coverage += brush;
        }
        return mix(restingColor(p), ink / max(coverage, 0.0001), 1.0 - exp(-coverage * 0.75));
      }
      void main() {
        vec2 p = gl_FragCoord.xy / size.y;
        // Fixed glass grooves refract the color layer, never the page content.
        vec2 axis = vec2(0.8660254, 0.5);
        float groove = fract(dot(p, axis) * (8.0 / 1.5)) * 2.0 - 1.0;
        float slope = sign(groove) * pow(abs(groove), 4.0);
        vec2 bend = axis * slope * 0.16;
        vec2 samplePoint = p - bend;
        vec3 resting = restingColor(samplePoint);
        vec3 flowing = vec3(
          flowingColor(samplePoint - bend * 0.08).r,
          flowingColor(samplePoint).g,
          flowingColor(samplePoint + bend * 0.08).b
        );
        float normalZ = sqrt(max(0.0, 1.0 - slope * slope));
        float reflection = pow(max(0.0, normalZ * 0.92 + slope * 0.39), 32.0);
        float seam = pow(abs(groove), 20.0);
        vec3 glass = resting * (0.97 - seam * 0.10) + reflection * 0.075 + seam * 0.065;
        float edge = smoothstep(0.0, 0.16, gl_FragCoord.y / size.y);
        vec3 base = vec3(0.972549);
        vec3 color = mix(base, glass, edge) + (flowing - resting) * 0.20;
        gl_FragColor = vec4(clamp(color, 0.0, 1.0), 1.0);
      }
    `,
    );
    const program = gl.createProgram();
    const buffer = gl.createBuffer();
    const dispose = () => {
      shaders.forEach((shader) => gl.deleteShader(shader));
      gl.deleteBuffer(buffer);
      gl.deleteProgram(program);
    };
    if (!vertex || !fragment || !program || !buffer) {
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
    const strokesUniform = gl.getUniformLocation(program, 'strokes[0]');
    const agesUniform = gl.getUniformLocation(program, 'ages[0]');
    const strokes = new Float32Array(48);
    const timestamps = new Float64Array(12).fill(-Infinity);
    const ages = new Float32Array(12);
    const motion = matchMedia('(prefers-reduced-motion: reduce)');
    let previous: { x: number; y: number } | null = null;
    let frame = 0;
    let index = 0;
    let lastWave = -Infinity;
    let visible = true;

    const draw = (now: number) => {
      frame = 0;
      gl.uniform2f(size, canvas.width, canvas.height);
      for (let i = 0; i < ages.length; i++)
        ages[i] = Math.min(10, (now - timestamps[i]) / 1000);
      gl.uniform4fv(strokesUniform, strokes);
      gl.uniform4fv(agesUniform, ages);
      gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
      if (
        !motion.matches &&
        visible &&
        !document.hidden &&
        now - lastWave < 2500
      )
        frame = requestAnimationFrame(draw);
    };
    const reset = () => {
      cancelAnimationFrame(frame);
      frame = 0;
      lastWave = -Infinity;
      timestamps.fill(-Infinity);
      previous = null;
      draw(performance.now());
    };
    const resize = new ResizeObserver(() => {
      // A decorative background does not need full retina resolution.
      const ratio = Math.min(devicePixelRatio, 1);
      canvas.width = Math.max(1, Math.round(hero.clientWidth * ratio));
      canvas.height = Math.max(1, Math.round(hero.clientHeight * ratio));
      gl.viewport(0, 0, canvas.width, canvas.height);
      reset();
    });
    const pointer = (event: PointerEvent) => {
      const now = performance.now();
      if (
        motion.matches ||
        !visible ||
        document.hidden ||
        event.pointerType !== 'mouse' ||
        now - lastWave < 24
      )
        return;
      const rect = canvas.getBoundingClientRect();
      if (!rect.height) return;
      const point = {
        x: (event.clientX - rect.left) / rect.height,
        y: (rect.bottom - event.clientY) / rect.height,
      };
      if (now - lastWave > 180) previous = null;
      const from = previous ?? point;
      strokes.set([from.x, from.y, point.x, point.y], index * 4);
      timestamps[index] = now;
      previous = point;
      index = (index + 1) % 12;
      lastWave = now;
      if (!frame) frame = requestAnimationFrame(draw);
    };
    const leave = () => {
      previous = null;
    };
    const observer = new IntersectionObserver(([entry]) => {
      visible = entry.isIntersecting;
      reset();
    });
    resize.observe(hero);
    observer.observe(hero);
    hero.addEventListener('pointermove', pointer);
    hero.addEventListener('pointerleave', leave);
    motion.addEventListener('change', reset);
    document.addEventListener('visibilitychange', reset);
    return () => {
      cancelAnimationFrame(frame);
      resize.disconnect();
      observer.disconnect();
      hero.removeEventListener('pointermove', pointer);
      hero.removeEventListener('pointerleave', leave);
      motion.removeEventListener('change', reset);
      document.removeEventListener('visibilitychange', reset);
      dispose();
    };
  }, []);

  return <canvas ref={ref} className={s.heroBackground} aria-hidden="true" />;
}
