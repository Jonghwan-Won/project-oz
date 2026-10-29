'use client';
import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { CommonButton } from '@/components/ui/CommonButton';
import { CommonInput } from '@/components/ui/CommonInput';
import { CommonSelectBox } from '@/components/ui/CommonSelectBox';
import { CommonSearchPanel } from '@/components/ui/CommonSearchPanel';
import { CommonGrid, type CommonGridColumn } from '@/components/ui/CommonGrid';
import { CommonPagination } from '@/components/ui/CommonPagination';
import { CommonModal } from '@/components/ui/CommonModal';
import { CommonLoading } from '@/components/ui/CommonLoading';
import { paginate } from '@/lib/admin-list';
import {
  emptyInquirySearch,
  type InquiryCode,
  type InquiryRow,
} from '@/lib/admin-inquiries';
import s from './admin.module.css';
import c from './inquiries.module.css';

export function InquiryManager({
  inquiries,
  types,
  statuses,
  total,
  initialSearch,
}: {
  inquiries: InquiryRow[];
  types: InquiryCode[];
  statuses: InquiryCode[];
  total: number;
  initialSearch: typeof emptyInquirySearch;
}) {
  const router = useRouter();
  const [search, setSearch] = useState(initialSearch);
  const [searching, startSearch] = useTransition();
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [selected, setSelected] = useState<InquiryRow | null>(null);
  const [status, setStatus] = useState('');
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');
  const result = paginate(inquiries, page, pageSize);
  const date = new Intl.DateTimeFormat('sv-SE', {
    timeZone: 'Asia/Seoul',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  });
  const open = (row: InquiryRow) => {
    setSelected(row);
    setStatus(row.statusCode);
    setMessage('');
  };
  async function save() {
    if (!selected || busy) return;
    setBusy(true);
    setMessage('');
    try {
      const response = await fetch('/api/admin/inquiries', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: selected.id,
          status,
          revision: selected.revision,
        }),
      });
      const data = await response.json();
      if (!response.ok) {
        setMessage(data.message || '저장하지 못했습니다.');
        return;
      }
      setSelected(null);
      router.refresh();
    } catch {
      setMessage('저장하지 못했습니다. 다시 시도해 주세요.');
    } finally {
      setBusy(false);
    }
  }
  const columns: CommonGridColumn<InquiryRow>[] = [
    {
      key: 'type',
      header: '유형',
      align: 'center',
      width: 120,
      render: (row) => row.typeName,
    },
    {
      key: 'body',
      header: '내용',
      align: 'center',
      render: (row) => (
        <button
          type="button"
          className={c.title}
          onClick={() => open(row)}
          title={row.body}
        >
          {row.body}
        </button>
      ),
    },
    {
      key: 'status',
      header: '처리 상태',
      align: 'center',
      width: 120,
      render: (row) => row.statusName,
    },
    {
      key: 'date',
      header: '접수일',
      align: 'center',
      width: 130,
      render: (row) => date.format(new Date(row.createdAt)),
    },
  ];
  const options = (codes: InquiryCode[]) => [
    { value: '', label: '전체' },
    ...codes.map((code) => ({ value: code.code, label: code.name })),
  ];
  return (
    <section>
      <CommonSearchPanel
        onSearch={() => {
          const url = '/admin/inquiries?' + new URLSearchParams(search);
          startSearch(() => {
            if (window.location.pathname + window.location.search === url)
              router.refresh();
            else router.push(url, { scroll: false });
          });
          setPage(1);
        }}
        onReset={() => {
          setSearch(emptyInquirySearch);
          startSearch(() => {
            if (window.location.search)
              router.push('/admin/inquiries', { scroll: false });
            else router.refresh();
          });
          setPage(1);
        }}
      >
        <label>
          <span>유형</span>
          <CommonSelectBox
            aria-label="검색 유형"
            value={search.type}
            onValueChange={(type) => setSearch({ ...search, type })}
            options={options(types)}
          />
        </label>
        <label>
          <span>처리 상태</span>
          <CommonSelectBox
            aria-label="검색 처리 상태"
            value={search.status}
            onValueChange={(status) => setSearch({ ...search, status })}
            options={options(statuses)}
          />
        </label>
        <label className={s.searchKeyword}>
          <span>검색어</span>
          <CommonInput
            type="search"
            aria-label="문의 내용 검색"
            placeholder="문의 내용"
            value={search.keyword}
            onChange={(e) => setSearch({ ...search, keyword: e.target.value })}
          />
        </label>
      </CommonSearchPanel>
      <div className={s.listPanel}>
        <div className={s.heading}>
          <p aria-live="polite">
            전체 {total}건 · 검색 결과 {inquiries.length}건
          </p>
        </div>
        <CommonGrid
          rows={result.items}
          columns={columns}
          getRowKey={(row) => row.id}
          caption="문의사항 목록"
          minWidth={700}
          wrapClassName={s.gridWrap}
          tableClassName={s.grid}
          fixedLayout
        />
        <CommonPagination
          page={result.page}
          totalPages={result.totalPages}
          total={inquiries.length}
          pageSize={pageSize}
          onPageChange={setPage}
          onPageSizeChange={(value) => {
            setPageSize(value);
            setPage(1);
          }}
        />
      </div>
      <CommonModal
        open={!!selected}
        title="문의사항 상세"
        size="md"
        onClose={() => {
          if (!busy) setSelected(null);
        }}
        actions={
          <>
            <CommonButton disabled={busy} onClick={() => setSelected(null)}>
              닫기
            </CommonButton>
            <CommonButton
              variant="primary"
              disabled={busy || status === selected?.statusCode}
              onClick={save}
            >
              저장
            </CommonButton>
          </>
        }
      >
        {selected && (
          <div className={c.detail}>
            <div className={c.meta}>
              <span>
                유형 <strong>{selected.typeName}</strong>
              </span>
              <span>
                접수일{' '}
                <strong>{date.format(new Date(selected.createdAt))}</strong>
              </span>
            </div>
            <label>
              처리 상태
              <CommonSelectBox
                aria-label="처리 상태"
                value={status}
                disabled={busy}
                onValueChange={setStatus}
                options={statuses
                  .filter(
                    (item) =>
                      item.isActive || item.code === selected.statusCode,
                  )
                  .map((item) => ({ value: item.code, label: item.name }))}
              />
            </label>
            <div>
              <strong>문의 내용</strong>
              <p className={c.body}>{selected.body}</p>
            </div>
            {message && <p role="alert">{message}</p>}
          </div>
        )}
      </CommonModal>
      <CommonLoading open={searching} />
    </section>
  );
}
