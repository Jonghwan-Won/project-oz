'use client';
import { CommonTextArea } from '@/components/ui/CommonTextArea';
import { CommonSelectBox } from '@/components/ui/CommonSelectBox';
import { CommonInput } from '@/components/ui/CommonInput';
import { CommonSearchPanel } from '@/components/ui/CommonSearchPanel';
import { CommonPagination } from '@/components/ui/CommonPagination';
import { emptyBoardSearch, matchesBoard, paginate } from '@/lib/admin-list';

import Image from 'next/image';

import { CommonFileUpload } from '@/components/ui/CommonFileUpload';
import { CommonAssetLinks } from '@/components/ui/CommonAssetLinks';
import { thumbnailUrl, type UploadedAsset } from '@/lib/files';
import type { JSONContent } from '@tiptap/core';
import { CommonRichTextEditor } from '@/components/ui/CommonRichTextEditor';
import { CommonRichTextView } from '@/components/ui/CommonRichTextView';
import { textDocument } from '@/lib/rich-text';
import { useState } from 'react';
import { CommonButton } from '@/components/ui/CommonButton';
import s from './admin.module.css';

type Entry = {
  id: string;
  title: string;
  slug: string;
  summary: string;
  introduction?: JSONContent;
  body: string;
  category: string;
  status: string;
  thumbnail: string;
  attachments?: UploadedAsset[];
};
const empty: Entry = {
  id: '',
  title: '',
  slug: '',
  summary: '',
  body: '',
  category: '',
  status: '비공개',
  thumbnail: '',
};

export function AdminEditor({
  section,
  initialEntries,
}: {
  section: 'projects' | 'board';
  initialEntries: Entry[];
}) {
  const [entries, setEntries] = useState(initialEntries);
  const [search, setSearch] = useState(emptyBoardSearch);
  const [appliedSearch, setAppliedSearch] = useState(emptyBoardSearch);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const filtered = entries.filter((entry) =>
    matchesBoard(entry, appliedSearch),
  );
  const result = paginate(filtered, page, pageSize);
  const [draft, setDraft] = useState<Entry | null>(null);
  const [message, setMessage] = useState('');
  const isProject = section === 'projects';
  const label = isProject ? '프로젝트' : '게시글';

  return (
    <section>
      <CommonSearchPanel
        onSearch={() => {
          setAppliedSearch({ ...search });
          setPage(1);
        }}
        onReset={() => {
          setSearch(emptyBoardSearch);
          setAppliedSearch(emptyBoardSearch);
          setPage(1);
        }}
      >
        <label>
          검색어
          <CommonInput
            type="search"
            value={search.keyword}
            placeholder="제목·주소·본문"
            onChange={(event) =>
              setSearch({ ...search, keyword: event.target.value })
            }
          />
        </label>
        <label>
          카테고리
          <CommonSelectBox
            aria-label="검색 카테고리"
            value={search.category}
            onValueChange={(category) => setSearch({ ...search, category })}
            options={[
              { value: '', label: '전체' },
              ...Array.from(new Set(entries.map((entry) => entry.category)))
                .sort()
                .map((value) => ({ value, label: value })),
            ]}
          />
        </label>
        <label>
          공개 범위
          <CommonSelectBox
            aria-label="검색 공개 범위"
            value={search.status}
            onValueChange={(status) => setSearch({ ...search, status })}
            options={[
              { value: '', label: '전체' },
              { value: '공개', label: '공개' },
              { value: '비공개', label: '비공개' },
            ]}
          />
        </label>
      </CommonSearchPanel>
      <div className={s.heading}>
        <div>
          <p aria-live="polite">
            전체 {entries.length}건 · 검색 결과 {filtered.length}건 · 화면
            확인용 데이터
          </p>
        </div>
        <CommonButton
          variant="primary"
          onClick={() => {
            setDraft({ ...empty });
            setMessage('');
          }}
        >
          {label} 등록
        </CommonButton>
      </div>
      {message && (
        <p role="status" className={s.notice}>
          {message}
        </p>
      )}
      {draft && (
        <form
          className={s.panel}
          onSubmit={(event) => {
            event.preventDefault();
            if (!draft.title.trim() || !draft.category.trim()) {
              setMessage('제목과 분류를 입력해 주세요.');
              return;
            }
            if (
              entries.some(
                (entry) => entry.slug === draft.slug && entry.id !== draft.id,
              )
            ) {
              setMessage(
                '이미 사용 중인 주소입니다. 다른 주소를 입력해 주세요.',
              );
              return;
            }
            if (!thumbnailUrl(draft.thumbnail)) {
              setMessage(
                '썸네일은 http(s) URL 또는 사이트 내부 경로로 입력해 주세요.',
              );
              return;
            }
            const saved = {
              ...draft,
              title: draft.title.trim(),
              category: draft.category.trim(),
              id: draft.id || crypto.randomUUID(),
            };
            setEntries(
              draft.id
                ? entries.map((entry) =>
                    entry.id === draft.id ? saved : entry,
                  )
                : [...entries, saved],
            );
            setDraft(null);
            setMessage(
              '현재 화면에 임시 반영했습니다. 실제 사이트와 DB에는 저장되지 않습니다.',
            );
          }}
        >
          <h3>
            {label} {draft.id ? '수정' : '등록'}
          </h3>
          <div className={s.fields}>
            <label>
              제목
              <CommonInput
                required
                maxLength={120}
                value={draft.title}
                onChange={(event) =>
                  setDraft({ ...draft, title: event.target.value })
                }
              />
            </label>
            <label>
              주소(slug)
              <CommonInput
                required
                pattern="[a-z0-9]+(-[a-z0-9]+)*"
                maxLength={80}
                title="영문 소문자·숫자와 단어 사이 하이픈을 사용하세요."
                value={draft.slug}
                onChange={(event) =>
                  setDraft({ ...draft, slug: event.target.value })
                }
              />
            </label>
            <label>
              {isProject ? '작업 구분' : '게시판 카테고리'}
              <CommonInput
                required
                maxLength={40}
                value={draft.category}
                onChange={(event) =>
                  setDraft({ ...draft, category: event.target.value })
                }
              />
            </label>
            <label>
              공개 범위
              <CommonSelectBox
                aria-label="공개 범위"
                value={draft.status}
                onValueChange={(status) => setDraft({ ...draft, status })}
                options={['비공개', '공개'].map((value) => ({
                  value,
                  label: value,
                }))}
              />
            </label>
          </div>
          {isProject ? (
            <div>
              <label htmlFor="project-introduction">프로젝트 소개</label>
              <CommonRichTextEditor
                key={draft.id || 'new'}
                id="project-introduction"
                label="프로젝트 소개"
                value={draft.introduction ?? textDocument(draft.summary)}
                onChange={(introduction, summary) =>
                  setDraft((current) =>
                    current ? { ...current, introduction, summary } : current,
                  )
                }
              />
              <details>
                <summary>소개 미리보기</summary>
                <CommonRichTextView
                  value={draft.introduction ?? textDocument(draft.summary)}
                />
              </details>
            </div>
          ) : (
            <label>
              게시글 요약
              <CommonTextArea
                rows={4}
                maxLength={2000}
                value={draft.summary}
                onChange={(event) =>
                  setDraft({ ...draft, summary: event.target.value })
                }
              />
            </label>
          )}
          {!isProject && (
            <label>
              게시글 본문
              <CommonTextArea
                rows={8}
                maxLength={50000}
                value={draft.body}
                onChange={(event) =>
                  setDraft({ ...draft, body: event.target.value })
                }
              />
            </label>
          )}
          {isProject && (
            <div>
              <label>
                썸네일 URL(선택)
                <CommonInput
                  placeholder="https://example.com/thumbnail.webp 또는 /api/assets/파일ID"
                  value={draft.thumbnail}
                  onChange={(event) =>
                    setDraft({ ...draft, thumbnail: event.target.value })
                  }
                />
              </label>
              <CommonFileUpload
                label="썸네일 이미지 업로드"
                imagesOnly
                onUploaded={(asset) =>
                  setDraft((current) =>
                    current
                      ? {
                          ...current,
                          thumbnail: asset.url,
                          attachments: [
                            ...(current.attachments ?? []).filter(
                              (item) => item.id !== asset.id,
                            ),
                            asset,
                          ],
                        }
                      : current,
                  )
                }
              />
              {draft.thumbnail && thumbnailUrl(draft.thumbnail) && (
                <Image
                  unoptimized
                  src={draft.thumbnail}
                  alt="선택한 썸네일 미리보기"
                  width={640}
                  height={360}
                  style={{
                    width: '100%',
                    height: 'auto',
                    maxHeight: 260,
                    objectFit: 'contain',
                  }}
                  referrerPolicy="no-referrer"
                />
              )}
              <CommonFileUpload
                label="첨부파일 업로드"
                onUploaded={(asset) =>
                  setDraft((current) =>
                    current
                      ? {
                          ...current,
                          attachments: [...(current.attachments ?? []), asset],
                        }
                      : current,
                  )
                }
              />
              <CommonAssetLinks assets={draft.attachments ?? []} />
              <p>
                파일은 NAS에 저장됩니다. 프로젝트와의 연결은 현재 화면에서만
                유지됩니다. 취소하거나 새로고침해도 업로드한 파일은 NAS에
                남습니다.
              </p>
            </div>
          )}
          <div className={s.actions}>
            <CommonButton type="submit">화면에 임시 반영</CommonButton>
            <CommonButton variant="ghost" onClick={() => setDraft(null)}>
              취소
            </CommonButton>
          </div>
        </form>
      )}
      <div className={s.gridWrap}>
        <table className={s.grid}>
          <caption className="srOnly">게시글 목록</caption>
          <thead>
            <tr>
              <th>번호</th>
              <th>제목</th>
              <th>카테고리</th>
              <th>공개 범위</th>
              <th>관리</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 && (
              <tr>
                <td colSpan={5} className={s.empty}>
                  검색 결과가 없습니다.
                </td>
              </tr>
            )}
            {result.items.map((entry, index) => (
              <tr key={entry.id}>
                <td>{(result.page - 1) * pageSize + index + 1}</td>
                <td>
                  <strong>{entry.title}</strong>
                  <small>/board/{entry.slug}</small>
                </td>
                <td>{entry.category}</td>
                <td>{entry.status}</td>
                <td>
                  <CommonButton
                    size="sm"
                    aria-label={`${entry.title} 수정`}
                    onClick={() => {
                      setDraft({ ...entry });
                      setMessage('');
                    }}
                  >
                    수정
                  </CommonButton>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
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
    </section>
  );
}
