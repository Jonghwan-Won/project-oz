'use client';

import { usePathname } from 'next/navigation';
import Link from 'next/link';
import type { ReactNode } from 'react';
import { PortfolioHeader, type HeaderSettings } from '@/app/Interactive';
import s from '@/app/home.module.css';

export function SiteFrame({
  children,
  headerSettings,
}: {
  children: ReactNode;
  headerSettings: HeaderSettings;
}) {
  const pathname = usePathname();
  if (pathname === '/') return children;
  const nav = headerSettings.labels.footerNav;
  return (
    <div className={`${s.page} ${s.innerPage}`}>
      <PortfolioHeader settings={headerSettings} />
      {children}
      <footer className={s.footer}>
        <div className={s.legal}>
          <p>© {new Date().getFullYear()} Won Jonghwan. All rights reserved.</p>
          <nav aria-label={nav.label}>
            <Link href="/">{nav.home}</Link>
            <Link href="/projects">{nav.projects}</Link>
            <Link href="/board">{nav.blog}</Link>
            <Link href="/lab">{nav.lab}</Link>
            <Link href="/guide">{nav.guide}</Link>
            <Link href="/admin">{nav.admin}</Link>
          </nav>
        </div>
      </footer>
    </div>
  );
}
