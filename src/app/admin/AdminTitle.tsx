'use client';

import { usePathname } from 'next/navigation';

const titles: Record<string, string> = {
  '/admin': '대시보드',
  '/admin/projects': '프로젝트 관리',
  '/admin/board': '게시판 관리',
  '/admin/categories': '분류 관리',
  '/admin/media': '미디어 관리',
  '/admin/settings': '사이트 관리',
};

export function AdminTitle() {
  const pathname = usePathname();
  return <h1>{titles[pathname.replace(/\/$/, '')] ?? '관리자'}</h1>;
}
