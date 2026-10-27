'use client';

import { useEffect, useState, type CSSProperties } from 'react';
import type { Messages } from '@/i18n/ko';
import s from './HomeSectionNav.module.css';

const sections = ['about', 'projects', 'board', 'help'] as const;

export function HomeSectionNav({ labels }: { labels: Messages['navigation'] }) {
  const [active, setActive] = useState<string>('about');

  useEffect(() => {
    let frame = 0;
    const update = () => {
      let current: string = 'about';
      for (const id of sections) {
        if (
          (document.getElementById(id)?.getBoundingClientRect().top ??
            Infinity) <= 160
        )
          current = id;
      }
      setActive(current);
    };
    const schedule = () => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(update);
    };
    update();
    window.addEventListener('scroll', schedule, { passive: true });
    window.addEventListener('resize', schedule);
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener('scroll', schedule);
      window.removeEventListener('resize', schedule);
    };
  }, []);

  return (
    <nav
      className={s.nav}
      aria-label={labels.home}
      style={
        {
          '--active-index': sections.findIndex((id) => id === active),
        } as CSSProperties
      }
    >
      <span className={s.indicator} aria-hidden="true">
        <span key={active} className={s.droplet} />
      </span>
      {sections.map((id) => (
        <a
          key={id}
          href={`#${id}`}
          className={s.item}
          aria-label={labels[id]}
          aria-current={active === id ? 'location' : undefined}
          onClick={(event) => {
            if (
              event.metaKey ||
              event.ctrlKey ||
              event.shiftKey ||
              event.altKey
            )
              return;
            document.getElementById(id)?.focus({ preventScroll: true });
          }}
        >
          <svg
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.6"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            {id === 'about' && (
              <g transform="translate(0 -0.75)">
                <circle cx="12" cy="8" r="3.5" />
                <path d="M5 21v-2a7 7 0 0 1 14 0v2" />
              </g>
            )}
            {id === 'projects' && (
              <>
                <rect x="3" y="3" width="7" height="7" rx="1.5" />
                <rect x="14" y="3" width="7" height="7" rx="1.5" />
                <rect x="3" y="14" width="7" height="7" rx="1.5" />
                <rect x="14" y="14" width="7" height="7" rx="1.5" />
              </>
            )}
            {id === 'board' && (
              <>
                <path d="M14 3H6a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9Z" />
                <path d="M14 3v6h6M8 13h8M8 17h5" />
              </>
            )}
            {id === 'help' && (
              <>
                <rect x="3" y="5" width="18" height="14" rx="2" />
                <path d="m3 6 9 7 9-7" />
              </>
            )}
          </svg>
          <span className={s.tooltip} aria-hidden="true">
            {labels[id]}
          </span>
        </a>
      ))}
    </nav>
  );
}
