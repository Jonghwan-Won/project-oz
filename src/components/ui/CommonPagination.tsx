'use client';

import { CommonSelectBox } from './CommonSelectBox';
import { Pagination } from '@mantine/core';
import s from './CommonPagination.module.css';

export function CommonPagination({
  page,
  totalPages,
  total,
  pageSize,
  onPageChange,
  onPageSizeChange,
}: {
  page: number;
  totalPages: number;
  total: number;
  pageSize: number;
  onPageChange: (page: number) => void;
  onPageSizeChange: (size: number) => void;
}) {
  const count = Math.max(1, totalPages);
  return (
    <div className={s.pagination}>
      <p>
        총 {total}건 · {page}/{totalPages} 페이지
      </p>
      <Pagination
        className={s.pages}
        aria-label="목록 페이지"
        value={Math.min(Math.max(1, page), count)}
        total={count}
        onChange={onPageChange}
        getControlProps={(control) => ({
          'aria-label': {
            first: '첫 페이지',
            previous: '이전 페이지',
            last: '마지막 페이지',
            next: '다음 페이지',
          }[control],
        })}
        getItemProps={(value) => ({ 'aria-label': `${value} 페이지` })}
      />
      <CommonSelectBox
        className={s.pageSize}
        aria-label="페이지당 행 수"
        value={String(pageSize)}
        onValueChange={(value) => onPageSizeChange(Number(value))}
        options={[5, 10, 20, 50].map((value) => ({
          value: String(value),
          label: `${value}건씩`,
        }))}
      />
    </div>
  );
}
