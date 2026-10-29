'use client';

import { usePathname } from 'next/navigation';

const titles: Record<string, string> = {
  '/admin': '대시보드',
  '/admin/projects': '프로젝트 관리',
  '/admin/board': '게시글 관리',
  '/admin/inquiries': '문의사항 관리',
  '/admin/codes': '공통코드 관리',
  '/admin/assets': '첨부파일 관리',
};

export function AdminTitle() {
  const pathname = usePathname();
  return (
    <h1>
      {titles[
        pathname.startsWith('/admin/board/')
          ? '/admin/board'
          : pathname.replace(/\/$/, '')
      ] ?? '관리자'}
    </h1>
  );
}
