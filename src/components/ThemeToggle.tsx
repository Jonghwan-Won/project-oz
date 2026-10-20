'use client';

import { useState, useTransition } from 'react';
import { changeTheme } from '@/theme/actions';
import type { Theme } from '@/theme/theme';
import type { Messages } from '@/i18n/ko';

export function ThemeToggle({
  theme,
  labels,
}: {
  theme: Theme;
  labels: Messages['theme'];
}) {
  const [pending, startTransition] = useTransition();
  const [failed, setFailed] = useState(false);
  const label = theme === 'dark' ? labels.light : labels.dark;
  return (
    <div className="headerControl">
      <button
        className="headerIcon"
        type="button"
        aria-label={label}
        title={label}
        disabled={pending}
        aria-busy={pending}
        onClick={() => {
          setFailed(false);
          startTransition(async () => {
            try {
              await changeTheme(theme === 'dark' ? 'light' : 'dark');
            } catch {
              setFailed(true);
            }
          });
        }}
      >
        <svg
          width="21"
          height="21"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
        >
          {theme === 'dark' ? (
            <>
              <circle cx="12" cy="12" r="4" />
              <path d="M12 2v2m0 16v2M2 12h2m16 0h2M5 5l1.5 1.5m11 11L19 19M5 19l1.5-1.5m11-11L19 5" />
            </>
          ) : (
            <path d="M20.5 14A8.5 8.5 0 0 1 10 3.5 8.5 8.5 0 1 0 20.5 14Z" />
          )}
        </svg>
      </button>
      <span className={failed ? 'headerFailure' : 'srOnly'} role="status">
        {failed ? labels.failed : pending ? labels.pending : ''}
      </span>
    </div>
  );
}
