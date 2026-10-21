'use client';

import { useEffect, useRef } from 'react';
import { createOzParticles } from './oz-particles';
import s from './OzParticles.module.css';

export function OzParticles({ label }: { label: string }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const time = useRef(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    const context = canvas?.getContext('2d');
    if (!canvas || !context) return;
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)');
    const particles = createOzParticles(window.innerWidth < 760 ? 1300 : 2600);
    let width = 0;
    let height = 0;
    let frame = 0;
    let previous = 0;
    let visible = true;

    const draw = () => {
      context.clearRect(0, 0, width, height);
      const seconds = time.current;
      const cycle = seconds % 16;
      const blend = reduced.matches
        ? 0
        : cycle < 5
          ? 0
          : cycle < 8
            ? (1 - Math.cos(((cycle - 5) / 3) * Math.PI)) / 2
            : cycle < 10
              ? 1
              : cycle < 13
                ? (1 + Math.cos(((cycle - 10) / 3) * Math.PI)) / 2
                : 0;
      const rotation = reduced.matches
        ? -0.16
        : Math.sin(seconds * 0.21) * 0.3 - 0.12;
      const tilt = reduced.matches ? 0.06 : Math.sin(seconds * 0.16) * 0.09;
      const scale = Math.min(width / 415, height / 385) * 0.9;
      const centerX = width * 0.53;
      const centerY = height * 0.5;
      const projected = particles
        .map((point) => {
          const x = point.x * (1 - blend) + point.sphereX * blend;
          const y = point.y * (1 - blend) + point.sphereY * blend;
          const z = point.z * (1 - blend) + point.sphereZ * blend;
          const rx = x * Math.cos(rotation) + z * Math.sin(rotation);
          const rz = -x * Math.sin(rotation) + z * Math.cos(rotation);
          const ry = y * Math.cos(tilt) - rz * Math.sin(tilt);
          const depth = y * Math.sin(tilt) + rz * Math.cos(tilt);
          const perspective = 650 / (650 - depth);
          return {
            x: centerX + rx * scale * perspective,
            y: centerY + ry * scale * perspective,
            depth,
            radius: point.size * scale * perspective,
          };
        })
        .sort((a, b) => a.depth - b.depth);
      for (const point of projected) {
        const opacity = Math.max(0.18, Math.min(1, (point.depth + 200) / 280));
        const hue = 205 + (point.x / width) * 70 + Math.sin(seconds * 0.2) * 12;
        context.fillStyle = `hsla(${hue}, 95%, ${65 + opacity * 20}%, ${opacity})`;
        context.beginPath();
        context.arc(point.x, point.y, point.radius, 0, Math.PI * 2);
        context.fill();
      }
    };
    const tick = (now: number) => {
      if (previous && visible && !reduced.matches)
        time.current += Math.min((now - previous) / 1000, 0.05);
      previous = now;
      if (visible) draw();
      if (!reduced.matches) frame = requestAnimationFrame(tick);
    };
    const resize = () => {
      const bounds = canvas.getBoundingClientRect();
      width = bounds.width;
      height = bounds.height;
      const ratio = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = Math.round(width * ratio);
      canvas.height = Math.round(height * ratio);
      context.setTransform(ratio, 0, 0, ratio, 0, 0);
      draw();
    };
    const restart = () => {
      cancelAnimationFrame(frame);
      previous = 0;
      draw();
      if (!reduced.matches) frame = requestAnimationFrame(tick);
    };
    const sizeObserver = new ResizeObserver(resize);
    sizeObserver.observe(canvas);
    const visibilityObserver = new IntersectionObserver(([entry]) => {
      visible = entry.isIntersecting;
    });
    visibilityObserver.observe(canvas);
    reduced.addEventListener('change', restart);
    resize();
    restart();
    return () => {
      cancelAnimationFrame(frame);
      sizeObserver.disconnect();
      visibilityObserver.disconnect();
      reduced.removeEventListener('change', restart);
    };
  }, []);

  return (
    <div className={s.scene} role="img" aria-label={label}>
      <canvas ref={canvasRef} className={s.canvas} aria-hidden="true" />
    </div>
  );
}
