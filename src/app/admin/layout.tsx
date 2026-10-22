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
      <div className={s.workspace}>
        <AdminNav />
        <div className={s.main}>
          <div className={s.intro}>
            <AdminTitle />
          </div>
          {children}
        </div>
      </div>
    </div>
  );
}
