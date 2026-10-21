import { redirect } from 'next/navigation';
import Link from 'next/link';
import type { Metadata } from 'next';
import s from './admin.module.css';

export const dynamic = 'force-dynamic';
export const metadata: Metadata = {
  title: '개발 관리자',
  robots: { index: false, follow: false },
};

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // shortcut: 개발 전용 화면 초안, 실제 저장을 연결할 때 서버 세션·권한 검사 추가.
  if (process.env.NODE_ENV !== 'development') redirect('/login');
  return (
    <div className={`page ${s.shell}`}>
      <div className={s.intro}>
        <span className="eyebrow">OZ / DEVELOPMENT ADMIN</span>
        <h1>콘텐츠 관리</h1>
        <p>
          개발 모드 전용 화면 초안입니다. 변경은 현재 화면에만 유지되며
          새로고침·메뉴 이동 시 초기화됩니다. DB 저장·실제 사이트 반영·파일
          업로드는 연결하지 않았습니다.
        </p>
      </div>
      <div className={s.workspace}>
        <nav className={s.nav} aria-label="관리자 메뉴">
          <Link href="/admin">대시보드</Link>
          <Link href="/admin/projects">프로젝트 등록·관리</Link>
          <Link href="/admin/board">게시판 등록·관리</Link>
          <Link href="/admin/categories">분류 관리 · 준비</Link>
          <Link href="/admin/media">미디어 관리 · 준비</Link>
          <Link href="/admin/settings">사이트 설정 · 준비</Link>
          <Link href="/guide">개발 가이드 ↗</Link>
        </nav>
        <div className={s.main}>{children}</div>
      </div>
    </div>
  );
}
