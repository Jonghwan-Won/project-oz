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
import { textDocument } from '@/lib/rich-text';
import s from './guide.module.css';

type GuideRow = {
  id: number;
  title: string;
  category: string;
  updated: string;
};
const guideRows: GuideRow[] = [
  {
    id: 1,
    title: '프로젝트 목록 화면 정리',
    category: '프로젝트',
    updated: '2026-10-27',
  },
  {
    id: 2,
    title: '게시판 검색과 페이지 이동',
    category: '게시판',
    updated: '2026-10-26',
  },
  {
    id: 3,
    title: '공통 에디터 도구 구성',
    category: 'UI',
    updated: '2026-10-25',
  },
  {
    id: 4,
    title: '이미지 첨부 미리보기',
    category: 'UI',
    updated: '2026-10-24',
  },
  {
    id: 5,
    title: '관리자 폼 입력 점검',
    category: '프로젝트',
    updated: '2026-10-23',
  },
  {
    id: 6,
    title: '가이드 화면 사용법',
    category: 'UI',
    updated: '2026-10-22',
  },
];
const guideColumns: CommonGridColumn<GuideRow>[] = [
  { key: 'title', header: '제목', render: (row) => row.title },
  {
    key: 'category',
    header: '분류',
    render: (row) => row.category,
    align: 'center',
    width: 120,
  },
  {
    key: 'updated',
    header: '수정일',
    render: (row) => row.updated,
    align: 'center',
    width: 140,
  },
];

export function GuideExamples({
  tab,
}: {
  tab: 'ui' | 'feedback' | 'loading' | 'api';
}) {
  const [modalOpen, setModalOpen] = useState(false);
  const [workKind, setWorkKind] = useState('PERSONAL');
  const [notice, setNotice] = useState('버튼을 눌러 동작을 확인하세요.');
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
    textDocument('가이드에서 편집할 수 있는 예제입니다.'),
  );
  const [localImages] = useState(() => new Set<string>());
  useEffect(() => {
    return () => {
      for (const url of localImages) URL.revokeObjectURL(url);
      localImages.clear();
    };
  }, [localImages]);
  const [loadingDemo, setLoadingDemo] = useState(false);
  const [result, setResult] = useState('아직 호출하지 않았습니다.');
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
    setResult('요청 중…');
    try {
      const response = await fetch(`/api/guide?check=${check}`, {
        cache: 'no-store',
        signal: AbortSignal.timeout(10000),
      });
      const body: unknown = await response.json();
      setResult(`HTTP ${response.status}\n${JSON.stringify(body, null, 2)}`);
    } catch {
      setResult(
        '요청에 실패했습니다. 개발 서버 상태와 네트워크를 확인하고 다시 시도하세요.',
      );
    } finally {
      setPending(false);
    }
  }

  return (
    <>
      {tab === 'ui' && (
        <section className={s.section} id="form-controls">
          <h2>입력 · 선택 · 모달</h2>
          <p>
            프로젝트에서 정의한 입력 컴포넌트 예제입니다. 텍스트와 여러 줄 입력,
            선택 상자, 공통 버튼으로 구성했습니다. 입력 예제는 저장되지
            않습니다.
          </p>
          <div className={s.row}>
            <label>
              제목
              <CommonInput placeholder="프로젝트 제목" />
            </label>
            <label>
              소개
              <CommonTextArea placeholder="소개를 입력하세요" />
            </label>
            <label>
              작업 구분
              <CommonSelectBox
                aria-label="작업 구분 예제"
                value={workKind}
                onValueChange={setWorkKind}
                options={[
                  { value: 'PERSONAL', label: '개인' },
                  { value: 'COMPANY', label: '회사' },
                ]}
              />
            </label>
            <CommonButton onClick={() => setModalOpen(true)}>
              공통 모달 열기
            </CommonButton>
          </div>
          <CommonModal
            open={modalOpen}
            title="프로젝트 등록"
            onClose={() => setModalOpen(false)}
            actions={
              <>
                <CommonButton
                  variant="primary"
                  onClick={() => setModalOpen(false)}
                >
                  저장
                </CommonButton>
                <CommonButton onClick={() => setModalOpen(false)}>
                  취소
                </CommonButton>
              </>
            }
          >
            <p>
              제목과 버튼은 고정되고 본문만 스크롤됩니다. 예제 데이터는 저장하지
              않습니다.
            </p>
            {Array.from({ length: 12 }, (_, i) => (
              <p key={i}>폼 내용 예제 {i + 1}</p>
            ))}
          </CommonModal>
          <h3>에디터와 읽기 전용 뷰어</h3>
          <p>
            CommonRichTextEditor는 Tiptap 기반으로 제목·목록·표·이미지를
            편집하고, CommonRichTextView는 저장된 JSON 문서를 읽기 전용으로
            렌더링합니다.
          </p>
          <div className={s.editorDemo}>
            <CommonRichTextEditor
              id="guide-rich-text"
              label="가이드 에디터 예제"
              value={editorDocument}
              uploadsEnabled={false}
              localImages={localImages}
              onLocalImage={(file) => {
                const url = URL.createObjectURL(file);
                localImages.add(url);
                return url;
              }}
              onChange={(document) => setEditorDocument(document)}
            />
          </div>
          <h3>첨부 링크와 파일 선택</h3>
          <p>
            CommonAssetLinks는 이미 등록된 파일의 다운로드 링크를 표시합니다.
            아래 파일 선택 예제는 화면 상태만 확인합니다. 선택한 파일은 브라우저
            안에만 머물고 API 요청이나 NAS 업로드는 하지 않습니다. 가이드 에디터
            이미지도 브라우저에서만 표시되며 새로고침하면 사라집니다.
          </p>
          <CommonAssetLinks
            assets={[
              {
                id: 'guide-react-logo',
                name: 'react.svg 예제',
                size: 2048,
                mimeType: 'image/svg+xml',
                url: '/logos/react.svg',
                downloadUrl: '/logos/react.svg',
              },
            ]}
          />
          <div className={s.localFileDemo}>
            <CommonFilePicker
              label="첨부파일 선택 예제"
              accept="image/png,image/jpeg,image/webp,application/pdf"
              onSelect={setPickedFile}
            />
            <p role="status" aria-live="polite">
              {pickedFile
                ? `화면에서 선택됨 · ${pickedFile.name} · ${(pickedFile.size / 1024).toFixed(1)}KB`
                : '선택된 파일 없음 · 서버로 전송되지 않습니다.'}
            </p>
          </div>
          <h3>검색 · 공통 그리드 · 페이지 이동</h3>
          <p>
            실제 관리자 목록과 같은 CommonSearchPanel → CommonGrid →
            CommonPagination 조합입니다. 예제 행만 화면 안에서 검색·페이지
            이동하며 서버나 DB에는 저장하지 않습니다. 표의 색과 간격은 사용하는
            화면의 CSS가 정합니다.
          </p>
          <CommonSearchPanel
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
              <span>제목 검색</span>
              <CommonInput
                type="search"
                value={gridSearch.keyword}
                onChange={(event) =>
                  setGridSearch({ ...gridSearch, keyword: event.target.value })
                }
              />
            </label>
            <label>
              <span>분류</span>
              <CommonSelectBox
                aria-label="예제 분류"
                value={gridSearch.category}
                onValueChange={(category) =>
                  setGridSearch({ ...gridSearch, category })
                }
                options={[
                  { value: '', label: '전체' },
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
            caption="공통 그리드 예제"
            minWidth={560}
            wrapClassName={s.guideGridWrap}
            tableClassName={s.guideGrid}
          />
          <CommonPagination
            page={gridPage}
            totalPages={gridTotalPages}
            total={matchedRows.length}
            pageSize={gridPageSize}
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
          <h2>CommonAlert · 사이트 공통 알림</h2>
          <p>
            일반 안내는 메인 색상, 오류는 빨간 그라데이션으로 구분합니다. 제목과
            아이콘 없이 본문과 회색 확인 버튼을 사용합니다. 기본 너비는
            360px이며 width로 조정할 수 있습니다. 작은 화면에서는 화면 너비에
            맞춥니다. 확인이 필요한 짧은 안내에 사용하며, 확인 버튼이나 Escape로
            닫으면 원래 버튼으로 포커스가 돌아옵니다. 배경 클릭으로는 닫히지
            않습니다.
          </p>
          <div className={s.row}>
            <CommonButton
              onClick={() =>
                setAlert({
                  content:
                    '변경 사항을 저장했어요.\n다음 작업을 이어가 볼까요?',
                })
              }
            >
              기본 알림 예제
            </CommonButton>
            <CommonButton
              variant="ghost"
              onClick={() =>
                setAlert({
                  variant: 'error',
                  content:
                    '요청을 처리하지 못했습니다. 입력한 내용은 유지됩니다.\n네트워크 연결을 확인하고 다시 시도해 주세요.',
                })
              }
            >
              오류 예제
            </CommonButton>
            <CommonButton
              onClick={() =>
                setAlert({
                  content: '너비를 480px로 지정한 알림입니다.',
                  width: 480,
                })
              }
            >
              넓은 알림 예제
            </CommonButton>
          </div>
          <pre className={s.code}>
            {
              '// 기본값: variant="default", width={360}\n<CommonAlert\n  open={open}\n  onClose={() => setOpen(false)}\n  content="변경 사항을 저장했어요."\n/>\n\n<CommonAlert\n  open={errorOpen}\n  onClose={() => setErrorOpen(false)}\n  variant="error"\n  width={480}\n  content="네트워크 연결을 확인해 주세요."\n  confirmLabel="닫기"\n/>'
            }
          </pre>
          <p>
            CommonAlert는 짧은 안내와 오류 알림, CommonConfirm은 저장·삭제처럼
            사용자의 선택이 필요한 확인에 씁니다. 자동으로 사라지는 토스트는
            현재 공통 컴포넌트에 포함되어 있지 않습니다.
          </p>
        </section>
      )}
      {tab === 'feedback' && (
        <section id="common-feedback" className={s.section}>
          <h2>저장 전 확인</h2>
          <p>저장 전에 확인 UI를 표시합니다.</p>
          <div className={s.row}>
            <CommonButton onClick={() => setConfirmOpen(true)}>
              저장 확인 예제
            </CommonButton>
          </div>
          <pre className={s.code}>
            {
              '<CommonConfirm open={open} content="저장하시겠습니까?" onConfirm={save} onCancel={close} />'
            }
          </pre>
        </section>
      )}
      {tab === 'loading' && (
        <section className={s.section}>
          <h2>공통 로딩</h2>
          <p>요청 처리 중 공통 로딩 화면을 표시합니다.</p>
          <div className={s.row}>
            <CommonButton onClick={() => setLoadingDemo(true)}>
              공통 로딩 보기
            </CommonButton>
          </div>
          <pre className={s.code}>{'<CommonLoading open={saving} />'}</pre>
        </section>
      )}
      <CommonConfirm
        open={tab === 'feedback' && confirmOpen}
        title="저장 확인"
        content="예제 내용을 저장하시겠습니까?"
        onConfirm={() => {
          setConfirmOpen(false);
          setAlert({ content: '예제 저장이 완료되었습니다.' });
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
      />
      {tab === 'ui' && (
        <section id="examples" className={s.section}>
          <h2>동작 컴포넌트</h2>
          <h3>CommonButton · CommonButtonLink</h3>
          <p>
            CommonButton은 저장·열기 같은 동작을 하는 button이고,
            CommonButtonLink는 주소 이동을 하는 링크입니다. 링크는 새 탭 열기,
            주소 복사와 같은 브라우저 동작을 유지합니다. 두 컴포넌트는 프로젝트
            버튼 스타일과 동작 역할을 따릅니다. 크기는 sm / md / lg, 모양은
            neutral / primary / ghost입니다.
          </p>
          <div className={s.row}>
            <CommonButton
              variant="primary"
              onClick={() => setNotice('Primary 버튼을 눌렀습니다.')}
            >
              주요 동작
            </CommonButton>
            <CommonButton
              onClick={() => setNotice('Neutral 버튼을 눌렀습니다.')}
            >
              기본 동작
            </CommonButton>
            <CommonButton
              variant="ghost"
              size="sm"
              onClick={() => setNotice('Ghost 버튼을 눌렀습니다.')}
            >
              보조 동작
            </CommonButton>
            <CommonButton disabled>사용 불가</CommonButton>
            <CommonButtonLink href="/projects">
              프로젝트로 이동
            </CommonButtonLink>
          </div>
          <h3>버튼 스타일 · 컬러</h3>
          <div className={s.tableScroll}>
            <table className={s.buttonTable}>
              <thead>
                <tr>
                  <th>variant</th>
                  <th>용도</th>
                  <th>배경 / 글자 / 테두리</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>primary</td>
                  <td>저장·등록 등 주요 동작</td>
                  <td>
                    --accent (#BAACFF) / --on-accent (#161025) / 투명 · hover
                    #D0C6FF
                  </td>
                </tr>
                <tr>
                  <td>neutral (기본)</td>
                  <td>취소·수정 등 일반 동작</td>
                  <td>--surface / --ink / --line</td>
                </tr>
                <tr>
                  <td>ghost</td>
                  <td>도구·보조 동작</td>
                  <td>투명 / --ink / --line · hover --hover</td>
                </tr>
              </tbody>
            </table>
          </div>
          <p>
            neutral의 다크 배경/글자/테두리는 #141414 / #F5F5F5 / #292929,
            라이트는 #FFFFFF / #242424 / #DDE0E6입니다. 포커스는 --accent-ink,
            비활성 상태는 불투명도 40%입니다.
          </p>
          <h3>버튼 크기</h3>
          <div className={s.tableScroll}>
            <table className={s.buttonTable}>
              <thead>
                <tr>
                  <th>size</th>
                  <th>최소 높이</th>
                  <th>패딩 (세로 × 가로)</th>
                  <th>글자 크기</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>sm</td>
                  <td>44px</td>
                  <td>10px × 16px</td>
                  <td>13px</td>
                </tr>
                <tr>
                  <td>md (기본)</td>
                  <td>48px</td>
                  <td>14px × 23px</td>
                  <td>14px</td>
                </tr>
                <tr>
                  <td>lg</td>
                  <td>56px</td>
                  <td>17px × 28px</td>
                  <td>16px</td>
                </tr>
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
                  onClick={() => setNotice(variant + ' / ' + size + ' 클릭')}
                >
                  {variant} · {size}
                </CommonButton>
              ))}
            </div>
          ))}
          <pre className={s.code}>
            {
              '<CommonButton type="submit" variant="primary">저장</CommonButton>\n<CommonButton variant="neutral" onClick={onCancel}>취소</CommonButton>'
            }
          </pre>
          <p role="status">{notice}</p>
          <pre className={s.code}>
            {
              '<CommonButton variant="primary" onClick={handleClick}>저장</CommonButton>\n<CommonButtonLink href="/projects">프로젝트</CommonButtonLink>'
            }
          </pre>
          <h3>CommonInput · 날짜 · 기간</h3>
          <p>
            전용 DatePicker / DateRangePicker는 아직 채택하지 않았습니다. 아래는
            브라우저 기본 입력을 사용하는 예제이며 달력 모양은 브라우저마다
            다릅니다.
          </p>
          <form
            className={s.form}
            onSubmit={(event) => {
              event.preventDefault();
              setNotice('입력 검증 완료 · 예제이므로 저장하지 않습니다.');
            }}
          >
            <label>
              제목 (필수, 최대 80자)
              <CommonInput
                name="title"
                required
                maxLength={80}
                placeholder="테스트 제목"
              />
            </label>
            <label>
              날짜
              <CommonInput name="date" type="date" />
            </label>
            <fieldset>
              <legend>기간 선택</legend>
              <div className={s.row}>
                <label>
                  시작일
                  <CommonInput
                    name="start"
                    type="date"
                    value={start}
                    max={end || undefined}
                    onChange={(event) => setStart(event.target.value)}
                  />
                </label>
                <label>
                  종료일
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
            <CommonButton type="submit">입력 확인</CommonButton>
          </form>
          <p>
            날짜 값은 YYYY-MM-DD입니다. 시각이 없는 날짜를 UTC 시각으로 임의
            변환하지 않습니다. 서버에 저장할 때는 서버에서도 검증해야 합니다.
          </p>
          <pre className={s.code}>
            {
              '<label>제목<CommonInput name="title" required maxLength={80} /></label>\n<label>날짜<CommonInput name="date" type="date" /></label>'
            }
          </pre>
        </section>
      )}
      {tab === 'api' && (
        <section id="api" className={s.section}>
          <h2>API → 서버 → 개발 DB</h2>
          <p>
            첫 버튼은 API 응답만, 두 번째는 DATABASE_URL을 사용해 SELECT 1을
            실행합니다. 테이블 생성·데이터 저장은 하지 않습니다. 실패 시 HTTP
            상태와 안내를 확인하세요.
          </p>
          <div className={s.row}>
            <CommonButton onClick={() => callApi('api')} disabled={pending}>
              API 호출
            </CommonButton>
            <CommonButton
              variant="primary"
              onClick={() => callApi('database')}
              disabled={pending}
            >
              DB 연결 확인
            </CommonButton>
          </div>
          <pre
            className={s.code}
            role="status"
            aria-live="polite"
            aria-busy={pending}
          >
            {result}
          </pre>
          <pre className={s.code}>
            {
              "const response = await fetch('/api/guide?check=database', {\n  cache: 'no-store',\n});\nconst body = await response.json();\nif (!response.ok) { /* 실패 안내 */ }"
            }
          </pre>
          <p>
            접속 비밀번호는 서버의 .env.local에만 설정합니다. 브라우저 요청에 DB
            주소나 비밀번호를 넣지 마세요. 설정 방법은
            docs/05-local-development.md를 참고하세요.
          </p>
        </section>
      )}
    </>
  );
}
