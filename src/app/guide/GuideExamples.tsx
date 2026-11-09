'use client';
import { CommonTextArea } from '@/components/ui/CommonTextArea';
import { CommonSelectBox } from '@/components/ui/CommonSelectBox';
import { CommonFilePicker } from '@/components/ui/CommonFilePicker';
import { CommonModal } from '@/components/ui/CommonModal';
import { CommonInput } from '@/components/ui/CommonInput';
import { CommonRichTextEditor } from '@/components/ui/CommonRichTextEditor';
import { CommonAssetLinks } from '@/components/ui/CommonAssetLinks';
import { CommonSearchPanel } from '@/components/ui/CommonSearchPanel';
import { CommonGrid, type CommonGridColumn } from '@/components/ui/CommonGrid';
import { CommonPagination } from '@/components/ui/CommonPagination';

import { useEffect, useState } from 'react';
import { CommonButton, CommonButtonLink } from '@/components/ui/CommonButton';
import { CommonAlert } from '@/components/ui/CommonAlert';
import { CommonConfirm } from '@/components/ui/CommonConfirm';
import { CommonLoading } from '@/components/ui/CommonLoading';
import type { GuideMessages } from '@/i18n/guide-ko';
import { textDocument } from '@/lib/rich-text';
import s from './guide.module.css';

type GuideRow = {
  id: number;
  title: string;
  category: string;
  updated: string;
};
// 예제 행의 제목·분류는 사전(rows)에서 같은 순서로 가져온다.
const guideRowDates = [
  '2026-10-27',
  '2026-10-26',
  '2026-10-25',
  '2026-10-24',
  '2026-10-23',
  '2026-10-22',
];

export function GuideExamples({
  tab,
  messages: copy,
  components,
}: {
  tab: 'ui' | 'feedback' | 'loading' | 'api';
  messages: GuideMessages['examples'];
  components: GuideMessages['components'];
}) {
  const guideRows: GuideRow[] = copy.rows.map((row, index) => ({
    id: index + 1,
    title: row.title,
    category: row.category,
    updated: guideRowDates[index] ?? '',
  }));
  const guideColumns: CommonGridColumn<GuideRow>[] = [
    { key: 'title', header: copy.columnTitle, render: (row) => row.title },
    {
      key: 'category',
      header: copy.columnCategory,
      render: (row) => row.category,
      align: 'center',
      width: 120,
    },
    {
      key: 'updated',
      header: copy.columnUpdated,
      render: (row) => row.updated,
      align: 'center',
      width: 140,
    },
  ];
  const [modalOpen, setModalOpen] = useState(false);
  const [workKind, setWorkKind] = useState('PERSONAL');
  // null이면 현재 locale의 기본 안내를 표시한다(언어 전환 후에도 클라이언트 상태는 유지됨).
  const [notice, setNotice] = useState<string | null>(null);
  const [start, setStart] = useState('');
  const [end, setEnd] = useState('');
  const [pending, setPending] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [pickedFile, setPickedFile] = useState<File | null>(null);
  const [gridSearch, setGridSearch] = useState({ keyword: '', category: '' });
  const [gridApplied, setGridApplied] = useState({ keyword: '', category: '' });
  const [gridPage, setGridPage] = useState(1);
  const [gridPageSize, setGridPageSize] = useState(5);
  const [editorDocument, setEditorDocument] = useState(() =>
    textDocument(copy.editorSample),
  );
  const [localImages] = useState(() => new Set<string>());
  useEffect(() => {
    return () => {
      for (const url of localImages) URL.revokeObjectURL(url);
      localImages.clear();
    };
  }, [localImages]);
  const [loadingDemo, setLoadingDemo] = useState(false);
  const [result, setResult] = useState<string | null>(null);
  const [alert, setAlert] = useState<{
    width?: number;
    content: string;
    variant?: 'default' | 'error';
  } | null>(null);
  const matchedRows = guideRows.filter(
    (row) =>
      row.title.includes(gridApplied.keyword) &&
      (!gridApplied.category || row.category === gridApplied.category),
  );
  const gridTotalPages = Math.max(
    1,
    Math.ceil(matchedRows.length / gridPageSize),
  );
  const visibleRows = matchedRows.slice(
    (gridPage - 1) * gridPageSize,
    gridPage * gridPageSize,
  );

  useEffect(() => {
    if (!loadingDemo) return;
    const timer = window.setTimeout(() => setLoadingDemo(false), 2400);
    return () => window.clearTimeout(timer);
  }, [loadingDemo]);

  async function callApi(check: 'api' | 'database') {
    setPending(true);
    setResult(copy.requesting);
    try {
      const response = await fetch(`/api/guide?check=${check}`, {
        cache: 'no-store',
        signal: AbortSignal.timeout(10000),
      });
      const body: unknown = await response.json();
      setResult(`HTTP ${response.status}\n${JSON.stringify(body, null, 2)}`);
    } catch {
      setResult(copy.requestFailed);
    } finally {
      setPending(false);
    }
  }

  return (
    <>
      {tab === 'ui' && (
        <section className={s.section} id="form-controls">
          <h2>{copy.formTitle}</h2>
          <p>{copy.formDescription}</p>
          <div className={s.row}>
            <label>
              {copy.titleLabel}
              <CommonInput placeholder={copy.titlePlaceholder} />
            </label>
            <label>
              {copy.introLabel}
              <CommonTextArea placeholder={copy.introPlaceholder} />
            </label>
            <label>
              {copy.workKindLabel}
              <CommonSelectBox
                aria-label={copy.workKindAria}
                value={workKind}
                onValueChange={setWorkKind}
                options={[
                  { value: 'PERSONAL', label: copy.workKindPersonal },
                  { value: 'COMPANY', label: copy.workKindCompany },
                ]}
              />
            </label>
            <CommonButton onClick={() => setModalOpen(true)}>
              {copy.openModal}
            </CommonButton>
          </div>
          <CommonModal
            open={modalOpen}
            title={copy.modalTitle}
            onClose={() => setModalOpen(false)}
            actions={
              <>
                <CommonButton
                  variant="primary"
                  onClick={() => setModalOpen(false)}
                >
                  {copy.save}
                </CommonButton>
                <CommonButton onClick={() => setModalOpen(false)}>
                  {copy.cancel}
                </CommonButton>
              </>
            }
          >
            <p>{copy.modalDescription}</p>
            {Array.from({ length: 12 }, (_, i) => (
              <p key={i}>{copy.modalLine.replace('{n}', String(i + 1))}</p>
            ))}
          </CommonModal>
          <h3>{copy.editorTitle}</h3>
          <p>{copy.editorDescription}</p>
          <div className={s.editorDemo}>
            <CommonRichTextEditor
              id="guide-rich-text"
              label={copy.editorLabel}
              value={editorDocument}
              uploadsEnabled={false}
              localImages={localImages}
              labels={components.editor}
              onLocalImage={(file) => {
                const url = URL.createObjectURL(file);
                localImages.add(url);
                return url;
              }}
              onChange={(document) => setEditorDocument(document)}
            />
          </div>
          <h3>{copy.filesTitle}</h3>
          <p>{copy.filesDescription}</p>
          <CommonAssetLinks
            assets={[
              {
                id: 'guide-react-logo',
                name: copy.assetName,
                size: 2048,
                mimeType: 'image/svg+xml',
                url: '/logos/react.svg',
                downloadUrl: '/logos/react.svg',
              },
            ]}
          />
          <div className={s.localFileDemo}>
            <CommonFilePicker
              label={copy.filePickerLabel}
              accept="image/png,image/jpeg,image/webp,application/pdf"
              labels={components.filePicker}
              onSelect={setPickedFile}
            />
            <p role="status" aria-live="polite">
              {pickedFile
                ? copy.pickedFile
                    .replace('{name}', pickedFile.name)
                    .replace('{size}', (pickedFile.size / 1024).toFixed(1))
                : copy.noPickedFile}
            </p>
          </div>
          <h3>{copy.gridTitle}</h3>
          <p>{copy.gridDescription}</p>
          <CommonSearchPanel
            labels={components.searchPanel}
            onSearch={() => {
              setGridApplied({ ...gridSearch });
              setGridPage(1);
            }}
            onReset={() => {
              const empty = { keyword: '', category: '' };
              setGridSearch(empty);
              setGridApplied(empty);
              setGridPage(1);
            }}
          >
            <label>
              <span>{copy.searchTitle}</span>
              <CommonInput
                type="search"
                value={gridSearch.keyword}
                onChange={(event) =>
                  setGridSearch({ ...gridSearch, keyword: event.target.value })
                }
              />
            </label>
            <label>
              <span>{copy.categoryLabel}</span>
              <CommonSelectBox
                aria-label={copy.categoryAria}
                value={gridSearch.category}
                onValueChange={(category) =>
                  setGridSearch({ ...gridSearch, category })
                }
                options={[
                  { value: '', label: copy.allCategories },
                  ...Array.from(
                    new Set(guideRows.map((row) => row.category)),
                  ).map((category) => ({ value: category, label: category })),
                ]}
              />
            </label>
          </CommonSearchPanel>
          <CommonGrid
            rows={visibleRows}
            columns={guideColumns}
            getRowKey={(row) => String(row.id)}
            caption={copy.gridCaption}
            emptyLabel={copy.gridEmpty}
            minWidth={560}
            wrapClassName={s.guideGridWrap}
            tableClassName={s.guideGrid}
          />
          <CommonPagination
            page={gridPage}
            totalPages={gridTotalPages}
            total={matchedRows.length}
            pageSize={gridPageSize}
            labels={components.pagination}
            onPageChange={setGridPage}
            onPageSizeChange={(size) => {
              setGridPageSize(size);
              setGridPage(1);
            }}
          />
        </section>
      )}
      {tab === 'feedback' && (
        <section id="alerts" className={s.section}>
          <h2>{copy.alertTitle}</h2>
          <p>{copy.alertDescription}</p>
          <div className={s.row}>
            <CommonButton
              onClick={() => setAlert({ content: copy.alertDefaultContent })}
            >
              {copy.alertDefaultButton}
            </CommonButton>
            <CommonButton
              variant="ghost"
              onClick={() =>
                setAlert({ variant: 'error', content: copy.alertErrorContent })
              }
            >
              {copy.alertErrorButton}
            </CommonButton>
            <CommonButton
              onClick={() =>
                setAlert({ content: copy.alertWideContent, width: 480 })
              }
            >
              {copy.alertWideButton}
            </CommonButton>
          </div>
          <pre className={s.code}>{copy.alertCode}</pre>
          <p>{copy.alertUsage}</p>
        </section>
      )}
      {tab === 'feedback' && (
        <section id="common-feedback" className={s.section}>
          <h2>{copy.confirmSectionTitle}</h2>
          <p>{copy.confirmSectionDescription}</p>
          <div className={s.row}>
            <CommonButton onClick={() => setConfirmOpen(true)}>
              {copy.confirmButton}
            </CommonButton>
          </div>
          <pre className={s.code}>{copy.confirmCode}</pre>
        </section>
      )}
      {tab === 'loading' && (
        <section className={s.section}>
          <h2>{copy.loadingTitle}</h2>
          <p>{copy.loadingDescription}</p>
          <div className={s.row}>
            <CommonButton onClick={() => setLoadingDemo(true)}>
              {copy.loadingButton}
            </CommonButton>
          </div>
          <pre className={s.code}>{'<CommonLoading open={saving} />'}</pre>
        </section>
      )}
      <CommonConfirm
        open={tab === 'feedback' && confirmOpen}
        title={copy.confirmTitle}
        content={copy.confirmContent}
        confirmLabel={components.confirm.confirm}
        cancelLabel={components.confirm.cancel}
        onConfirm={() => {
          setConfirmOpen(false);
          setAlert({ content: copy.confirmDone });
        }}
        onCancel={() => setConfirmOpen(false)}
      />
      <CommonLoading open={tab === 'loading' && (loadingDemo || pending)} />
      <CommonAlert
        open={tab === 'feedback' && alert !== null}
        onClose={() => setAlert(null)}
        width={alert?.width}
        variant={alert?.variant}
        content={alert?.content ?? ''}
        confirmLabel={components.confirm.confirm}
        labels={components.alert}
      />
      {tab === 'ui' && (
        <section id="examples" className={s.section}>
          <h2>{copy.actionsTitle}</h2>
          <h3>CommonButton · CommonButtonLink</h3>
          <p>{copy.buttonsDescription}</p>
          <div className={s.row}>
            <CommonButton
              variant="primary"
              onClick={() => setNotice(copy.primaryNotice)}
            >
              {copy.primary}
            </CommonButton>
            <CommonButton onClick={() => setNotice(copy.neutralNotice)}>
              {copy.neutral}
            </CommonButton>
            <CommonButton
              variant="ghost"
              size="sm"
              onClick={() => setNotice(copy.ghostNotice)}
            >
              {copy.ghost}
            </CommonButton>
            <CommonButton disabled>{copy.disabled}</CommonButton>
            <CommonButtonLink href="/projects">
              {copy.projectsLink}
            </CommonButtonLink>
          </div>
          <h3>{copy.buttonStyleTitle}</h3>
          <div className={s.tableScroll}>
            <table className={s.buttonTable}>
              <thead>
                <tr>
                  {copy.styleHeaders.map((header) => (
                    <th key={header}>{header}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {copy.styleRows.map((row) => (
                  <tr key={row[0]}>
                    {row.map((cell, index) => (
                      <td key={index}>{cell}</td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p>{copy.buttonColorNote}</p>
          <h3>{copy.buttonSizeTitle}</h3>
          <div className={s.tableScroll}>
            <table className={s.buttonTable}>
              <thead>
                <tr>
                  {copy.sizeHeaders.map((header) => (
                    <th key={header}>{header}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {copy.sizeRows.map((row) => (
                  <tr key={row[0]}>
                    {row.map((cell, index) => (
                      <td key={index}>{cell}</td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {(['primary', 'neutral', 'ghost'] as const).map((variant) => (
            <div className={s.row} key={variant}>
              {(['sm', 'md', 'lg'] as const).map((size) => (
                <CommonButton
                  key={size}
                  variant={variant}
                  size={size}
                  onClick={() =>
                    setNotice(
                      copy.sizeClicked
                        .replace('{variant}', variant)
                        .replace('{size}', size),
                    )
                  }
                >
                  {variant} · {size}
                </CommonButton>
              ))}
            </div>
          ))}
          <pre className={s.code}>{copy.buttonCode}</pre>
          <p role="status">{notice ?? copy.initialNotice}</p>
          <pre className={s.code}>{copy.buttonLinkCode}</pre>
          <h3>{copy.inputTitle}</h3>
          <p>{copy.inputDescription}</p>
          <form
            className={s.form}
            onSubmit={(event) => {
              event.preventDefault();
              setNotice(copy.validNotice);
            }}
          >
            <label>
              {copy.requiredTitle}
              <CommonInput
                name="title"
                required
                maxLength={80}
                placeholder={copy.testTitlePlaceholder}
              />
            </label>
            <label>
              {copy.date}
              <CommonInput name="date" type="date" />
            </label>
            <fieldset>
              <legend>{copy.period}</legend>
              <div className={s.row}>
                <label>
                  {copy.start}
                  <CommonInput
                    name="start"
                    type="date"
                    value={start}
                    max={end || undefined}
                    onChange={(event) => setStart(event.target.value)}
                  />
                </label>
                <label>
                  {copy.end}
                  <CommonInput
                    name="end"
                    type="date"
                    value={end}
                    min={start || undefined}
                    onChange={(event) => setEnd(event.target.value)}
                  />
                </label>
              </div>
            </fieldset>
            <CommonButton type="submit">{copy.submitCheck}</CommonButton>
          </form>
          <p>{copy.dateNote}</p>
          <pre className={s.code}>{copy.inputCode}</pre>
        </section>
      )}
      {tab === 'api' && (
        <section id="api" className={s.section}>
          <h2>{copy.apiTitle}</h2>
          <p>{copy.apiDescription}</p>
          <div className={s.row}>
            <CommonButton onClick={() => callApi('api')} disabled={pending}>
              {copy.callApi}
            </CommonButton>
            <CommonButton
              variant="primary"
              onClick={() => callApi('database')}
              disabled={pending}
            >
              {copy.checkDatabase}
            </CommonButton>
          </div>
          <pre
            className={s.code}
            role="status"
            aria-live="polite"
            aria-busy={pending}
          >
            {result ?? copy.resultIdle}
          </pre>
          <pre className={s.code}>{copy.apiCode}</pre>
          <p>{copy.apiNote}</p>
        </section>
      )}
    </>
  );
}
