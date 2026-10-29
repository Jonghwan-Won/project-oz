'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import s from './admin.module.css';
const menus = [
  ['/admin', '대시보드'],
  ['/admin/projects', '프로젝트 관리'],
  ['/admin/board', '게시글 관리'],
  ['/admin/inquiries', '문의사항 관리'],
  ['/admin/codes', '공통코드 관리'],
  ['/admin/assets', '첨부파일 관리'],
];
export function AdminNav({ admin = false }: { admin?: boolean }) {
  const pathname = usePathname().replace(/\/$/, '');
  return (
    <nav className={s.nav} aria-label="관리자 메뉴">
      {menus.map(([href, label]) =>
        !admin && ['/admin/inquiries', '/admin/codes'].includes(href) ? (
          <button key={href} type="button" disabled title="관리자 전용 메뉴">
            {label}
          </button>
        ) : (
          <Link
            key={href}
            href={href}
            aria-current={
              pathname === href ||
              (href !== '/admin' && pathname.startsWith(href + '/'))
                ? 'page'
                : undefined
            }
          >
            {label}
          </Link>
        ),
      )}
    </nav>
  );
}
