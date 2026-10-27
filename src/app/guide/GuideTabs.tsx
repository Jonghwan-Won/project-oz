'use client';

import Link from 'next/link';
import { useState, type KeyboardEvent } from 'react';
import { GuideExamples } from './GuideExamples';
import s from './guide.module.css';

const tabs = [
  ['ui', '공통 UI'],
  ['feedback', '알림 · 확인'],
  ['loading', '로딩'],
  ['api', 'API'],
  ['environment', '개발 · 환경'],
] as const;

const colors = [
  ['--accent', '주 강조색 · #BAACFF'],
  ['--accent-blue', '블루 보조색 · #86BAFF'],
  ['--on-accent', '강조 배경 위 글자'],
  ['--accent-ink', '강조 글자 · 포커스'],
  ['--bg', '페이지 배경'],
  ['--surface', '입력 · 메뉴 표면'],
  ['--ink', '본문 글자'],
  ['--muted', '보조 글자'],
  ['--secondary', '보조색 · 중립 회색'],
  ['--line', '테두리'],
];

export function GuideTabs() {
  const [active, setActive] = useState<(typeof tabs)[number][0]>('ui');
  function moveTab(event: KeyboardEvent<HTMLButtonElement>, index: number) {
    const next =
      event.key === 'ArrowRight'
        ? (index + 1) % tabs.length
        : event.key === 'ArrowLeft'
          ? (index + tabs.length - 1) % tabs.length
          : event.key === 'Home'
            ? 0
            : event.key === 'End'
              ? tabs.length - 1
              : -1;
    if (next < 0) return;
    event.preventDefault();
    setActive(tabs[next][0]);
    document.getElementById(`tab-${tabs[next][0]}`)?.focus();
  }
  return (
    <div className={`page ${s.guide}`}>
      <h1>
        개발 가이드
        <span className="accentDot" />
      </h1>
      <p>
        공통 UI와 개발 환경 정보를 주제별 탭으로 확인합니다. npm run dev에서만
        열립니다.
      </p>
      <div className={s.tabs} role="tablist" aria-label="가이드 항목">
        {tabs.map(([id, label], index) => (
          <button
            key={id}
            id={`tab-${id}`}
            role="tab"
            tabIndex={active === id ? 0 : -1}
            aria-selected={active === id}
            aria-controls={`panel-${id}`}
            onKeyDown={(event) => moveTab(event, index)}
            onClick={() => setActive(id)}
          >
            {label}
          </button>
        ))}
      </div>
      {tabs.map(([id]) => (
        <section
          key={id}
          id={`panel-${id}`}
          role="tabpanel"
          aria-labelledby={`tab-${id}`}
          hidden={active !== id}
        >
          {id === 'ui' && (
            <>
              <section className={s.section}>
                <h2>색상과 테마</h2>
                <p>
                  헤더의 테마 버튼으로 다크·라이트를 비교하세요. 실제 UI에서는
                  색상값 대신 CSS 변수를 사용합니다.
                </p>
                <div className={s.colors}>
                  {colors.map(([token, label]) => (
                    <div className={s.swatch} key={token}>
                      <span
                        className={s.chip}
                        style={{ background: `var(${token})` }}
                      />
                      <div>
                        <code>{token}</code>
                        <p>{label}</p>
                      </div>
                    </div>
                  ))}
                </div>
                <pre className={s.code}>
                  {
                    'background: var(--accent);\ncolor: var(--on-accent);\n/* 작은 강조 글자와 포커스에는 var(--accent-ink) */'
                  }
                </pre>
              </section>
              <GuideExamples tab="ui" />
            </>
          )}
          {id === 'feedback' && <GuideExamples tab="feedback" />}
          {id === 'loading' && <GuideExamples tab="loading" />}
          {id === 'api' && <GuideExamples tab="api" />}
          {id === 'environment' && (
            <>
              <section className={s.section}>
                <h2>개발 환경에서 확인할 수 있는 것</h2>
                <p>
                  이 화면과 가이드 API는 개발 환경에서만 열립니다. 브라우저는
                  DB에 직접 연결하지 않고, 서버가 필요한 검사만 수행합니다.
                </p>
                <div className={s.tableWrap}>
                  <table>
                    <caption>
                      개발 가이드에서 제공하는 검사 범위
                    </caption>
                    <thead>
                      <tr>
                        <th>검사</th>
                        <th>실제 동작</th>
                        <th>검사하지 않는 것</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr>
                        <th>API 응답</th>
                        <td>/api/guide에서 서버 시각과 성공 응답을 반환합니다.</td>
                        <td>DB 연결 여부</td>
                      </tr>
                      <tr>
                        <th>DB 연결</th>
                        <td>서버의 DATABASE_URL로 SELECT 1을 실행합니다.</td>
                        <td>테이블 생성·migration·데이터 변경</td>
                      </tr>
                      <tr>
                        <th>운영 환경</th>
                        <td>/guide와 가이드 API는 404를 반환합니다.</td>
                        <td>개발 검사 API 사용</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
                <p>
                  로그인·세션·역할 기반 권한은 아직 구현되지 않았습니다. 이 표는
                  접근 권한표가 아니라 현재 가이드 기능의 동작 범위입니다.
                </p>
                <Link className="textLink" href="/guide/environment">
                  개발·운영 환경 구조도 열기 →
                </Link>
              </section>
            </>
          )}
        </section>
      ))}
    </div>
  );
}
