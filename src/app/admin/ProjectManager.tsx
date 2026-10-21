'use client';
import { Input } from '@/components/ui/Input';
import { TextArea } from '@/components/ui/TextArea';
import { SelectBox } from '@/components/ui/SelectBox';
import { Modal } from '@/components/ui/Modal';
import { SearchPanel } from '@/components/ui/SearchPanel';
import { Pagination } from '@/components/ui/Pagination';
import { emptyProjectSearch, matchesProject, paginate } from '@/lib/admin-list';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { Button } from '@/components/ui/Button';
import { RichTextEditor } from '@/components/ui/RichTextEditor';
import { RichTextView } from '@/components/ui/RichTextView';
import { ProjectDetailContent } from '@/components/ProjectDetailContent';
import type { ProjectDetailData } from '@/lib/project-detail';
import { FileUpload } from '@/components/ui/FileUpload';
import { thumbnailUrl } from '@/lib/files';
import {
  blankProject,
  type ProjectForm,
  type ProjectCode,
  type ProjectCopy,
} from '@/lib/project-form';
import s from './admin.module.css';
const states = [
  ['', '미지정'],
  ['IDEA', '구상 중'],
  ['BUILDING', '개발 중'],
  ['TESTING', '테스트 중'],
  ['RELEASED', '운영 중'],
  ['ARCHIVED', '종료'],
];
export function ProjectManager({
  projects,
  codes,
}: {
  projects: ProjectForm[];
  codes: ProjectCode[];
}) {
  const router = useRouter();
  const [search, setSearch] = useState(emptyProjectSearch);
  const [appliedSearch, setAppliedSearch] = useState(emptyProjectSearch);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  // shortcut: 현재 개발 목록은 소량이므로 클라이언트 검색/페이징, 운영 목록 연결 시 서버 조회로 전환.
  const filtered = projects.filter((project) =>
    matchesProject(project, appliedSearch),
  );
  const result = paginate(filtered, page, pageSize);
  const [uploads, setUploads] = useState(0);
  const uploadBusy = (busy: boolean) =>
    setUploads((count) => Math.max(0, count + (busy ? 1 : -1)));
  const [mode, setMode] = useState<'create' | 'edit'>('create');
  const [draft, setDraft] = useState<ProjectForm | null>(null);
  const [locale, setLocale] = useState<'ko' | 'en'>('ko');
  const [message, setMessage] = useState('');
  const [saving, setSaving] = useState(false);
  const [preview, setPreview] = useState(false);
  const [selected, setSelected] = useState<string[]>([]);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const selectedProjects = projects.filter((project) =>
    selected.includes(project.id),
  );
  const dateFormat = new Intl.DateTimeFormat('ko-KR', {
    timeZone: 'Asia/Seoul',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
  });
  const change = (patch: Partial<ProjectForm>) =>
    setDraft((current) => (current ? { ...current, ...patch } : current));
  const copy = (patch: Partial<ProjectCopy>) =>
    setDraft((current) =>
      current
        ? {
            ...current,
            translations: {
              ...current.translations,
              [locale]: { ...current.translations[locale], ...patch },
            },
          }
        : current,
    );
  const options = (group: string) =>
    codes
      .filter((c) => c.groupKey === group)
      .map((c) => ({
        value: c.code,
        label: c.nameKo + (!c.isActive ? ' (비활성)' : ''),
        disabled: !c.isActive,
      }));
  const openProject = (project: ProjectForm) => {
    setDraft(structuredClone(project));
    setMode('edit');
    setLocale('ko');
    setMessage('');
  };
  const contentLocale =
    locale === 'en' && !draft?.translations.en.title ? 'ko' : locale;
  const previewData: ProjectDetailData | null = draft
    ? {
        ...draft.translations[contentLocale],
        thumbnail: thumbnailUrl(draft.thumbnail) ? draft.thumbnail : null,
        customerName: draft.customerName,
        originLabel:
          options('PROJECT_ORIGIN').find(
            (code) => code.value === draft.originCode,
          )?.label || '',
        typeLabel:
          options('PROJECT_TYPE').find((code) => code.value === draft.typeCode)
            ?.label || '',
        statusLabel:
          states.find(([value]) => value === draft.lifecycle)?.[1] || '',
        technologies: draft.technologies,
        tags: draft.tags,
        attachments: (draft.files || []).filter((file) =>
          draft.attachmentIds.includes(file.id),
        ),
        contentLocale,
        placeholder: draft.placeholder,
      }
    : null;
  return (
    <section>
      <SearchPanel
        onSearch={() => {
          setAppliedSearch({ ...search });
          setPage(1);
          setSelected([]);
        }}
        onReset={() => {
          setSearch(emptyProjectSearch);
          setAppliedSearch(emptyProjectSearch);
          setPage(1);
        }}
      >
        <label>
          검색어
          <Input
            type="search"
            value={search.keyword}
            placeholder="프로젝트명·고객사·기술·태그"
            onChange={(event) =>
              setSearch({ ...search, keyword: event.target.value })
            }
          />
        </label>
        <label>
          작업 구분
          <SelectBox
            aria-label="검색 작업 구분"
            value={search.originCode}
            onValueChange={(originCode) => setSearch({ ...search, originCode })}
            options={[
              { value: '', label: '전체' },
              ...options('PROJECT_ORIGIN').map((option) => ({
                ...option,
                disabled: false,
              })),
            ]}
          />
        </label>
        <label>
          프로젝트 유형
          <SelectBox
            aria-label="검색 프로젝트 유형"
            value={search.typeCode}
            onValueChange={(typeCode) => setSearch({ ...search, typeCode })}
            options={[
              { value: '', label: '전체' },
              { value: '__unset__', label: '미지정' },
              ...options('PROJECT_TYPE').map((option) => ({
                ...option,
                disabled: false,
              })),
            ]}
          />
        </label>
        <label>
          진행 상태
          <SelectBox
            aria-label="검색 진행 상태"
            value={search.lifecycle}
            onValueChange={(lifecycle) => setSearch({ ...search, lifecycle })}
            options={[
              { value: '', label: '전체' },
              ...states.map(([value, label]) => ({
                value: value || '__unset__',
                label,
              })),
            ]}
          />
        </label>
        <label>
          공개 범위
          <SelectBox
            aria-label="검색 공개 범위"
            value={search.visibility}
            onValueChange={(visibility) => setSearch({ ...search, visibility })}
            options={[
              { value: '', label: '전체' },
              { value: 'PUBLIC', label: '공개' },
              { value: 'PRIVATE', label: '비공개' },
            ]}
          />
        </label>
      </SearchPanel>
      <div className={s.heading}>
        <p aria-live="polite">
          전체 {projects.length}건 · 검색 결과 {filtered.length}건
        </p>
        <div className={s.actions}>
          <Button
            variant="primary"
            disabled={saving || uploads > 0}
            onClick={() => {
              setDraft(blankProject());
              setMode('create');
              setLocale('ko');
              setMessage('');
            }}
          >
            등록
          </Button>
          <Button
            disabled={selectedProjects.length === 0 || saving || uploads > 0}
            onClick={() => {
              setMessage('');
              setConfirmDelete(true);
            }}
          >
            삭제
            {selectedProjects.length > 0
              ? ' (' + selectedProjects.length + ')'
              : ''}
          </Button>
        </div>
      </div>
      {!draft && message && (
        <p role="status" className={s.notice}>
          {message}
        </p>
      )}
      {draft && (
        <Modal
          open
          title={mode === 'create' ? '프로젝트 등록' : '프로젝트 수정'}
          onClose={() => {
            if (!saving && !uploads) setDraft(null);
          }}
          actions={
            <>
              <Button
                key="preview"
                disabled={saving || uploads > 0}
                onClick={() => setPreview(true)}
              >
                미리보기
              </Button>
              <Button
                key="save"
                type="submit"
                form="project-editor-form"
                variant="primary"
                disabled={saving || uploads > 0}
              >
                {saving ? '저장 중…' : '저장'}
              </Button>
              <Button
                disabled={saving || uploads > 0}
                onClick={() => setDraft(null)}
              >
                취소
              </Button>
            </>
          }
        >
          <form
            id="project-editor-form"
            className={s.projectForm}
            onSubmit={async (event) => {
              event.preventDefault();
              setSaving(true);
              setMessage('저장 중…');
              try {
                const response = await fetch('/api/admin/projects', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify(draft),
                });
                const result: unknown = await response.json();
                if (!response.ok)
                  throw Error(
                    result &&
                      typeof result === 'object' &&
                      'message' in result &&
                      typeof result.message === 'string'
                      ? result.message
                      : '저장하지 못했습니다.',
                  );
                setDraft(null);
                setMessage('개발 DB에 저장했습니다.');
                router.refresh();
              } catch (error) {
                setMessage(
                  error instanceof Error
                    ? error.message
                    : '저장하지 못했습니다.',
                );
              } finally {
                setSaving(false);
              }
            }}
          >
            <p role="status" className={s.notice}>
              {message}
            </p>
            <fieldset
              disabled={saving || uploads > 0}
              className={s.editorFields}
            >
              <div className={s.fields}>
                <label>
                  고객사
                  <Input
                    maxLength={200}
                    value={draft.customerName}
                    onChange={(event) =>
                      change({ customerName: event.target.value })
                    }
                    placeholder="고객사명 (선택)"
                  />
                </label>
                <label>
                  주소(slug)
                  <Input
                    required
                    maxLength={80}
                    pattern="[a-z0-9]+(-[a-z0-9]+)*"
                    value={draft.slug}
                    onChange={(e) => change({ slug: e.target.value })}
                  />
                </label>
                <label>
                  작업 구분
                  <SelectBox
                    aria-label="작업 구분"
                    value={draft.originCode}
                    required
                    onValueChange={(originCode) => change({ originCode })}
                    options={options('PROJECT_ORIGIN')}
                  />
                </label>
                <label>
                  프로젝트 유형
                  <SelectBox
                    aria-label="프로젝트 유형"
                    value={draft.typeCode}
                    onValueChange={(typeCode) => change({ typeCode })}
                    options={[
                      { value: '', label: '미지정' },
                      ...options('PROJECT_TYPE'),
                    ]}
                  />
                </label>
                <label>
                  진행 상태
                  <SelectBox
                    aria-label="진행 상태"
                    value={draft.lifecycle}
                    onValueChange={(lifecycle) => change({ lifecycle })}
                    options={states.map(([value, label]) => ({
                      value,
                      label,
                    }))}
                  />
                </label>
                <label>
                  공개 범위
                  <SelectBox
                    aria-label="공개 범위"
                    value={draft.visibility}
                    onValueChange={(visibility) =>
                      change({
                        visibility:
                          visibility === 'PUBLIC' ? 'PUBLIC' : 'PRIVATE',
                      })
                    }
                    options={[
                      { value: 'PRIVATE', label: '비공개' },
                      { value: 'PUBLIC', label: '공개' },
                    ]}
                  />
                </label>
                <label>
                  표시 순서
                  <Input
                    type="number"
                    min={0}
                    max={100000}
                    required
                    value={draft.position}
                    onChange={(e) =>
                      change({ position: Number(e.target.value) })
                    }
                  />
                </label>
                <label>
                  사용 기술
                  <Input
                    value={draft.technologies.join(', ')}
                    placeholder="React, Next.js, PostgreSQL"
                    onChange={(e) =>
                      change({
                        technologies: e.target.value
                          .split(',')
                          .map((value) => value.trim()),
                      })
                    }
                  />
                  <small>쉼표로 구분 · 기술 태그로 저장</small>
                </label>
                <label>
                  태그
                  <Input
                    value={draft.tags.join(', ')}
                    placeholder="포트폴리오, 개인 프로젝트"
                    onChange={(e) =>
                      change({
                        tags: e.target.value
                          .split(',')
                          .map((value) => value.trim()),
                      })
                    }
                  />
                  <small>쉼표로 구분 · 주제 태그로 저장</small>
                </label>
              </div>
              <label className={s.checkLabel}>
                <Input
                  type="checkbox"
                  checked={draft.placeholder}
                  onChange={(e) => change({ placeholder: e.target.checked })}
                />
                임시 데이터 안내 표시
              </label>
              <div className={s.actions} role="group" aria-label="편집 언어">
                <Button
                  aria-pressed={locale === 'ko'}
                  variant={locale === 'ko' ? 'primary' : 'neutral'}
                  onClick={() => setLocale('ko')}
                >
                  한국어
                </Button>
                <Button
                  aria-pressed={locale === 'en'}
                  variant={locale === 'en' ? 'primary' : 'neutral'}
                  onClick={() => setLocale('en')}
                >
                  English
                </Button>
              </div>
              <p>
                {locale === 'ko'
                  ? '한국어 제목은 필수입니다.'
                  : '영어 제목을 비우고 저장하면 영어 번역을 제거하고 한국어 원문을 표시합니다.'}
              </p>
              <label>
                {locale === 'ko' ? '한국어 제목' : '영어 제목'}
                <Input
                  required={locale === 'ko'}
                  maxLength={200}
                  value={draft.translations[locale].title}
                  onChange={(e) => copy({ title: e.target.value })}
                />
              </label>
              <label>
                한 줄 소개
                <TextArea
                  rows={3}
                  maxLength={4000}
                  value={draft.translations[locale].summary}
                  onChange={(e) => copy({ summary: e.target.value })}
                />
              </label>
              <label htmlFor="project-introduction">프로젝트 소개</label>
              <RichTextEditor
                key={draft.id + locale}
                id="project-introduction"
                label="프로젝트 소개"
                disabled={saving || uploads > 0}
                onUploadBusyChange={uploadBusy}
                value={draft.translations[locale].body}
                onChange={(body) => copy({ body })}
              />
              <details>
                <summary>소개 미리보기</summary>
                <RichTextView value={draft.translations[locale].body} />
              </details>
              <label>
                썸네일 URL
                <Input
                  value={draft.thumbnail}
                  placeholder="https://… 또는 이미지 업로드"
                  onChange={(e) => change({ thumbnail: e.target.value })}
                />
              </label>
              <FileUpload
                label="썸네일 이미지 업로드"
                onBusyChange={uploadBusy}
                imagesOnly
                onUploaded={(asset) => change({ thumbnail: asset.url })}
              />
              {draft.thumbnail && thumbnailUrl(draft.thumbnail) && (
                <Image
                  unoptimized
                  src={draft.thumbnail}
                  alt="썸네일 미리보기"
                  width={640}
                  height={360}
                  style={{
                    maxWidth: '100%',
                    height: 'auto',
                    maxHeight: 240,
                    objectFit: 'contain',
                  }}
                />
              )}
              <FileUpload
                label="첨부파일 업로드"
                onBusyChange={uploadBusy}
                onUploaded={(asset) =>
                  change({
                    attachmentIds: [...draft.attachmentIds, asset.id],
                    files: [...(draft.files ?? []), asset],
                  })
                }
              />
              <ul>
                {draft.attachmentIds.map((id) => (
                  <li key={id}>
                    <a
                      className="textLink"
                      href={'/api/assets/' + id + '?download=1'}
                    >
                      {draft.files?.find((file) => file.id === id)?.name ??
                        '첨부파일 다운로드'}
                    </a>{' '}
                    <Button
                      size="sm"
                      onClick={() =>
                        change({
                          attachmentIds: draft.attachmentIds.filter(
                            (value) => value !== id,
                          ),
                        })
                      }
                    >
                      연결 해제
                    </Button>
                  </li>
                ))}
              </ul>
              <p>
                파일은 NAS에 저장됩니다. 저장 시 본문 이미지·썸네일·첨부 연결도
                반영되며, 연결 해제는 원본 파일을 삭제하지 않습니다.
              </p>
            </fieldset>
          </form>
        </Modal>
      )}
      {preview && previewData && (
        <Modal
          open
          title="프로젝트 미리보기"
          onClose={() => setPreview(false)}
          actions={<Button onClick={() => setPreview(false)}>닫기</Button>}
        >
          <ProjectDetailContent project={previewData} locale={locale} />
        </Modal>
      )}
      {confirmDelete && (
        <Modal
          open
          title="프로젝트 삭제"
          onClose={() => {
            if (!saving) setConfirmDelete(false);
          }}
          actions={
            <>
              <Button
                variant="primary"
                disabled={saving}
                onClick={async () => {
                  setSaving(true);
                  setMessage('');
                  try {
                    const response = await fetch('/api/admin/projects', {
                      method: 'DELETE',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify(
                        selectedProjects.map((project) => ({
                          id: project.id,
                          version: project.version,
                        })),
                      ),
                    });
                    const result: unknown = await response.json();
                    if (!response.ok)
                      throw Error(
                        result &&
                          typeof result === 'object' &&
                          'message' in result &&
                          typeof result.message === 'string'
                          ? result.message
                          : '삭제하지 못했습니다.',
                      );
                    setSelected([]);
                    setConfirmDelete(false);
                    setMessage('선택한 프로젝트를 삭제했습니다.');
                    router.refresh();
                  } catch (error) {
                    setMessage(
                      error instanceof Error
                        ? error.message
                        : '삭제하지 못했습니다.',
                    );
                  } finally {
                    setSaving(false);
                  }
                }}
              >
                {saving ? '삭제 중…' : '삭제'}
              </Button>
              <Button disabled={saving} onClick={() => setConfirmDelete(false)}>
                취소
              </Button>
            </>
          }
        >
          <p>선택한 {selectedProjects.length}개 프로젝트를 삭제하시겠습니까?</p>
          <p>
            목록과 사용자 화면에서 제외되며 원본 데이터와 NAS 파일은 보존됩니다.
          </p>
          <ul>
            {selectedProjects.map((project) => (
              <li key={project.id}>{project.translations.ko.title}</li>
            ))}
          </ul>
          {message && <p role="alert">{message}</p>}
        </Modal>
      )}
      <div className={s.gridWrap}>
        <table className={s.grid + ' ' + s.projectGrid}>
          <caption className="srOnly">
            프로젝트 목록 · 행을 더블클릭하거나 프로젝트명을 눌러 수정합니다.
          </caption>
          <thead>
            <tr>
              <th>
                <Input
                  type="checkbox"
                  aria-label="현재 페이지 전체 선택"
                  checked={
                    result.items.length > 0 &&
                    result.items.every((project) =>
                      selected.includes(project.id),
                    )
                  }
                  ref={(input) => {
                    if (input)
                      input.indeterminate =
                        result.items.some((project) =>
                          selected.includes(project.id),
                        ) &&
                        !result.items.every((project) =>
                          selected.includes(project.id),
                        );
                  }}
                  onChange={(event) =>
                    setSelected(
                      event.target.checked
                        ? [
                            ...new Set([
                              ...selected,
                              ...result.items.map((project) => project.id),
                            ]),
                          ]
                        : selected.filter(
                            (id) =>
                              !result.items.some(
                                (project) => project.id === id,
                              ),
                          ),
                    )
                  }
                />
              </th>
              <th>프로젝트명</th>
              <th>고객사</th>
              <th>작업 구분</th>
              <th>유형</th>
              <th>진행 상태</th>
              <th>수정일시</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 && (
              <tr>
                <td colSpan={7} className={s.empty}>
                  검색 결과가 없습니다.
                </td>
              </tr>
            )}
            {result.items.map((project) => (
              <tr
                key={project.id}
                onDoubleClick={(event) => {
                  if (
                    !(event.target instanceof Element) ||
                    !event.target.closest('button,input,a')
                  )
                    openProject(project);
                }}
              >
                <td>
                  <Input
                    type="checkbox"
                    aria-label={project.translations.ko.title + ' 선택'}
                    checked={selected.includes(project.id)}
                    onChange={(event) =>
                      setSelected(
                        event.target.checked
                          ? [...selected, project.id]
                          : selected.filter((id) => id !== project.id),
                      )
                    }
                  />
                </td>
                <td>
                  <button
                    className={s.projectName}
                    onClick={() => openProject(project)}
                  >
                    <strong>{project.translations.ko.title}</strong>
                  </button>
                </td>
                <td>{project.customerName || '미입력'}</td>
                <td>
                  {
                    options('PROJECT_ORIGIN').find(
                      (code) => code.value === project.originCode,
                    )?.label
                  }
                </td>
                <td>
                  {options('PROJECT_TYPE').find(
                    (code) => code.value === project.typeCode,
                  )?.label || '미지정'}
                </td>
                <td>
                  {states.find(([value]) => value === project.lifecycle)?.[1]}
                </td>
                <td>
                  {project.updatedAt
                    ? dateFormat.format(new Date(project.updatedAt))
                    : '—'}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <Pagination
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
