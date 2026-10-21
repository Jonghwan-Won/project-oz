'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import s from './admin.module.css';
const menus = [
  ['/admin', '대시보드'],
  ['/admin/projects', '프로젝트 관리'],
  ['/admin/board', '게시판 관리'],
  ['/admin/categories', '분류 관리'],
  ['/admin/media', '미디어 관리'],
  ['/admin/settings', '사이트 관리'],
  ['/guide', '개발 가이드 ↗'],
];
export function AdminNav() {
  const pathname = usePathname().replace(/\/$/, '');
  return (
    <nav className={s.nav} aria-label="관리자 메뉴">
      {menus.map(([href, label]) => (
        <Link
          key={href}
          href={href}
          aria-current={pathname === href ? 'page' : undefined}
        >
          {label}
        </Link>
      ))}
    </nav>
  );
}
