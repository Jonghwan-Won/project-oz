'use client';
import { useState, useTransition } from 'react';
import { changeLocale } from '@/i18n/actions';
import type { Locale } from '@/i18n/locale';
import type { Messages } from '@/i18n/ko';

/** 언어 전환 버튼. 한국어일 때는 지구본, 영어일 때는 태극 문양(선만)을 보여준다. */
export function LanguageSwitcher({
  locale,
  labels,
  className = 'headerIcon',
}: {
  locale: Locale;
  labels: Messages['language'];
  className?: string;
}) {
  const [pending, startTransition] = useTransition();
  const [failed, setFailed] = useState(false);
  return (
    <div className="headerControl">
      <button
        className={className}
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
            width="24"
            height="24"
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
          <svg
            width="24"
            height="24"
            viewBox="0 0 25 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
            aria-hidden="true"
          >
            <g transform="translate(2.5 2)">
              <path d="M19.353 9.914c0 5.213-4.226 9.438-9.438 9.438-5.213 0-9.438-4.225-9.438-9.438C.477 4.702 4.702.477 9.915.477c5.212 0 9.438 4.225 9.438 9.437z" />
              <path d="M19.205 11.52c-.451-2.769-2.357-4.129-4.643-4.227-2.434-.023-3.491 1.71-4.267 2.615l-.594.69c-1.361 1.238-2.384 1.633-3.876 1.588C2.897 12.153.888 9.456.888 7.224" />
            </g>
          </svg>
        )}
      </button>
      <span className={failed ? 'headerFailure' : 'srOnly'} role="status">
        {failed ? labels.failed : pending ? labels.pending : ''}
      </span>
    </div>
  );
}
