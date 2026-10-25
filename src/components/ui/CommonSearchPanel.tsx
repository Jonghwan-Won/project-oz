'use client';

import type { ReactNode } from 'react';
import { CommonButton } from './CommonButton';
import s from './CommonSearchPanel.module.css';

export function CommonSearchPanel({
  children,
  onSearch,
  onReset,
}: {
  children: ReactNode;
  onSearch: () => void;
  onReset: () => void;
}) {
  return (
    <form
      className={s.panel}
      aria-label="검색 조건"
      onSubmit={(event) => {
        event.preventDefault();
        onSearch();
      }}
      onReset={(event) => {
        event.preventDefault();
        onReset();
      }}
    >
      <div className={s.fields}>{children}</div>
      <div className={s.actions}>
        <CommonButton
          aria-label="검색 조건 초기화"
          className={s.iconButton}
          size="sm"
          type="reset"
          title="초기화"
        >
          <svg
            viewBox="0 0 24 24"
            aria-hidden="true"
            width="18"
            height="18"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M3 12a9 9 0 1 0 2.64-6.36L3 8" />
            <path d="M3 3v5h5" />
          </svg>
        </CommonButton>
        <CommonButton
          aria-label="검색"
          className={s.iconButton}
          size="sm"
          type="submit"
          variant="primary"
          title="검색"
        >
          <svg
            viewBox="0 0 24 24"
            aria-hidden="true"
            width="18"
            height="18"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
          >
            <circle cx="11" cy="11" r="7" />
            <path d="m20 20-4-4" />
          </svg>
        </CommonButton>
      </div>
    </form>
  );
}
