'use client';

import { useEffect, useState, type ReactNode } from 'react';
import Lenis from 'lenis';
import 'lenis/dist/lenis.css';
import { BrandLogo } from '@/components/BrandLogo';
import s from './portfolio.module.css';

const sections = [
  ['profile', '프로필'],
  ['projects', '프로젝트'],
  ['works', 'Works'],
] as const;

export function PortfolioNav() {
  const [active, setActive] = useState('');
  useEffect(() => {
    const motion = window.matchMedia('(prefers-reduced-motion: reduce)');
    let lenis: Lenis | undefined;
    const configure = () => {
      lenis?.destroy();
      lenis = motion.matches
        ? undefined
        : new Lenis({
            autoRaf: true,
            autoToggle: true,
            anchors: { offset: -68 },
            allowNestedScroll: true,
            lerp: 0.09,
          });
    };
    configure();
    motion.addEventListener('change', configure);
    return () => {
      motion.removeEventListener('change', configure);
      lenis?.destroy();
    };
  }, []);
  useEffect(() => {
    const update = () => {
      let current = '';
      for (const [id] of sections) {
        if (
          (document.getElementById(id)?.getBoundingClientRect().top ??
            Infinity) <= 128
        )
          current = id;
      }
      if (
        window.scrollY + window.innerHeight >=
        document.documentElement.scrollHeight - 2
      )
        current = 'works';
      setActive(current);
    };
    update();
    window.addEventListener('scroll', update, { passive: true });
    window.addEventListener('resize', update);
    return () => {
      window.removeEventListener('scroll', update);
      window.removeEventListener('resize', update);
    };
  }, []);
  return (
    <header className={s.header}>
      <a href="#portfolio" aria-label="포트폴리오 처음으로" className={s.brand}>
        <i aria-hidden="true" />
        <BrandLogo />
      </a>
      <nav aria-label="포트폴리오 섹션">
        {sections.map(([id, label]) => (
          <a
            key={id}
            href={'#' + id}
            aria-current={active === id ? 'location' : undefined}
          >
            {label}
          </a>
        ))}
      </nav>
    </header>
  );
}

const views = [
  ['large', '크게 보기'],
  ['small', '작게 보기'],
  ['list', '리스트 보기'],
] as const;

export function ProjectViews({
  children,
  list,
}: {
  children: ReactNode;
  list: ReactNode;
}) {
  const [view, setView] = useState<(typeof views)[number][0]>('large');
  return (
    <>
      <div className={s.views} role="group" aria-label="프로젝트 보기 방식">
        {views.map(([id, label]) => (
          <button
            key={id}
            type="button"
            aria-pressed={view === id}
            onClick={() => setView(id)}
          >
            {label}
          </button>
        ))}
      </div>
      {view === 'list' ? (
        list
      ) : (
        <div className={s.grid} data-view={view}>
          {children}
        </div>
      )}
    </>
  );
}
