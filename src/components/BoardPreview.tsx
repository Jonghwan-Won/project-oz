'use client';
import type { Messages } from '@/i18n/ko';
import Link from 'next/link';
import { MagicEffect } from '@/components/MagicEffect';
import { useEffect, useRef, useState } from 'react';
import s from './BoardPreview.module.css';

type Post = {
  id: string;
  slug: string;
  category: string;
  title: string;
  excerpt: string;
  date: string;
};
export function BoardPreview({
  posts,
  labels,
}: {
  posts: Post[];
  labels: Messages['boardPreview'];
}) {
  const track = useRef<HTMLDivElement>(null);
  const [position, setPosition] = useState({ previous: false, next: false });
  useEffect(() => {
    const element = track.current;
    if (!element) return;
    const update = () =>
      setPosition({
        previous: element.scrollLeft > 2,
        next:
          element.scrollLeft + element.clientWidth < element.scrollWidth - 2,
      });
    const observer = new ResizeObserver(update);
    observer.observe(element);
    element.addEventListener('scroll', update, { passive: true });
    update();
    return () => {
      observer.disconnect();
      element.removeEventListener('scroll', update);
    };
  }, [posts.length]);
  const move = (direction: number) => {
    const element = track.current;
    if (!element) return;
    const card = element.firstElementChild;
    element.scrollBy({
      left:
        direction *
        ((card?.getBoundingClientRect().width ?? element.clientWidth) + 24),
      behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches
        ? 'instant'
        : 'smooth',
    });
  };
  return (
    <div className={s.preview}>
      <div className={s.viewport}>
        <div
          className={s.track}
          ref={track}
          id="board-preview"
          role="region"
          aria-label={labels.region}
        >
          {posts.map((post) => (
            <Link
              href={'/board/' + post.id}
              key={post.id}
              className={`interactiveCard ${s.card}`}
            >
              <span className={s.tag}>{post.category}</span>
              <h3>{post.title}</h3>
              <p>{post.excerpt}</p>
              <div className={s.art} aria-hidden="true">
                <MagicEffect />
              </div>
              <div className={s.meta}>
                <time dateTime={post.date.replaceAll('.', '-')}>
                  {post.date}
                </time>
              </div>
            </Link>
          ))}
          {!posts.length && <p className="empty">{labels.empty}</p>}
        </div>
        {position.previous && (
          <span className={s.fadeLeft} aria-hidden="true" />
        )}
        {position.next && <span className={s.fadeRight} aria-hidden="true" />}
      </div>
      {(position.previous || position.next) && (
        <div className={s.controls}>
          <button
            type="button"
            aria-label={labels.previous}
            aria-controls="board-preview"
            disabled={!position.previous}
            onClick={() => move(-1)}
          >
            <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <path d="M20 12H4m0 0 5-5m-5 5 5 5" />
            </svg>
          </button>
          <button
            type="button"
            aria-label={labels.next}
            aria-controls="board-preview"
            disabled={!position.next}
            onClick={() => move(1)}
          >
            <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <path d="M4 12h16m0 0-5-5m5 5-5 5" />
            </svg>
          </button>
        </div>
      )}
    </div>
  );
}
