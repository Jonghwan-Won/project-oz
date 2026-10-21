'use client';

import type { ReactNode } from 'react';
import { Button } from './Button';
import s from './SearchPanel.module.css';

export function SearchPanel({
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
        <Button size="sm" type="reset">
          초기화
        </Button>
        <Button size="sm" type="submit" variant="primary">
          조회
        </Button>
      </div>
    </form>
  );
}
