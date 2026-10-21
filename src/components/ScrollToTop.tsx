'use client';

import { Button } from './ui/Button';

export function ScrollToTop({ label }: { label: string }) {
  return (
    <Button
      className="scrollToTop"
      aria-label={label}
      onClick={() => window.scrollTo({ top: 0, behavior: 'auto' })}
    >
      <span aria-hidden="true">↑</span>
    </Button>
  );
}
