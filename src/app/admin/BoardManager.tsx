'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { CommonButton, CommonButtonLink } from '@/components/ui/CommonButton';
import { CommonInput } from '@/components/ui/CommonInput';
import { CommonSelectBox } from '@/components/ui/CommonSelectBox';
import { CommonSearchPanel } from '@/components/ui/CommonSearchPanel';
import { CommonPagination } from '@/components/ui/CommonPagination';
import { CommonGrid, type CommonGridColumn } from '@/components/ui/CommonGrid';
import { CommonConfirm } from '@/components/ui/CommonConfirm';
import { CommonAlert } from '@/components/ui/CommonAlert';
import { emptyBoardSearch, matchesBoard, paginate } from '@/lib/admin-list';
import type { PostListItem } from '@/lib/post-form';
import { categories } from '@/content/site';
import s from './admin.module.css';

export function BoardManager({ posts }: { posts: PostListItem[] }) {
  const router = useRouter();
  const [search, setSearch] = useState(emptyBoardSearch);
  const [applied, setApplied] = useState(emptyBoardSearch);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [selected, setSelected] = useState<string[]>([]);
  const [confirm, setConfirm] = useState(false);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');
  const [deleted, setDeleted] = useState(false);
  // shortcut: 소량 개발 목록은 프론트 검색/페이징, 운영 데이터 증가 시 서버 조회로 전환.
  const filtered = posts.filter((post) =>
    matchesBoard(
      {
        title: Object.values(post.translations)
          .map((c) => c.title)
          .join(' '),
        summary: Object.values(post.translations)
          .map((c) => c.summary)
          .join(' '),
        slug: post.slug,
        category: post.category,
        status: post.isVisible ? '공개' : '비공개',
      },
      applied,
    ),
  );
  const result = paginate(filtered, page, pageSize);
  const dateFormat = new Intl.DateTimeFormat('sv-SE', {
    timeZone: 'Asia/Seoul',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  });
  const columns: CommonGridColumn<PostListItem>[] = [
    {
      key: 'select',
      header: (
        <CommonInput
          type="checkbox"
          aria-label="현재 페이지 전체 선택"
          disabled={busy || !result.items.length}
          checked={
            !!result.items.length &&
            result.items.every((p) => selected.includes(p.id))
          }
          ref={(input) => {
            if (input)
              input.indeterminate =
                result.items.some((p) => selected.includes(p.id)) &&
                !result.items.every((p) => selected.includes(p.id));
          }}
          onChange={(event) =>
            setSelected(
              event.target.checked
                ? [...new Set([...selected, ...result.items.map((p) => p.id)])]
                : selected.filter(
                    (id) => !result.items.some((p) => p.id === id),
                  ),
            )
          }
        />
      ),
      render: (post) => (
        <CommonInput
          type="checkbox"
          aria-label={`${post.translations.ko.title} 선택`}
          disabled={busy}
          checked={selected.includes(post.id)}
          onChange={(event) =>
            setSelected(
              event.target.checked
                ? [...selected, post.id]
                : selected.filter((id) => id !== post.id),
            )
          }
        />
      ),
      align: 'center',
      width: 60,
    },
    {
      key: 'title',
      header: '게시글 제목',
      width: 400,
      render: (post) => (
        <Link href={`/admin/board/${post.id}`} className={s.gridTitle}>
          <span className={s.gridTitleText}>{post.translations.ko.title}</span>
        </Link>
      ),
    },
    {
      key: 'category',
      header: '카테고리',
      render: (post) => post.category,
      align: 'center',
    },
    {
      key: 'visibility',
      header: '노출 여부',
      render: (post) => (post.isVisible ? 'Y' : 'N'),
      align: 'center',
    },
    {
      key: 'createdAt',
      header: '작성일자',
      render: (post) =>
        post.createdAt ? dateFormat.format(new Date(post.createdAt)) : '-',
      align: 'center',
      width: 110,
    },
    {
      key: 'updatedAt',
      header: '수정일자',
      render: (post) =>
        post.updatedAt ? dateFormat.format(new Date(post.updatedAt)) : '-',
      align: 'center',
      width: 110,
    },
  ];
  async function remove() {
    setConfirm(false);
    setBusy(true);
    setMessage('');
    try {
      const response = await fetch('/api/admin/posts', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(
          posts
            .filter((p) => selected.includes(p.id))
            .map(({ id, version }) => ({ id, version })),
        ),
      });
      const data = await response.json();
      if (!response.ok) throw Error(data.message || '삭제하지 못했습니다.');
      setSelected([]);
      setDeleted(true);
      router.refresh();
    } catch (error) {
      setMessage(
        error instanceof Error ? error.message : '삭제하지 못했습니다.',
      );
    } finally {
      setBusy(false);
    }
  }
  return (
    <section>
      <CommonSearchPanel
        onSearch={() => {
          setApplied({ ...search });
          setPage(1);
          setSelected([]);
        }}
        onReset={() => {
          setSearch(emptyBoardSearch);
          setApplied(emptyBoardSearch);
          setPage(1);
          setSelected([]);
        }}
      >
        <label>
          <span>노출 여부</span>
          <CommonSelectBox
            aria-label="검색 노출 여부"
            value={search.status}
            onValueChange={(status) => setSearch({ ...search, status })}
            options={[
              { value: '', label: '전체' },
              { value: '공개', label: '노출' },
              { value: '비공개', label: '미노출' },
            ]}
          />
        </label>
        <label>
          <span>카테고리</span>
          <CommonSelectBox
            aria-label="검색 카테고리"
            value={search.category}
            onValueChange={(category) => setSearch({ ...search, category })}
            options={categories.map((c, i) => ({
              value: i ? c : '',
              label: c,
            }))}
          />
        </label>
        <label className={s.searchKeyword}>
          <span>검색어</span>
          <CommonInput
            type="search"
            value={search.keyword}
            placeholder="제목·주소·요약"
            onChange={(e) => setSearch({ ...search, keyword: e.target.value })}
          />
        </label>
      </CommonSearchPanel>
      <div className={s.listPanel}>
        <div className={s.heading}>
          <p aria-live="polite">
            전체 {posts.length}건 · 검색 결과 {filtered.length}건
          </p>
          <div className={s.actions}>
            <CommonButton
              disabled={!selected.length || busy}
              onClick={() => setConfirm(true)}
            >
              삭제
            </CommonButton>
            <CommonButtonLink href="/admin/board/new" variant="primary">
              등록
            </CommonButtonLink>
          </div>
        </div>
        {message && (
          <p role="status" className={s.notice}>
            {message}
          </p>
        )}
        <CommonGrid
          rows={result.items}
          columns={columns}
          getRowKey={(post) => post.id}
          caption="게시글 목록"
          emptyMessage="검색 결과가 없습니다."
          minWidth={900}
          wrapClassName={s.gridWrap}
          tableClassName={`${s.grid} ${s.projectGrid}`}
          fixedLayout
        />
        <CommonPagination
          page={result.page}
          totalPages={result.totalPages}
          total={filtered.length}
          pageSize={pageSize}
          onPageChange={setPage}
          onPageSizeChange={(size) => {
            setPageSize(size);
            setPage(1);
          }}
        />
      </div>
      <CommonConfirm
        open={confirm}
        title="게시글 삭제"
        content={`선택한 ${selected.length}개 게시글을 삭제할까요?`}
        confirmLabel="삭제"
        onConfirm={remove}
        onCancel={() => setConfirm(false)}
      />
      <CommonAlert
        open={deleted}
        content="삭제되었습니다."
        onClose={() => setDeleted(false)}
      />
    </section>
  );
}
