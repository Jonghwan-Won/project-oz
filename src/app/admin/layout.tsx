import { headers } from 'next/headers';
import { getAdminSession } from '@/server/auth';
import { AdminNav } from './AdminNav';
import type { Metadata } from 'next';
import s from './admin.module.css';
import { AdminTitle } from './AdminTitle';

export const dynamic = 'force-dynamic';
export const metadata: Metadata = {
  title: '관리자',
  robots: { index: false, follow: false },
};

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const admin = !!(await getAdminSession(await headers()));
  return (
    <div className={`page ${s.shell}`}>
      <div className={s.workspace}>
        <AdminNav admin={admin} />
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
