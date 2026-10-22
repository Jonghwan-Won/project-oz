'use client';
import { CommonTextArea } from '@/components/ui/CommonTextArea';
import { CommonSelectBox } from '@/components/ui/CommonSelectBox';
import { CommonFilePicker } from '@/components/ui/CommonFilePicker';
import { CommonModal } from '@/components/ui/CommonModal';
import { CommonInput } from '@/components/ui/CommonInput';
import { CommonRichTextEditor } from '@/components/ui/CommonRichTextEditor';
import { CommonRichTextView } from '@/components/ui/CommonRichTextView';
import { CommonAssetLinks } from '@/components/ui/CommonAssetLinks';
import { CommonFileUpload } from '@/components/ui/CommonFileUpload';

import { useEffect, useState } from 'react';
import {
  Alert as MantineAlert,
  Button as MantineButton,
  FileInput as MantineFileInput,
  Menu,
  Modal as MantineModal,
  Select as MantineSelect,
} from '@mantine/core';
import { CommonButton, CommonButtonLink } from '@/components/ui/CommonButton';
import { CommonAlert } from '@/components/ui/CommonAlert';
import { CommonConfirm } from '@/components/ui/CommonConfirm';
import { CommonLoading } from '@/components/ui/CommonLoading';
import { textDocument } from '@/lib/rich-text';
import s from './guide.module.css';

export function GuideExamples({
  tab,
}: {
  tab: 'ui' | 'feedback' | 'loading' | 'api';
}) {
  const [modalOpen, setModalOpen] = useState(false);
  const [workKind, setWorkKind] = useState('PERSONAL');
  const [mantineWorkKind, setMantineWorkKind] = useState<string | null>('회사');
  const [choice, setChoice] = useState('목록');
  const [notice, setNotice] = useState('버튼을 눌러 동작을 확인하세요.');
  const [start, setStart] = useState('');
  const [end, setEnd] = useState('');
  const [pending, setPending] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [mantineConfirmOpen, setMantineConfirmOpen] = useState(false);
  const [mantineFile, setMantineFile] = useState<File | null>(null);
  const [pickedFileName, setPickedFileName] = useState('');
  const [editorDocument, setEditorDocument] = useState(() =>
    textDocument('가이드에서 편집할 수 있는 예제입니다.'),
  );
  const [loadingDemo, setLoadingDemo] = useState(false);
  const [result, setResult] = useState('아직 호출하지 않았습니다.');
  const [alert, setAlert] = useState<{
    width?: number;
    content: string;
    variant?: 'default' | 'error';
  } | null>(null);

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
          <h2>공통 폼 · 모달</h2>
          <p>
            CommonSelectBox는 Mantine Select를 OZ 스타일로 감싼 선택 상자입니다.
            옆에서 Mantine 기본 Select와 파일 선택 UI도 비교할 수 있습니다.
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
            <label>
              Mantine Select
              <MantineSelect
                aria-label="Mantine Select 예제"
                value={mantineWorkKind}
                onChange={setMantineWorkKind}
                data={['개인', '회사']}
              />
            </label>
            <div>
              <p>OZ 파일 선택 · {pickedFileName || '선택된 파일 없음'}</p>
              <CommonFilePicker
                label="OZ 파일 선택 예제"
                onSelect={(file) => setPickedFileName(file.name)}
              />
            </div>
            <MantineFileInput
              label="Mantine FileInput"
              placeholder="파일을 선택하세요"
              value={mantineFile}
              onChange={setMantineFile}
              clearable
            />
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
            CommonRichTextEditor는 Tiptap 기반으로 제목·목록·표·이미지를 편집하고,
            CommonRichTextView는 저장된 JSON 문서를 읽기 전용으로 렌더링합니다.
          </p>
          <div className={s.editorDemo}>
            <CommonRichTextEditor
              id="guide-rich-text"
              label="가이드 에디터 예제"
              value={editorDocument}
              onChange={(document) => setEditorDocument(document)}
            />
            <h4>읽기 전용 출력 예제</h4>
            <CommonRichTextView value={textDocument('저장된 본문은 이렇게 보입니다.')} />
          </div>
          <h3>첨부 링크와 파일 업로드</h3>
          <p>
            CommonAssetLinks는 이미 업로드된 파일의 다운로드 링크를 표시합니다.
            CommonFileUpload는 파일을 개발 서버의 파일 저장소에 실제로 올립니다.
            업로드된 파일을 프로젝트에 연결하는 것은 별도 저장 단계이며 이
            예제에서는 연결하지 않습니다.
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
          <CommonFileUpload
            label="파일 업로드 예제"
            onUploaded={(asset) =>
              setNotice(`업로드 완료: ${asset.name} · 이 가이드 예제에서는 프로젝트에 연결하지 않습니다.`)
            }
          />
          <p role="status">{notice}</p>
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
            디자인은 사이트 CSS로 구성하고 모달의 포커스 제한과 배경 접근 차단은
            Mantine Modal이 처리합니다. 삭제 확인·취소 선택이나
            자동으로 사라지는 토스트는 별도 용도입니다.
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
      {tab === 'feedback' && (
        <section className={s.section}>
          <h2>Mantine Alert · 확인 Modal</h2>
          <p>
            OZ 공통 알림·확인은 현재 디자인을 유지합니다. 아래는 Mantine 기본
            Alert와 Modal/Button을 조합한 비교 예제입니다.
          </p>
          <MantineAlert title="Mantine Alert 예제" color="violet" mb="md">
            페이지 안에 상태나 오류를 표시하는 인라인 알림입니다.
          </MantineAlert>
          <MantineButton onClick={() => setMantineConfirmOpen(true)}>
            Mantine 확인 Modal 열기
          </MantineButton>
          <pre className={s.code}>
            {'<Alert title="알림" color="violet">내용</Alert>\n<Modal opened={open} onClose={close} title="확인">...'}
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
      <MantineModal
        opened={tab === 'feedback' && mantineConfirmOpen}
        onClose={() => setMantineConfirmOpen(false)}
        centered
        title="Mantine 확인"
      >
        <p>이 동작을 계속할까요?</p>
        <div className={s.row}>
          <MantineButton
            onClick={() => {
              setMantineConfirmOpen(false);
              setNotice('Mantine 확인을 눌렀습니다.');
            }}
          >
            확인
          </MantineButton>
          <MantineButton
            variant="default"
            onClick={() => setMantineConfirmOpen(false)}
          >
            취소
          </MantineButton>
        </div>
      </MantineModal>
      {tab === 'ui' && (
        <section id="examples" className={s.section}>
          <h2>UI 예제</h2>
          <h3>CommonButton · CommonButtonLink</h3>
          <p>
            CommonButton은 저장·열기 같은 동작을 하는 button이고,
            CommonButtonLink는 주소 이동을 하는 링크입니다. 링크는 새 탭 열기,
            주소 복사와 같은 브라우저 동작을 유지합니다. Mantine Button은 이 두
            용도를 모두 지원하며 공통 컴포넌트는 OZ 스타일과 역할을 고정합니다.
            크기는 sm / md / lg, 모양은 neutral / primary / ghost입니다.
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
            <MantineButton variant="light">Mantine Button</MantineButton>
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
          <h3>Mantine Menu</h3>
          <p>
            선택 메뉴는 화살표 키로 이동하고 Enter로 선택하거나 Escape로 닫을 수
            있습니다.
          </p>
          <Menu>
            <Menu.Target>
              <CommonButton>보기: {choice} ▾</CommonButton>
            </Menu.Target>
            <Menu.Dropdown>
              <Menu.RadioGroup value={choice} onChange={setChoice}>
                <Menu.RadioItem value="목록">목록</Menu.RadioItem>
                <Menu.RadioItem value="카드">카드</Menu.RadioItem>
              </Menu.RadioGroup>
            </Menu.Dropdown>
          </Menu>
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
