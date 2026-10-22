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
        <CommonButton size="sm" type="reset">
          초기화
        </CommonButton>
        <CommonButton size="sm" type="submit" variant="primary">
          조회
        </CommonButton>
      </div>
    </form>
  );
}
