'use client';
import { useState, useTransition } from 'react';
import { changeLocale } from '@/i18n/actions';
import type { Locale } from '@/i18n/locale';
import type { Messages } from '@/i18n/ko';

export function LanguageSwitcher({
  locale,
  labels,
}: {
  locale: Locale;
  labels: Messages['language'];
}) {
  const [pending, startTransition] = useTransition();
  const [failed, setFailed] = useState(false);
  return (
    <div className="headerControl">
      <button
        className="headerIcon"
        type="button"
        aria-label={labels.label}
        title={labels.label}
        disabled={pending}
        aria-busy={pending}
        onClick={() => {
          setFailed(false);
          startTransition(async () => {
            try {
              await changeLocale(locale === 'ko' ? 'en' : 'ko');
            } catch {
              setFailed(true);
            }
          });
        }}
      >
        {locale === 'ko' ? (
          <svg
            width="21"
            height="21"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
            aria-hidden="true"
          >
            <circle cx="12" cy="12" r="9" />
            <ellipse cx="12" cy="12" rx="4" ry="9" />
            <path d="M3 12h18M5 6.5h14M5 17.5h14" />
          </svg>
        ) : (
          <svg width="21" height="21" viewBox="0 0 24 24" aria-hidden="true">
            <circle cx="12" cy="12" r="9" fill="#CD2E3A" />
            <path
              d="M3 12a9 9 0 0 0 18 0 4.5 4.5 0 0 0-9 0 4.5 4.5 0 0 1-9 0Z"
              fill="#0047A0"
            />
          </svg>
        )}
      </button>
      <span className={failed ? 'headerFailure' : 'srOnly'} role="status">
        {failed ? labels.failed : pending ? labels.pending : ''}
      </span>
    </div>
  );
}
