'use client';
import { TextArea } from '@/components/ui/TextArea';
import { SelectBox } from '@/components/ui/SelectBox';
import { FilePicker } from '@/components/ui/FilePicker';
import { Modal } from '@/components/ui/Modal';
import { Input } from '@/components/ui/Input';

import { useState } from 'react';
import { Button, ButtonLink } from '@/components/ui/Button';
import { OzAlert } from '@/components/ui/OzAlert';
import * as Menu from '@/components/ui/DropdownMenu';
import s from './guide.module.css';

export function GuideExamples() {
  const [modalOpen, setModalOpen] = useState(false);
  const [workKind, setWorkKind] = useState('PERSONAL');
  const [choice, setChoice] = useState('목록');
  const [notice, setNotice] = useState('버튼을 눌러 동작을 확인하세요.');
  const [start, setStart] = useState('');
  const [end, setEnd] = useState('');
  const [pending, setPending] = useState(false);
  const [result, setResult] = useState('아직 호출하지 않았습니다.');
  const [alert, setAlert] = useState<{
    width?: number;
    content: string;
    variant?: 'default' | 'error';
  } | null>(null);

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
      <section className={s.section} id="form-controls">
        <h2>공통 폼 · 모달</h2>
        <p>
          SelectBox는 값 선택, DropdownMenu는 동작 메뉴에 사용합니다. 파일
          예제는 선택만 하며 업로드하지 않습니다.
        </p>
        <div className={s.row}>
          <label>
            제목
            <Input placeholder="프로젝트 제목" />
          </label>
          <label>
            소개
            <TextArea placeholder="소개를 입력하세요" />
          </label>
          <label>
            작업 구분
            <SelectBox
              aria-label="작업 구분 예제"
              value={workKind}
              onValueChange={setWorkKind}
              options={[
                { value: 'PERSONAL', label: '개인' },
                { value: 'COMPANY', label: '회사' },
              ]}
            />
          </label>
          <FilePicker label="첨부파일 선택 예제" onSelect={() => {}} />
          <Button onClick={() => setModalOpen(true)}>공통 모달 열기</Button>
        </div>
        <Modal
          open={modalOpen}
          title="프로젝트 등록"
          onClose={() => setModalOpen(false)}
          actions={
            <>
              <Button variant="primary" onClick={() => setModalOpen(false)}>
                저장
              </Button>
              <Button onClick={() => setModalOpen(false)}>취소</Button>
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
        </Modal>
      </section>
      <section id="alerts" className={s.section}>
        <h2>OzAlert · 사이트 공통 알림</h2>
        <p>
          일반 안내는 메인 색상, 오류는 빨간 그라데이션으로 구분합니다. 제목과
          아이콘 없이 본문과 회색 확인 버튼을 사용합니다. 기본 너비는 360px이며
          width로 조정할 수 있습니다. 작은 화면에서는 화면 너비에 맞춥니다.
          확인이 필요한 짧은 안내에 사용하며, 확인 버튼이나 Escape로 닫으면 원래
          버튼으로 포커스가 돌아옵니다. 배경 클릭으로는 닫히지 않습니다.
        </p>
        <div className={s.row}>
          <Button
            onClick={() =>
              setAlert({
                content: '변경 사항을 저장했어요.\n다음 작업을 이어가 볼까요?',
              })
            }
          >
            기본 알림 예제
          </Button>
          <Button
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
          </Button>
          <Button
            onClick={() =>
              setAlert({
                content: '너비를 480px로 지정한 알림입니다.',
                width: 480,
              })
            }
          >
            넓은 알림 예제
          </Button>
        </div>
        <pre className={s.code}>
          {
            '// 기본값: variant="default", width={360}\n<OzAlert\n  open={open}\n  onClose={() => setOpen(false)}\n  content="변경 사항을 저장했어요."\n/>\n\n<OzAlert\n  open={errorOpen}\n  onClose={() => setErrorOpen(false)}\n  variant="error"\n  width={480}\n  content="네트워크 연결을 확인해 주세요."\n  confirmLabel="닫기"\n/>'
          }
        </pre>
        <p>
          디자인은 사이트 CSS로 구성하고 모달의 포커스 제한과 배경 접근 차단은
          브라우저의 dialog 기능을 사용합니다. 삭제 확인·취소 선택이나 자동으로
          사라지는 토스트는 별도 용도입니다.
        </p>
      </section>
      <OzAlert
        open={alert !== null}
        onClose={() => setAlert(null)}
        width={alert?.width}
        variant={alert?.variant}
        content={alert?.content ?? ''}
      />
      <section id="examples" className={s.section}>
        <h2>UI 예제</h2>
        <h3>Button · ButtonLink</h3>
        <p>
          동작에는 Button, 페이지 이동에는 ButtonLink를 사용합니다. 크기는 sm /
          md / lg, 모양은 neutral / primary / ghost입니다.
        </p>
        <div className={s.row}>
          <Button
            variant="primary"
            onClick={() => setNotice('Primary 버튼을 눌렀습니다.')}
          >
            주요 동작
          </Button>
          <Button onClick={() => setNotice('Neutral 버튼을 눌렀습니다.')}>
            기본 동작
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setNotice('Ghost 버튼을 눌렀습니다.')}
          >
            보조 동작
          </Button>
          <Button disabled>사용 불가</Button>
          <ButtonLink href="/projects">프로젝트로 이동</ButtonLink>
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
              <Button
                key={size}
                variant={variant}
                size={size}
                onClick={() => setNotice(variant + ' / ' + size + ' 클릭')}
              >
                {variant} · {size}
              </Button>
            ))}
          </div>
        ))}
        <pre className={s.code}>
          {
            '<Button type="submit" variant="primary">저장</Button>\n<Button variant="neutral" onClick={onCancel}>취소</Button>'
          }
        </pre>
        <p role="status">{notice}</p>
        <pre className={s.code}>
          {
            '<Button variant="primary" onClick={handleClick}>저장</Button>\n<ButtonLink href="/projects">프로젝트</ButtonLink>'
          }
        </pre>
        <h3>Dropdown · Radix UI</h3>
        <p>
          기존 공통 DropdownMenu를 사용합니다. 화살표 키로 이동하고 Enter로
          선택하거나 Escape로 닫을 수 있습니다.
        </p>
        <Menu.Root>
          <Menu.Trigger asChild>
            <Button>보기: {choice} ▾</Button>
          </Menu.Trigger>
          <Menu.Content>
            <Menu.RadioGroup value={choice} onValueChange={setChoice}>
              <Menu.RadioItem value="목록">목록</Menu.RadioItem>
              <Menu.RadioItem value="카드">카드</Menu.RadioItem>
            </Menu.RadioGroup>
          </Menu.Content>
        </Menu.Root>
        <h3>Input · 날짜 · 기간</h3>
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
            <Input
              name="title"
              required
              maxLength={80}
              placeholder="테스트 제목"
            />
          </label>
          <label>
            날짜
            <Input name="date" type="date" />
          </label>
          <fieldset>
            <legend>기간 선택</legend>
            <div className={s.row}>
              <label>
                시작일
                <Input
                  name="start"
                  type="date"
                  value={start}
                  max={end || undefined}
                  onChange={(event) => setStart(event.target.value)}
                />
              </label>
              <label>
                종료일
                <Input
                  name="end"
                  type="date"
                  value={end}
                  min={start || undefined}
                  onChange={(event) => setEnd(event.target.value)}
                />
              </label>
            </div>
          </fieldset>
          <Button type="submit">입력 확인</Button>
        </form>
        <p>
          날짜 값은 YYYY-MM-DD입니다. 시각이 없는 날짜를 UTC 시각으로 임의
          변환하지 않습니다. 서버에 저장할 때는 서버에서도 검증해야 합니다.
        </p>
        <pre className={s.code}>
          {
            '<label>제목<Input name="title" required maxLength={80} /></label>\n<label>날짜<Input name="date" type="date" /></label>'
          }
        </pre>
      </section>
      <section id="api" className={s.section}>
        <h2>API → 서버 → 개발 DB</h2>
        <p>
          첫 버튼은 API 응답만, 두 번째는 DATABASE_URL을 사용해 SELECT 1을
          실행합니다. 테이블 생성·데이터 저장은 하지 않습니다. 실패 시 HTTP
          상태와 안내를 확인하세요.
        </p>
        <div className={s.row}>
          <Button onClick={() => callApi('api')} disabled={pending}>
            API 호출
          </Button>
          <Button
            variant="primary"
            onClick={() => callApi('database')}
            disabled={pending}
          >
            DB 연결 확인
          </Button>
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
    </>
  );
}
