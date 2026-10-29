'use client';
import Link from 'next/link';
import { CommonLoading } from '@/components/ui/CommonLoading';
import { authClient } from '@/lib/auth-client';
import { LanguageSwitcher } from './LanguageSwitcher';
import { ThemeToggle } from './ThemeToggle';
import type { Theme } from '@/theme/theme';
import type { Locale } from '@/i18n/locale';
import type { Messages } from '@/i18n/ko';
import { BrandLogo } from '@/components/BrandLogo';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useLayoutEffect, useRef, useState } from 'react';
const links = ['home', 'about', 'projects', 'board', 'help'] as const;

export function Header({
  labels,
  locale,
  languageLabels,
  theme,
  themeLabels,
}: {
  labels: Messages['navigation'];
  locale: Locale;
  languageLabels: Messages['language'];
  theme: Theme;
  themeLabels: Messages['theme'];
}) {
  const path = usePathname();
  const router = useRouter();
  const { data: session, isPending } = authClient.useSession();
  const [signingOut, setSigningOut] = useState(false);
  const signOutPending = useRef(false);
  const [signOutError, setSignOutError] = useState(false);
  async function signOut() {
    if (signOutPending.current) return;
    signOutPending.current = true;
    setSigningOut(true);
    setSignOutError(false);
    try {
      const result = await authClient.signOut();
      if (result.error) throw Error('Sign out failed');
      router.replace('/');
      router.refresh();
      signOutPending.current = false;
      setSigningOut(false);
    } catch {
      setSignOutError(true);
      signOutPending.current = false;
      setSigningOut(false);
    }
  }
  const accountLabel = isPending
    ? '…'
    : session
      ? locale === 'en'
        ? 'Sign out'
        : '로그아웃'
      : labels.login;
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const toggle = useRef<HTMLButtonElement>(null);
  const nav = useRef<HTMLElement>(null);
  const [indicator, setIndicator] = useState<{
    left: number;
    top: number;
    width: number;
    height: number;
  } | null>(null);
  useLayoutEffect(() => {
    const element = nav.current?.querySelector<HTMLElement>('a[aria-current]');
    if (!element || !nav.current) {
      setIndicator(null);
      return;
    }
    const update = () => {
      const navRect = nav.current?.getBoundingClientRect();
      const linkRect = element.getBoundingClientRect();
      if (!navRect) return;
      setIndicator({
        left: linkRect.left - navRect.left,
        top: linkRect.top - navRect.top,
        width: linkRect.width,
        height: linkRect.height,
      });
    };
    update();
    const observer = new ResizeObserver(update);
    observer.observe(nav.current);
    observer.observe(element);
    window.addEventListener('resize', update);
    return () => {
      observer.disconnect();
      window.removeEventListener('resize', update);
    };
  }, [path]);
  useEffect(() => {
    const update = () => {
      setScrolled(window.scrollY > 24);
    };
    update();
    window.addEventListener('scroll', update, { passive: true });
    return () => window.removeEventListener('scroll', update);
  }, [path]);
  useEffect(() => {
    if (!open) return;
    const dismiss = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setOpen(false);
        toggle.current?.focus();
      }
    };
    document.addEventListener('keydown', dismiss);
    return () => document.removeEventListener('keydown', dismiss);
  }, [open]);
  return (
    <header
      className={`siteHeader${scrolled ? ' scrolled' : ''}${open ? ' menuOpen' : ''}`}
    >
      <Link
        href="/"
        className="wordmark"
        aria-label={labels.home}
        onClick={() => setOpen(false)}
      >
        <BrandLogo />
      </Link>
      <button
        ref={toggle}
        className="menuToggle"
        aria-label={open ? labels.close : labels.open}
        aria-expanded={open}
        aria-controls="navigation"
        onClick={() => setOpen(!open)}
      >
        {open ? '✕' : '☰'}
      </button>
      <nav
        ref={nav}
        id="navigation"
        aria-label={labels.menu}
        className={open ? 'open' : ''}
      >
        <span
          className="navIndicator"
          aria-hidden="true"
          style={
            indicator
              ? {
                  left: indicator.left,
                  top: indicator.top,
                  width: indicator.width,
                  height: indicator.height,
                  opacity: 1,
                }
              : { opacity: 0 }
          }
        />
        {links.map((id) => (
          <Link
            key={id}
            href={id === 'home' ? '/' : `/${id}`}
            aria-current={
              (id === 'home' ? path === '/' : path === `/${id}`) ||
              (id === 'projects' && path.startsWith('/work/')) ||
              (id === 'board' && path.startsWith('/board/'))
                ? 'page'
                : undefined
            }
            onClick={(event) => {
              if (
                event.metaKey ||
                event.ctrlKey ||
                event.shiftKey ||
                event.altKey
              )
                return;
              setOpen(false);
            }}
          >
            {id === 'home' ? (locale === 'en' ? 'Home' : '홈') : labels[id]}
          </Link>
        ))}
        {session ? (
          <button
            type="button"
            className="mobileLogin authButton"
            disabled={signingOut}
            onClick={signOut}
          >
            {accountLabel}
          </button>
        ) : (
          <Link
            className="mobileLogin"
            href="/login"
            onClick={() => setOpen(false)}
          >
            {accountLabel}
          </Link>
        )}
      </nav>
      <CommonLoading open={signingOut} />
      <div className="headerActions">
        {
          <Link
            className="headerIcon"
            href="/lab"
            aria-label={labels.lab}
            title={labels.lab}
            aria-current={
              path === '/lab' || path.startsWith('/lab/') ? 'page' : undefined
            }
            onClick={() => setOpen(false)}
          >
            <svg
              width="19"
              height="19"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.6"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <path d="M9 3h6M10 3v6l-5.2 9a2 2 0 0 0 1.7 3h11a2 2 0 0 0 1.7-3L13 9V3" />
              <path d="M7.5 16h9" />
            </svg>
          </Link>
        }
        {
          <Link
            className="headerIcon"
            href="/admin"
            aria-label="관리자"
            title="관리자"
            onClick={() => setOpen(false)}
          >
            <svg
              width="19"
              height="19"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.6"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <rect x="3" y="3" width="7" height="7" rx="1" />
              <rect x="14" y="3" width="7" height="7" rx="1" />
              <rect x="3" y="14" width="7" height="7" rx="1" />
              <rect x="14" y="14" width="7" height="7" rx="1" />
            </svg>
          </Link>
        }
        {
          <Link
            className="headerIcon"
            href="/guide"
            aria-label={labels.guide}
            title={labels.guide}
            aria-current={
              path === '/guide' || path.startsWith('/guide/')
                ? 'page'
                : undefined
            }
            onClick={() => setOpen(false)}
          >
            <svg
              width="19"
              height="19"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.6"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <path d="M12 5.5C9 3.5 5.5 3.5 3 4.5v15c2.5-1 6-1 9 1 3-2 6.5-2 9-1v-15c-2.5-1-6-1-9 1Z" />
              <path d="M12 5.5v15" />
            </svg>
          </Link>
        }
        <LanguageSwitcher locale={locale} labels={languageLabels} />
        <ThemeToggle theme={theme} labels={themeLabels} />
        {session ? (
          <button
            type="button"
            className="login authButton"
            disabled={signingOut}
            onClick={signOut}
          >
            {accountLabel}
          </button>
        ) : (
          <Link className="login" href="/login">
            {accountLabel}
          </Link>
        )}
        {signOutError && (
          <span role="alert">
            {locale === 'en'
              ? 'Please try again.'
              : '로그아웃을 다시 시도해 주세요.'}
          </span>
        )}
      </div>
    </header>
  );
}
