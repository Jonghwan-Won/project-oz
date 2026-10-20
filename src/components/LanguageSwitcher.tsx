'use client';

import { useState, useTransition } from 'react';
import * as DropdownMenu from '@/components/ui/DropdownMenu';
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
      <DropdownMenu.Root modal={false}>
        <DropdownMenu.Trigger asChild>
          <button
            className="headerIcon"
            type="button"
            aria-label={labels.label}
            title={labels.label}
            disabled={pending}
            aria-busy={pending}
          >
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
          </button>
        </DropdownMenu.Trigger>
        <DropdownMenu.Content aria-label={labels.label}>
          <DropdownMenu.RadioGroup
            value={locale}
            onValueChange={(value) => {
              setFailed(false);
              startTransition(async () => {
                try {
                  await changeLocale(value);
                } catch {
                  setFailed(true);
                }
              });
            }}
          >
            <DropdownMenu.RadioItem value="ko" disabled={pending}>
              <span lang="ko">한국어</span>
            </DropdownMenu.RadioItem>
            <DropdownMenu.RadioItem value="en" disabled={pending}>
              <span lang="en">English</span>
            </DropdownMenu.RadioItem>
          </DropdownMenu.RadioGroup>
        </DropdownMenu.Content>
      </DropdownMenu.Root>
      <span className={failed ? 'headerFailure' : 'srOnly'} role="status">
        {failed ? labels.failed : pending ? labels.pending : ''}
      </span>
    </div>
  );
}
