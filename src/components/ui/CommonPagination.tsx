'use client';

import { CommonSelectBox } from './CommonSelectBox';
import { Pagination } from '@mantine/core';
import s from './CommonPagination.module.css';

/** 관리자 화면은 기본 한국어 문구를 쓰고, 가이드는 locale에 맞는 문구를 넘긴다. */
export const defaultPaginationLabels = {
  summary: '총 {total}건 · {page}/{totalPages} 페이지',
  navigation: '목록 페이지',
  first: '첫 페이지',
  previous: '이전 페이지',
  next: '다음 페이지',
  last: '마지막 페이지',
  page: '{page} 페이지',
  pageSize: '페이지당 행 수',
  pageSizeOption: '{size}건씩',
};
export type PaginationLabels = typeof defaultPaginationLabels;

export function CommonPagination({
  page,
  totalPages,
  total,
  pageSize,
  onPageChange,
  onPageSizeChange,
  labels = defaultPaginationLabels,
}: {
  page: number;
  totalPages: number;
  total: number;
  pageSize: number;
  onPageChange: (page: number) => void;
  onPageSizeChange: (size: number) => void;
  labels?: PaginationLabels;
}) {
  const count = Math.max(1, totalPages);
  return (
    <div className={s.pagination}>
      <p>
        {labels.summary
          .replace('{total}', String(total))
          .replace('{page}', String(page))
          .replace('{totalPages}', String(totalPages))}
      </p>
      <Pagination
        className={s.pages}
        aria-label={labels.navigation}
        value={Math.min(Math.max(1, page), count)}
        total={count}
        onChange={onPageChange}
        getControlProps={(control) => ({
          'aria-label': labels[control],
        })}
        getItemProps={(value) => ({
          'aria-label': labels.page.replace('{page}', String(value)),
        })}
      />
      <CommonSelectBox
        className={s.pageSize}
        aria-label={labels.pageSize}
        value={String(pageSize)}
        onValueChange={(value) => onPageSizeChange(Number(value))}
        options={[5, 10, 20, 50].map((value) => ({
          value: String(value),
          label: labels.pageSizeOption.replace('{size}', String(value)),
        }))}
      />
    </div>
  );
}
