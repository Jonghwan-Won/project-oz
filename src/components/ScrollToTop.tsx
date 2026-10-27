'use client';

import { CommonButton } from './ui/CommonButton';
import s from './ScrollToTop.module.css';

export function ScrollToTop({ label }: { label: string }) {
  return (
    <CommonButton
      className={s.button}
      aria-label={label}
      title={label}
      onClick={() => window.scrollTo({ top: 0, behavior: 'auto' })}
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
        <path d="m6 10 6-6 6 6M12 4v16" />
      </svg>
    </CommonButton>
  );
}
