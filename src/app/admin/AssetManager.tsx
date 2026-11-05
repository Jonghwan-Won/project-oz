'use client';
import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { CommonButton } from '@/components/ui/CommonButton';
import { CommonInput } from '@/components/ui/CommonInput';
import { CommonGrid, type CommonGridColumn } from '@/components/ui/CommonGrid';
import { CommonPagination } from '@/components/ui/CommonPagination';
import { CommonConfirm } from '@/components/ui/CommonConfirm';
import { CommonSearchPanel } from '@/components/ui/CommonSearchPanel';
import { CommonSelectBox } from '@/components/ui/CommonSelectBox';
import { CommonLoading } from '@/components/ui/CommonLoading';
import { paginate } from '@/lib/admin-list';
import {
  emptyAssetSearch,
  formatAssetSize,
  type AdminAsset,
} from '@/lib/admin-assets';
import s from './admin.module.css';
import c from './assets.module.css';

export function AssetManager({
  assets,
  totals,
  initialSearch,
  readOnly = true,
}: {
  assets: AdminAsset[];
  totals: { total: number; size: number; unused: number; unusedSize: number };
  initialSearch: typeof emptyAssetSearch;
  readOnly?: boolean;
}) {
  const router = useRouter();
  const [search, setSearch] = useState(initialSearch);
  const [searching, startSearch] = useTransition();
  const [selected, setSelected] = useState<string[]>([]);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [confirm, setConfirm] = useState(false);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');
  const unused = assets.filter((a) => !a.usages.length);
  const totalSize = (items: AdminAsset[]) =>
    formatAssetSize(items.reduce((sum, a) => sum + a.size, 0));
  const filtered = assets;
  const result = paginate(filtered, page, pageSize);
  const eligible = result.items.filter((a) => !a.usages.length);
  const chosen = unused.filter((a) => selected.includes(a.id));
  const date = new Intl.DateTimeFormat('sv-SE', {
    timeZone: 'Asia/Seoul',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  });
  async function remove() {
    if (readOnly) return;
    setConfirm(false);
    setBusy(true);
    setMessage('');
    try {
      const response = await fetch('/api/admin/assets', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(chosen.map((a) => a.id)),
      });
      const data = await response.json();
      if (!response.ok) setMessage(data.message || '삭제하지 못했습니다.');
      else {
        setMessage(
          `${data.deleted}개 삭제${data.failures.length ? ` · 실패 ${data.failures.length}개: ${data.failures.map((f: { id: string; message: string }) => `${assets.find((a) => a.id === f.id)?.name ?? f.id}: ${f.message}`).join(' / ')}` : ''}`,
        );
        setSelected([]);
        router.refresh();
      }
    } catch {
      setMessage('삭제 결과를 확인하지 못했습니다. 목록을 새로고침해 주세요.');
      router.refresh();
    } finally {
      setBusy(false);
    }
  }
  const columns: CommonGridColumn<AdminAsset>[] = [
    {
      key: 'select',
      header: (
        <CommonInput
          type="checkbox"
          aria-label="현재 페이지 미사용 파일 전체 선택"
          disabled={readOnly || busy || !eligible.length}
          checked={
            eligible.length > 0 &&
            eligible.every((a) => selected.includes(a.id))
          }
          onChange={(e) =>
            setSelected(
              e.target.checked
                ? [...new Set([...selected, ...eligible.map((a) => a.id)])]
                : selected.filter((id) => !eligible.some((a) => a.id === id)),
            )
          }
        />
      ),
      align: 'center',
      width: 60,
      render: (a) => (
        <CommonInput
          type="checkbox"
          aria-label={`${a.name} 선택`}
          disabled={readOnly || busy || !!a.usages.length}
          checked={selected.includes(a.id) && !a.usages.length}
          onChange={(e) =>
            setSelected(
              e.target.checked
                ? [...selected, a.id]
                : selected.filter((id) => id !== a.id),
            )
          }
        />
      ),
    },
    {
      key: 'name',
      header: '원본 파일명',
      align: 'center',
      render: (a) => (
        <a
          className={c.filename}
          href={readOnly ? undefined : `/api/assets/${a.id}?download=1`}
          aria-disabled={readOnly || undefined}
          title={a.name}
        >
          {a.name}
        </a>
      ),
    },
    {
      key: 'size',
      header: '용량',
      align: 'center',
      width: 100,
      render: (a) => formatAssetSize(a.size),
    },
    {
      key: 'usage',
      header: '사용 여부',
      align: 'center',
      width: 100,
      render: (a) => (a.usages.length ? '사용 중' : '미사용'),
    },
    {
      key: 'source',
      header: '출처',
      align: 'center',
      width: 140,
      render: (a) =>
        a.usages.length ? (
          <div className={c.usages}>
            {a.usages.map((u, i) => (
              <span
                key={`${u.type}-${u.id}-${u.usage}-${i}`}
                title={`${u.type === 'project' ? '프로젝트' : '게시글'} · ${u.title}${u.deleted ? ' (삭제됨)' : ''} · ${u.usage === 'COVER' ? '대표 이미지' : u.usage === 'ATTACHMENT' ? '첨부' : '본문 이미지'}`}
              >
                {u.deleted ? (
                  <>{u.type === 'project' ? '프로젝트' : '게시글'} (삭제됨)</>
                ) : u.type === 'post' ? (
                  <a
                    href={readOnly ? undefined : `/admin/board/${u.id}`}
                    aria-disabled={readOnly || undefined}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label={`게시글 ${u.title} (새 탭에서 열기)`}
                  >
                    게시글
                  </a>
                ) : (
                  <a
                    href={
                      readOnly
                        ? undefined
                        : `/admin/projects?keyword=${encodeURIComponent(u.title)}`
                    }
                    aria-disabled={readOnly || undefined}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label={`프로젝트 ${u.title} (새 탭에서 열기)`}
                  >
                    프로젝트
                  </a>
                )}
              </span>
            ))}
          </div>
        ) : (
          '-'
        ),
    },
    {
      key: 'date',
      header: '등록일',
      align: 'center',
      width: 120,
      render: (a) => date.format(new Date(a.createdAt)),
    },
  ];
  return (
    <section>
      {readOnly && (
        <p className={s.notice}>
          미사용 파일을 포함한 파일 정보를 표시합니다. 원본 파일명과 파일명
          검색은 관리자에게만 제공하며, 다운로드·출처 이동·삭제도 관리자만
          사용할 수 있습니다.
        </p>
      )}
      <div className={c.stats}>
        <div>
          <span>전체 파일</span>
          <strong>{totals.total}개</strong>
          <small>{formatAssetSize(totals.size)}</small>
        </div>
        <div>
          <span>미사용 파일</span>
          <strong>{totals.unused}개</strong>
          <small>{formatAssetSize(totals.unusedSize)}</small>
        </div>
      </div>
      <CommonSearchPanel
        onSearch={() => {
          const url = '/admin/assets?' + new URLSearchParams(search);
          startSearch(() => {
            if (window.location.pathname + window.location.search === url)
              router.refresh();
            else router.push(url, { scroll: false });
          });
          setSelected([]);
          setPage(1);
        }}
        onReset={() => {
          setSearch(emptyAssetSearch);
          startSearch(() => {
            if (window.location.search)
              router.push('/admin/assets', { scroll: false });
            else router.refresh();
          });
          setSelected([]);
          setPage(1);
        }}
      >
        <label>
          <span>사용 여부</span>
          <CommonSelectBox
            aria-label="검색 사용 여부"
            value={search.filter}
            onValueChange={(filter) => setSearch({ ...search, filter })}
            options={[
              { value: 'all', label: '전체' },
              { value: 'used', label: '사용 중' },
              { value: 'unused', label: '미사용' },
            ]}
          />
        </label>
        <label>
          <span>정렬</span>
          <CommonSelectBox
            aria-label="검색 정렬"
            value={search.sort}
            onValueChange={(sort) => setSearch({ ...search, sort })}
            options={[
              { value: 'new', label: '최신순' },
              { value: 'old', label: '오래된 순' },
              { value: 'size', label: '용량 큰 순' },
            ]}
          />
        </label>
        <label className={s.searchKeyword}>
          <span>검색어</span>
          <CommonInput
            type="search"
            aria-label="파일명 검색"
            placeholder="원본 파일명"
            disabled={readOnly}
            value={search.keyword}
            onChange={(e) => setSearch({ ...search, keyword: e.target.value })}
          />
        </label>
      </CommonSearchPanel>
      <div className={s.listPanel}>
        <div className={s.heading}>
          <div>
            <h2>첨부파일 목록</h2>
            <p>DB에 등록된 업로드 파일 · 검색 결과 {filtered.length}개</p>
          </div>
          <CommonButton
            disabled={readOnly || !chosen.length || chosen.length > 100 || busy}
            onClick={() => setConfirm(true)}
          >
            삭제
          </CommonButton>
        </div>
        {message && <p role="status">{message}</p>}
        <CommonGrid
          rows={result.items}
          columns={columns}
          getRowKey={(a) => a.id}
          caption="첨부파일 목록"
          minWidth={850}
          wrapClassName={s.gridWrap}
          tableClassName={s.grid}
          fixedLayout
        />
        <CommonPagination
          page={result.page}
          totalPages={result.totalPages}
          total={filtered.length}
          pageSize={pageSize}
          onPageChange={setPage}
          onPageSizeChange={(v) => {
            setPageSize(v);
            setPage(1);
          }}
        />
        <p className={c.note}>
          미사용은 저장된 프로젝트·게시글과 연결이 없는 파일입니다. 편집 중인
          내용은 저장한 뒤 정리해 주세요. 한 번에 최대 100개까지 삭제할 수
          있습니다.
        </p>
      </div>
      <CommonConfirm
        open={confirm}
        title="첨부파일 삭제"
        content={`미사용 파일 ${chosen.length}개 (${totalSize(chosen)})를 NAS에서 영구 삭제할까요? 저장하지 않은 편집 내용에서 사용 중일 수 있으니 먼저 저장하거나 편집을 닫아 주세요.`}
        confirmLabel="삭제"
        onConfirm={remove}
        onCancel={() => setConfirm(false)}
      />
      <CommonLoading open={searching} />
    </section>
  );
}
