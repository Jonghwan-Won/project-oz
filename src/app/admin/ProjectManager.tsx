'use client';
import { CommonInput } from '@/components/ui/CommonInput';
import { TagsInput } from '@mantine/core';
import { CommonTextArea } from '@/components/ui/CommonTextArea';
import { CommonSelectBox } from '@/components/ui/CommonSelectBox';
import { CommonModal } from '@/components/ui/CommonModal';
import { CommonConfirm } from '@/components/ui/CommonConfirm';
import { CommonAlert } from '@/components/ui/CommonAlert';
import { CommonLoading } from '@/components/ui/CommonLoading';
import { CommonSearchPanel } from '@/components/ui/CommonSearchPanel';
import { CommonPagination } from '@/components/ui/CommonPagination';
import { emptyProjectSearch, matchesProject, paginate } from '@/lib/admin-list';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { CommonButton } from '@/components/ui/CommonButton';
import { CommonRichTextEditor } from '@/components/ui/CommonRichTextEditor';
import { CommonRichTextView } from '@/components/ui/CommonRichTextView';
import { ProjectDetailContent } from '@/components/ProjectDetailContent';
import {
  formatProjectPeriod,
  type ProjectDetailData,
} from '@/lib/project-detail';
import { CommonFileUpload } from '@/components/ui/CommonFileUpload';
import { thumbnailUrl } from '@/lib/files';
import {
  blankProject,
  type ProjectForm,
  type ProjectCode,
  type ProjectCopy,
} from '@/lib/project-form';
import s from './admin.module.css';
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
  const [confirmSave, setConfirmSave] = useState(false);
  const [saveAlert, setSaveAlert] = useState<{
    content: string;
    variant: 'default' | 'error';
    closeDraftOnClose: boolean;
  } | null>(null);
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
  async function saveProject() {
    if (!draft) return;
    setSaving(true);
    setMessage('');
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
      setSaveAlert({
        content: '저장되었습니다.',
        variant: 'default',
        closeDraftOnClose: true,
      });
    } catch (error) {
      setSaveAlert({
        content:
          error instanceof Error ? error.message : '저장하지 못했습니다.',
        variant: 'error',
        closeDraftOnClose: false,
      });
    } finally {
      setSaving(false);
    }
  }
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
        period: formatProjectPeriod(draft.startedOn, draft.endedOn, locale),
        originLabel:
          options('PROJECT_ORIGIN').find(
            (code) => code.value === draft.originCode,
          )?.label || '',
        typeLabel:
          options('PROJECT_TYPE').find((code) => code.value === draft.typeCode)
            ?.label || '',
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
      <CommonSearchPanel
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
          <CommonInput
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
          <CommonSelectBox
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
          <CommonSelectBox
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
          공개 범위
          <CommonSelectBox
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
      </CommonSearchPanel>
      <div className={s.listPanel}>
        <div className={s.heading}>
          <p aria-live="polite">
            전체 {projects.length}건 · 검색 결과 {filtered.length}건
          </p>
          <div className={s.actions}>
            <CommonButton
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
            </CommonButton>
            <CommonButton
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
            </CommonButton>
          </div>
        </div>
        {!draft && message && (
          <p role="status" className={s.notice}>
            {message}
          </p>
        )}
      {draft && (
        <CommonModal
          open
          title={mode === 'create' ? '프로젝트 등록' : '프로젝트 수정'}
          onClose={() => {
            if (!saving && !uploads) setDraft(null);
          }}
          actions={
            <>
              <CommonButton
                key="preview"
                disabled={saving || uploads > 0}
                onClick={() => setPreview(true)}
                size="sm"
              >
                미리보기
              </CommonButton>
              <CommonButton
                key="save"
                type="submit"
                form="project-editor-form"
                variant="primary"
                className={s.adminPrimary}
                disabled={saving || uploads > 0}
                size="sm"
              >
                저장
              </CommonButton>
              <CommonButton
                disabled={saving || uploads > 0}
                onClick={() => setDraft(null)}
              >
                취소
              </CommonButton>
            </>
          }
        >
          <form
            id="project-editor-form"
            className={s.projectForm}
            onSubmit={async (event) => {
              event.preventDefault();
              if (!saving && uploads === 0) setConfirmSave(true);
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
                  <CommonInput
                    maxLength={200}
                    value={draft.customerName}
                    onChange={(event) =>
                      change({ customerName: event.target.value })
                    }
                    placeholder="고객사명 (선택)"
                  />
                </label>
                <label>
                  시작일
                  <CommonInput
                    type="date"
                    value={draft.startedOn}
                    onChange={(event) =>
                      change({ startedOn: event.target.value })
                    }
                  />
                </label>
                <label>
                  종료일
                  <CommonInput
                    type="date"
                    value={draft.endedOn}
                    onChange={(event) =>
                      change({ endedOn: event.target.value })
                    }
                  />
                </label>
                <label>
                  주소(slug)
                  <CommonInput
                    required
                    maxLength={80}
                    pattern="[a-z0-9]+(-[a-z0-9]+)*"
                    value={draft.slug}
                    onChange={(e) => change({ slug: e.target.value })}
                  />
                </label>
                <label>
                  작업 구분
                  <CommonSelectBox
                    aria-label="작업 구분"
                    value={draft.originCode}
                    required
                    onValueChange={(originCode) => change({ originCode })}
                    options={options('PROJECT_ORIGIN')}
                  />
                </label>
                <label>
                  프로젝트 유형
                  <CommonSelectBox
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
                  공개 범위
                  <CommonSelectBox
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
                  <CommonInput
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
                  <TagsInput
                    placeholder="기술 검색"
                    data={codes
                      .filter(
                        (code) =>
                          code.groupKey === 'TECHNOLOGY' && code.isActive,
                      )
                      .map((code) => code.nameKo)}
                    value={draft.technologies}
                    onChange={(values) => {
                      const allowed = new Set(
                        codes
                          .filter(
                            (code) =>
                              code.groupKey === 'TECHNOLOGY' && code.isActive,
                          )
                          .map((code) => code.nameKo),
                      );
                      change({
                        technologies: values.filter((value) =>
                          allowed.has(value),
                        ),
                      });
                    }}
                    splitChars={[',']}
                  />
                </label>
                <label>
                  태그
                  <TagsInput
                    value={draft.tags}
                    onChange={(tags) => change({ tags })}
                    placeholder="태그를 입력하고 Enter"
                    splitChars={[',']}
                  />
                </label>
              </div>
              <label className={s.checkLabel}>
                <CommonInput
                  type="checkbox"
                  checked={draft.placeholder}
                  onChange={(e) => change({ placeholder: e.target.checked })}
                />
                임시 데이터 안내 표시
              </label>
              <div className={s.actions} role="group" aria-label="편집 언어">
                <CommonButton
                  aria-pressed={locale === 'ko'}
                  variant={locale === 'ko' ? 'primary' : 'neutral'}
                  onClick={() => setLocale('ko')}
                >
                  한국어
                </CommonButton>
                <CommonButton
                  aria-pressed={locale === 'en'}
                  variant={locale === 'en' ? 'primary' : 'neutral'}
                  onClick={() => setLocale('en')}
                >
                  English
                </CommonButton>
              </div>
              <p>
                {locale === 'ko'
                  ? '한국어 제목은 필수입니다.'
                  : '영어 제목을 비우고 저장하면 영어 번역을 제거하고 한국어 원문을 표시합니다.'}
              </p>
              <label>
                {locale === 'ko' ? '한국어 제목' : '영어 제목'}
                <CommonInput
                  required={locale === 'ko'}
                  maxLength={200}
                  value={draft.translations[locale].title}
                  onChange={(e) => copy({ title: e.target.value })}
                />
              </label>
              <label>
                한 줄 소개
                <CommonTextArea
                  rows={3}
                  maxLength={4000}
                  value={draft.translations[locale].summary}
                  onChange={(e) => copy({ summary: e.target.value })}
                />
              </label>
              <label htmlFor="project-introduction">프로젝트 소개</label>
              <CommonRichTextEditor
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
                <CommonRichTextView value={draft.translations[locale].body} />
              </details>
              <label>
                썸네일 URL
                <CommonInput
                  value={draft.thumbnail}
                  placeholder="https://… 또는 이미지 업로드"
                  onChange={(e) => change({ thumbnail: e.target.value })}
                />
              </label>
              <CommonFileUpload
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
              <CommonFileUpload
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
                    <CommonButton
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
                    </CommonButton>
                  </li>
                ))}
              </ul>
              <p>
                파일은 NAS에 저장됩니다. 저장 시 본문 이미지·썸네일·첨부 연결도
                반영되며, 연결 해제는 원본 파일을 삭제하지 않습니다.
              </p>
            </fieldset>
          </form>
        </CommonModal>
      )}
      {preview && previewData && (
        <CommonModal
          open
          title="프로젝트 미리보기"
          onClose={() => setPreview(false)}
          actions={
            <CommonButton onClick={() => setPreview(false)}>닫기</CommonButton>
          }
        >
          <ProjectDetailContent project={previewData} locale={locale} />
        </CommonModal>
      )}
      {confirmDelete && (
        <CommonModal
          open
          title="프로젝트 삭제"
          onClose={() => {
            if (!saving) setConfirmDelete(false);
          }}
          actions={
            <>
              <CommonButton
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
                삭제
              </CommonButton>
              <CommonButton
                disabled={saving}
                onClick={() => setConfirmDelete(false)}
              >
                취소
              </CommonButton>
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
        </CommonModal>
      )}
      <div className={s.gridWrap}>
        <table className={s.grid + ' ' + s.projectGrid}>
          <caption className="srOnly">
            프로젝트 목록 · 행을 더블클릭하거나 프로젝트명을 눌러 수정합니다.
          </caption>
          <thead>
            <tr>
              <th>
                <CommonInput
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
              <th>기간</th>
              <th>작업 구분</th>
              <th>유형</th>
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
                  <CommonInput
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
                  {formatProjectPeriod(project.startedOn, project.endedOn) ||
                    '미입력'}
                </td>
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
                  {project.updatedAt
                    ? dateFormat.format(new Date(project.updatedAt))
                    : '—'}
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
      </div>
      <CommonConfirm
        open={confirmSave}
        title="프로젝트 저장"
        content="입력한 내용을 저장하시겠습니까?"
        confirmLabel="저장"
        onConfirm={() => {
          setConfirmSave(false);
          void saveProject();
        }}
        onCancel={() => setConfirmSave(false)}
      />
      <CommonAlert
        open={saveAlert !== null}
        onClose={() => {
          if (saveAlert?.closeDraftOnClose) {
            setDraft(null);
            router.refresh();
          }
          setSaveAlert(null);
        }}
        variant={saveAlert?.variant}
        content={saveAlert?.content ?? ''}
      />
      <CommonLoading open={saving} />
    </section>
  );
}
