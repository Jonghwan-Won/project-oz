'use client';
import { CommonInput } from '@/components/ui/CommonInput';
import { Autocomplete, SegmentedControl, Switch } from '@mantine/core';
import { CommonTextArea } from '@/components/ui/CommonTextArea';
import { CommonSelectBox } from '@/components/ui/CommonSelectBox';
import { CommonModal } from '@/components/ui/CommonModal';
import { CommonConfirm } from '@/components/ui/CommonConfirm';
import { CommonAlert } from '@/components/ui/CommonAlert';
import { CommonLoading } from '@/components/ui/CommonLoading';
import { CommonSearchPanel } from '@/components/ui/CommonSearchPanel';
import { CommonPagination } from '@/components/ui/CommonPagination';
import { CommonGrid, type CommonGridColumn } from '@/components/ui/CommonGrid';
import { emptyProjectSearch, matchesProject, paginate } from '@/lib/admin-list';
import { useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { CommonButton } from '@/components/ui/CommonButton';
import { ProjectTag } from '@/components/ProjectTag';
import { CommonRichTextEditor } from '@/components/ui/CommonRichTextEditor';
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

const formatFileSize = (bytes: number) =>
  bytes < 1024 * 1024
    ? `${Math.max(1, Math.round(bytes / 1024))} KB`
    : `${Number((bytes / (1024 * 1024)).toFixed(1))} MB`;

export function ProjectManager({
  projects,
  codes,
}: {
  projects: ProjectForm[];
  codes: ProjectCode[];
}) {
  const router = useRouter();
  const technologyOptions = codes
    .filter((code) => code.groupKey === 'TECHNOLOGY' && code.isActive)
    .map((code) => code.nameKo);
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
  const originalDraft = useRef<string | null>(null);
  const [dirty, setDirty] = useState(false);
  const [confirmLeave, setConfirmLeave] = useState(false);
  const [locale, setLocale] = useState<'ko' | 'en'>('ko');
  const [technologyQuery, setTechnologyQuery] = useState('');
  const technologySelected = useRef(false);
  const [tagInput, setTagInput] = useState('');
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
  const requestClose = () => {
    if (saving || uploads) return;
    if (dirty) setConfirmLeave(true);
    else {
      setDraft(null);
      originalDraft.current = null;
    }
  };
  const dateFormat = new Intl.DateTimeFormat('sv-SE', {
    timeZone: 'Asia/Seoul',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  });
  const gridColumns: CommonGridColumn<ProjectForm>[] = [
    {
      key: 'select',
      header: (
        <CommonInput
          type="checkbox"
          aria-label="현재 페이지 전체 선택"
          checked={
            result.items.length > 0 &&
            result.items.every((project) => selected.includes(project.id))
          }
          ref={(input) => {
            if (input)
              input.indeterminate =
                result.items.some((project) => selected.includes(project.id)) &&
                !result.items.every((project) => selected.includes(project.id));
          }}
          onChange={(event) =>
            setSelected(
              event.target.checked
                ? [...new Set([...selected, ...result.items.map((p) => p.id)])]
                : selected.filter(
                    (id) => !result.items.some((project) => project.id === id),
                  ),
            )
          }
        />
      ),
      render: (project) => (
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
      ),
      align: 'center',
      width: 60,
    },
    {
      key: 'title',
      header: '프로젝트명',
      width: 280,
      render: (project) => (
        <button className={s.gridTitle} onClick={() => openProject(project)}>
          {project.translations.ko.title}
        </button>
      ),
    },
    {
      key: 'customer',
      header: '고객사',
      render: (project) => project.customerName || '미입력',
      align: 'center',
    },
    {
      key: 'period',
      header: '기간',
      render: (project) =>
        formatProjectPeriod(project.startedOn, project.endedOn) || '미입력',
      align: 'center',
    },
    {
      key: 'origin',
      header: '작업 구분',
      render: (project) =>
        options('PROJECT_ORIGIN').find(
          (code) => code.value === project.originCode,
        )?.label,
      align: 'center',
    },
    {
      key: 'type',
      header: '유형',
      render: (project) =>
        options('PROJECT_TYPE').find((code) => code.value === project.typeCode)
          ?.label || '미지정',
      align: 'center',
    },
    {
      key: 'updatedAt',
      header: '수정일자',
      align: 'center',
      render: (project) =>
        project.updatedAt
          ? dateFormat.format(new Date(project.updatedAt))
          : '-',
    },
  ];
  const change = (patch: Partial<ProjectForm>) => {
    if (!draft) return;
    const next = { ...draft, ...patch };
    setDraft(next);
    setDirty(JSON.stringify(next) !== originalDraft.current);
  };
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
  const copy = (patch: Partial<ProjectCopy>) => {
    if (!draft) return;
    const next = {
      ...draft,
      translations: {
        ...draft.translations,
        [locale]: { ...draft.translations[locale], ...patch },
      },
    };
    setDraft(next);
    setDirty(JSON.stringify(next) !== originalDraft.current);
  };
  const options = (group: string) =>
    codes
      .filter((c) => c.groupKey === group)
      .map((c) => ({
        value: c.code,
        label: c.nameKo + (!c.isActive ? ' (비활성)' : ''),
        disabled: !c.isActive,
      }));
  const openProject = (project: ProjectForm) => {
    const next = structuredClone(project);
    setDraft(next);
    originalDraft.current = JSON.stringify(next);
    setDirty(false);
    setMode('edit');
    setLocale('ko');
    setTechnologyQuery('');
    setTagInput('');
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
          <span>노출 여부</span>
          <CommonSelectBox
            aria-label="검색 노출 여부"
            value={search.isVisible}
            onValueChange={(isVisible) => setSearch({ ...search, isVisible })}
            options={[
              { value: '', label: '전체' },
              { value: 'true', label: '노출' },
              { value: 'false', label: '미노출' },
            ]}
          />
        </label>

        <label>
          <span>작업 구분</span>
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
          <span>프로젝트 유형</span>
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
          <span>검색어</span>
          <CommonInput
            type="search"
            value={search.keyword}
            placeholder="프로젝트명·고객사·기술·태그"
            onChange={(event) =>
              setSearch({ ...search, keyword: event.target.value })
            }
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
              disabled={selectedProjects.length === 0 || saving || uploads > 0}
              onClick={() => {
                setMessage('');
                setConfirmDelete(true);
              }}
            >
              삭제
            </CommonButton>
            <CommonButton
              variant="primary"
              disabled={saving || uploads > 0}
              onClick={() => {
                const next = blankProject();
                setDraft(next);
                originalDraft.current = JSON.stringify(next);
                setDirty(false);
                setMode('create');
                setLocale('ko');
                setTechnologyQuery('');
                setTagInput('');
                setMessage('');
              }}
            >
              등록
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
            closeOnEscape={false}
            onClose={() => {
              requestClose();
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
                  onClick={requestClose}
                  size="sm"
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
              {message && (
                <p role="status" className={s.notice}>
                  {message}
                </p>
              )}
              <fieldset
                disabled={saving || uploads > 0}
                className={s.editorFields}
              >
                <div className={s.formSectionTitleRow}>
                  <h3 className={s.formSectionTitle}>프로젝트 정보</h3>
                  <div className={s.visibilityToggle}>
                    <span>노출 여부</span>
                    <Switch
                      aria-label="노출 여부"
                      className={s.visibilitySwitch}
                      checked={draft.isVisible}
                      onChange={(event) =>
                        change({ isVisible: event.currentTarget.checked })
                      }
                    />
                  </div>
                </div>
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
                      className={s.compactSelect}
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
                      className={s.compactSelect}
                      aria-label="프로젝트 유형"
                      value={draft.typeCode}
                      onValueChange={(typeCode) => change({ typeCode })}
                      options={[
                        { value: '', label: '미지정' },
                        ...options('PROJECT_TYPE'),
                      ]}
                    />
                  </label>
                  <div className={s.tagField}>
                    <label htmlFor="project-technologies">사용 기술</label>
                    <div className={s.tagEntry}>
                      <Autocomplete
                        id="project-technologies"
                        aria-label="사용 기술"
                        classNames={{
                          input: s.technologyInput,
                          dropdown: s.technologyDropdown,
                          option: s.technologyOption,
                        }}
                        placeholder="기술 검색"
                        selectFirstOptionOnChange
                        data={technologyOptions.filter(
                          (name) => !draft.technologies.includes(name),
                        )}
                        value={technologyQuery}
                        onChange={(value) => {
                          if (technologySelected.current) {
                            technologySelected.current = false;
                            setTechnologyQuery('');
                          } else {
                            setTechnologyQuery(value);
                          }
                        }}
                        onOptionSubmit={(name) => {
                          technologySelected.current = true;
                          if (
                            technologyOptions.includes(name) &&
                            !draft.technologies.includes(name)
                          )
                            change({
                              technologies: [...draft.technologies, name],
                            });
                        }}
                      />
                    </div>
                    <div
                      className={s.selectedTags}
                      aria-label="선택한 사용 기술"
                    >
                      {draft.technologies.map((name) => (
                        <ProjectTag
                          key={name}
                          label={name}
                          onRemove={() =>
                            change({
                              technologies: draft.technologies.filter(
                                (value) => value !== name,
                              ),
                            })
                          }
                        />
                      ))}
                    </div>
                  </div>
                  <div className={s.tagField}>
                    <label htmlFor="project-tags">태그</label>
                    <div className={s.tagEntry}>
                      <CommonInput
                        id="project-tags"
                        value={tagInput}
                        onChange={(event) => setTagInput(event.target.value)}
                        onKeyDown={(event) => {
                          if (event.key !== 'Enter') return;
                          event.preventDefault();
                          const tag = tagInput.trim();
                          if (
                            tag &&
                            !draft.tags.some(
                              (value) =>
                                value.toLocaleLowerCase() ===
                                tag.toLocaleLowerCase(),
                            )
                          )
                            change({ tags: [...draft.tags, tag] });
                          setTagInput('');
                        }}
                        placeholder="태그 입력 후 Enter"
                      />
                    </div>
                    <div className={s.selectedTags} aria-label="선택한 태그">
                      {draft.tags.map((tag) => (
                        <ProjectTag
                          key={tag}
                          label={tag}
                          onRemove={() =>
                            change({
                              tags: draft.tags.filter((value) => value !== tag),
                            })
                          }
                        />
                      ))}
                    </div>
                  </div>
                </div>
                <div className={s.formSectionHeader}>
                  <h3 className={s.formSectionTitle}>프로젝트 소개</h3>
                  <div className={s.languageActions}>
                    <SegmentedControl
                      aria-label="편집 언어"
                      className={s.adminSegmentedControl}
                      size="xs"
                      radius="md"
                      value={locale}
                      onChange={(value) => {
                        if (value === 'ko' || value === 'en') setLocale(value);
                      }}
                      data={[
                        { label: '한국어', value: 'ko' },
                        { label: 'English', value: 'en' },
                      ]}
                    />
                  </div>
                </div>
                <div className={`${s.fields} ${s.translationFields}`}>
                  <label className={s.editorFieldHeading}>
                    {locale === 'ko' ? '한국어 제목' : '영어 제목'}
                    <CommonInput
                      required={locale === 'ko'}
                      maxLength={200}
                      value={draft.translations[locale].title}
                      onChange={(e) => copy({ title: e.target.value })}
                    />
                  </label>
                  <label className={s.editorFieldHeading}>
                    한 줄 소개
                    <CommonTextArea
                      rows={3}
                      maxLength={4000}
                      value={draft.translations[locale].summary}
                      onChange={(e) => copy({ summary: e.target.value })}
                    />
                  </label>
                </div>
                <CommonRichTextEditor
                  key={draft.id + locale}
                  id="project-introduction"
                  label="프로젝트 소개"
                  contentClassName={s.projectEditorContent}
                  disabled={saving || uploads > 0}
                  onUploadBusyChange={uploadBusy}
                  value={draft.translations[locale].body}
                  onChange={(body) => copy({ body })}
                />
                <div className={s.uploadField}>
                  <div className={s.uploadHeading}>
                    <span>썸네일</span>
                    <small>* PNG · JPEG · WebP, 최대 10MB</small>
                  </div>
                  <CommonFileUpload
                    label="파일 선택"
                    compact
                    onBusyChange={uploadBusy}
                    imagesOnly
                    hideHint
                    onUploaded={(asset) =>
                      change({ thumbnail: asset.url, thumbnailFile: asset })
                    }
                  >
                    {draft.thumbnailFile && (
                      <ul className={s.thumbnailFiles}>
                        <li className={s.assetRow}>
                          <a href={draft.thumbnailFile.downloadUrl}>
                            {draft.thumbnailFile.name}
                          </a>
                          <small className={s.assetSize}>
                            {formatFileSize(draft.thumbnailFile.size)}
                          </small>
                          <CommonButton
                            className={s.assetRemove}
                            size="sm"
                            variant="ghost"
                            aria-label="썸네일 제거"
                            title="썸네일 제거"
                            onClick={() =>
                              change({ thumbnail: '', thumbnailFile: null })
                            }
                          >
                            ×
                          </CommonButton>
                        </li>
                      </ul>
                    )}
                  </CommonFileUpload>
                </div>
                <div className={s.uploadField}>
                  <div className={s.uploadHeading}>
                    <span>첨부파일</span>
                    <small>* PDF · PNG · JPEG · WebP, 최대 10MB</small>
                  </div>
                  <CommonFileUpload
                    label="파일 선택"
                    compact
                    onBusyChange={uploadBusy}
                    duplicateNames={draft.files?.map((file) => file.name) ?? []}
                    hideHint
                    onUploaded={(asset) =>
                      change({
                        attachmentIds: [...draft.attachmentIds, asset.id],
                        files: [...(draft.files ?? []), asset],
                      })
                    }
                  >
                    <ul className={s.uploadList}>
                      {draft.attachmentIds.map((id) => {
                        const file = draft.files?.find(
                          (item) => item.id === id,
                        );
                        return (
                          <li key={id} className={s.assetRow}>
                            <a href={'/api/assets/' + id + '?download=1'}>
                              {file?.name ?? '첨부파일 다운로드'}
                            </a>
                            {file && (
                              <small className={s.assetSize}>
                                {formatFileSize(file.size)}
                              </small>
                            )}
                            <CommonButton
                              className={s.assetRemove}
                              size="sm"
                              variant="ghost"
                              aria-label={`첨부파일 ${file?.name ?? ''} 제거`}
                              title="첨부파일 제거"
                              onClick={() => {
                                change({
                                  attachmentIds: draft.attachmentIds.filter(
                                    (value) => value !== id,
                                  ),
                                  files: draft.files?.filter(
                                    (item) => item.id !== id,
                                  ),
                                });
                              }}
                            >
                              ×
                            </CommonButton>
                          </li>
                        );
                      })}
                    </ul>
                  </CommonFileUpload>
                </div>
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
              <CommonButton size="sm" onClick={() => setPreview(false)}>
                닫기
              </CommonButton>
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
            <p>
              선택한 {selectedProjects.length}개 프로젝트를 삭제하시겠습니까?
            </p>
            <p>
              목록과 사용자 화면에서 제외되며 원본 데이터와 NAS 파일은
              보존됩니다.
            </p>
            <ul>
              {selectedProjects.map((project) => (
                <li key={project.id}>{project.translations.ko.title}</li>
              ))}
            </ul>
            {message && <p role="alert">{message}</p>}
          </CommonModal>
        )}
        <CommonGrid
          rows={result.items}
          columns={gridColumns}
          getRowKey={(project) => project.id}
          caption="프로젝트 목록 · 행을 더블클릭하거나 프로젝트명을 눌러 수정합니다."
          emptyMessage="검색 결과가 없습니다."
          minWidth={900}
          wrapClassName={s.gridWrap}
          tableClassName={`${s.grid} ${s.projectGrid}`}
          emptyCellClassName={s.empty}
          onRowDoubleClick={(project, event) => {
            if (
              !(event.target instanceof Element) ||
              !event.target.closest('button,input,a')
            )
              openProject(project);
          }}
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
      <CommonConfirm
        open={confirmLeave}
        title="페이지 이동"
        content="저장하지 않은 변경사항이 있습니다. 이동하시겠습니까?"
        confirmLabel="확인"
        onConfirm={() => {
          setConfirmLeave(false);
          setDraft(null);
          originalDraft.current = null;
          setDirty(false);
        }}
        onCancel={() => setConfirmLeave(false)}
      />
      <CommonAlert
        open={saveAlert !== null}
        onClose={() => {
          if (saveAlert?.closeDraftOnClose) {
            setDraft(null);
            originalDraft.current = null;
            setDirty(false);
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
