import { redirect } from 'next/navigation';
import { AdminNav } from './AdminNav';
import type { Metadata } from 'next';
import s from './admin.module.css';
import { AdminTitle } from './AdminTitle';

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
        <AdminTitle />
        <p>
          로컬 개발 관리자입니다. 프로젝트는 개발 DB에 저장되며 공개 설정은 로컬
          공개 화면에도 반영됩니다. 파일은 NAS 개발 저장소를 사용합니다. 게시판
          관리는 아직 화면 초안이며 운영 관리자 인증은 준비 중입니다.
        </p>
      </div>
      <div className={s.workspace}>
        <AdminNav />
        <div className={s.main}>{children}</div>
      </div>
    </div>
  );
}
