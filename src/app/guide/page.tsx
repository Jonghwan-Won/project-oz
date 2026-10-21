import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { GuideExamples } from './GuideExamples';
import s from './guide.module.css';

export const metadata: Metadata = {
  title: '개발 가이드',
  robots: { index: false, follow: false },
};

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

export default function Guide() {
  if (process.env.NODE_ENV !== 'development') notFound();
  return (
    <div className={`page ${s.guide}`}>
      <span className="eyebrow">DEVELOPMENT GUIDE</span>
      <h1>
        만들면서 확인하는 가이드<span className="accentDot"></span>
      </h1>
      <p>
        이 사이트의 UI 사용법과 API·DB 연결을 확인하는 개발 전용 페이지입니다.
        npm run dev에서만 열립니다.
      </p>
      <nav className={s.row} aria-label="가이드 목차">
        <Link className="textLink" href="/guide/ideas">
          아이디어 저장소 초안 ↗
        </Link>
        <Link className="textLink" href="/guide/markdown">
          Markdown 뷰어 ↗
        </Link>
        <Link className="textLink" href="/guide/environment">
          환경 구조도 ↗
        </Link>
        <a className="textLink" href="#colors">
          색상
        </a>
        <a className="textLink" href="#examples">
          UI 예제
        </a>
        <a className="textLink" href="#alerts">
          공통 알림
        </a>
        <a className="textLink" href="#roles">
          역할
        </a>
        <a className="textLink" href="#api">
          API 테스트
        </a>
      </nav>
      <section id="colors" className={s.section}>
        <h2>색상과 테마</h2>
        <p>
          블루·바이올렛 계열을 강조색으로 사용합니다. 헤더의 테마 버튼으로
          다크·라이트를 비교하세요. 실제 UI에서는 색상값 대신 CSS 변수를
          사용합니다.
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
      <GuideExamples />
      <section id="roles" className={s.section}>
        <h2>역할과 접근 규칙</h2>
        <p>
          아래는 docs/04-security.md의 설계입니다. 로그인·세션·역할 검사는 아직
          구현되지 않았습니다. UI 버튼을 숨기는 것만으로 권한을 보장하지
          않습니다.
        </p>
        <div className={s.tableWrap}>
          <table>
            <caption>계획된 사이트 역할 — PostgreSQL 계정과 별개</caption>
            <thead>
              <tr>
                <th>역할</th>
                <th>공개 콘텐츠</th>
                <th>문의</th>
                <th>운영 관리</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <th>비로그인</th>
                <td>조회</td>
                <td>불가</td>
                <td>불가</td>
              </tr>
              <tr>
                <th>MEMBER</th>
                <td>조회</td>
                <td>작성 · 본인 것만 조회</td>
                <td>불가</td>
              </tr>
              <tr>
                <th>ADMIN</th>
                <td>조회</td>
                <td>inquiry.manage 권한</td>
                <td>기능별 permission 검사</td>
              </tr>
            </tbody>
          </table>
        </div>
        <p>
          DB 계정은 앱 실행용 oz_dev_app과 구조 변경용 oz_dev_admin으로
          분리합니다. 브라우저가 DB에 직접 접속하지 않습니다.
        </p>
      </section>
    </div>
  );
}
