'use client';

import { CommonButton } from './ui/CommonButton';

export function ScrollToTop({ label }: { label: string }) {
  return (
    <CommonButton
      className="scrollToTop"
      aria-label={label}
      onClick={() => window.scrollTo({ top: 0, behavior: 'auto' })}
    >
      <span aria-hidden="true">↑</span>
    </CommonButton>
  );
}
