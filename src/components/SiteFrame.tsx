'use client';

import { usePathname } from 'next/navigation';
import Link from 'next/link';
import type { ReactNode } from 'react';
import { PortfolioHeader } from '@/app/Interactive';
import s from '@/app/home.module.css';

export function SiteFrame({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  if (pathname === '/') return children;
  return (
    <div className={`${s.page} ${s.innerPage}`}>
      <PortfolioHeader />
      {children}
      <footer className={s.footer}>
        <div className={s.legal}>
          <p>© {new Date().getFullYear()} Won Jonghwan. All rights reserved.</p>
          <nav aria-label="주요 페이지">
            <Link href="/">홈</Link>
            <Link href="/projects">프로젝트</Link>
            <Link href="/board">Blog</Link>
            <Link href="/lab">실험실</Link>
            <Link href="/guide">UI 가이드</Link>
            <Link href="/admin">관리자</Link>
          </nav>
        </div>
      </footer>
    </div>
  );
}
