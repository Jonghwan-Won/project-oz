'use client';

import { Button } from './Button';
import { SelectBox } from './SelectBox';
import s from './Pagination.module.css';

export function Pagination({
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
  const start = Math.max(1, Math.min(page - 2, totalPages - 4));
  const pages = Array.from(
    { length: Math.min(5, totalPages) },
    (_, index) => start + index,
  );
  return (
    <div className={s.pagination}>
      <p>
        총 {total}건 · {page}/{totalPages} 페이지
      </p>
      <nav className={s.pages} aria-label="목록 페이지">
        <Button
          size="sm"
          aria-label="첫 페이지"
          disabled={page === 1}
          onClick={() => onPageChange(1)}
        >
          «
        </Button>
        <Button
          size="sm"
          aria-label="이전 페이지"
          disabled={page === 1}
          onClick={() => onPageChange(page - 1)}
        >
          ‹
        </Button>
        {pages.map((value) => (
          <Button
            key={value}
            size="sm"
            variant={value === page ? 'primary' : 'ghost'}
            aria-label={`${value} 페이지`}
            aria-current={value === page ? 'page' : undefined}
            onClick={() => onPageChange(value)}
          >
            {value}
          </Button>
        ))}
        <Button
          size="sm"
          aria-label="다음 페이지"
          disabled={page === totalPages}
          onClick={() => onPageChange(page + 1)}
        >
          ›
        </Button>
        <Button
          size="sm"
          aria-label="마지막 페이지"
          disabled={page === totalPages}
          onClick={() => onPageChange(totalPages)}
        >
          »
        </Button>
      </nav>
      <SelectBox
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
