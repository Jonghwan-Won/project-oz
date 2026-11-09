'use client';

import { useEffect, useState } from 'react';
import { sharedCopy } from '@/i18n/shared-copy';
import s from './ContactCard.module.css';

export function ContactCard({
  title,
  description,
  locale,
}: {
  title: string;
  description: string;
  locale: string;
}) {
  const [status, setStatus] = useState('');
  const copy = sharedCopy(locale).contactCard;
  useEffect(() => {
    if (status !== 'copied') return;
    const timer = setTimeout(() => setStatus(''), 2000);
    return () => clearTimeout(timer);
  }, [status]);
  async function copyEmail() {
    try {
      await navigator.clipboard.writeText('anarose4815@naver.com');
      setStatus('copied');
    } catch {
      setStatus(copy.copyFailed);
    }
  }
  return (
    <aside className={s.card} aria-label={title}>
      <span className={s.eyebrow}>LET’S CONNECT</span>
      <h2>{title}</h2>
      <p>{description}</p>
      <div className={s.links}>
        <div className={s.email}>
          <span>
            <small>EMAIL</small>
            <strong>anarose4815@naver.com</strong>
          </span>
          <button
            type="button"
            onClick={copyEmail}
            aria-label={copy.copy}
            title={copy.copy}
          >
            <svg
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.7"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              {status === 'copied' ? (
                <path d="m5 12 4 4L19 6" />
              ) : (
                <>
                  <rect x="8" y="8" width="12" height="12" rx="2" />
                  <path d="M16 8V6a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v8a2 2 0 0 0 2 2h2" />
                </>
              )}
            </svg>
          </button>
        </div>
        <span className={s.status} role="status">
          {status === 'copied' ? (
            <span className={s.srOnly}>{copy.copied}</span>
          ) : (
            status
          )}
        </span>
        <a
          href="https://github.com/Jonghwan-Won"
          target="_blank"
          rel="noopener noreferrer"
          aria-label={copy.github}
        >
          <span>
            <small>GITHUB</small>
            <strong>Jonghwan-Won</strong>
          </span>
          <span className={s.linkIcon} aria-hidden="true">
            <svg
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.7"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M13 5h6v6M19 5l-9 9" />
              <path d="M19 14v3a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2h3" />
            </svg>
          </span>
        </a>
      </div>
    </aside>
  );
}
