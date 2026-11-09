'use client';

import {
  useEffect,
  useId,
  useLayoutEffect,
  useRef,
  useState,
  type CSSProperties,
  type KeyboardEvent as ReactKeyboardEvent,
  type MouseEvent,
  type ReactNode,
} from 'react';
import s from './home.module.css';
import { usePathname } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { technologyIcons } from '@/lib/technology-icons';
import { LanguageSwitcher } from '@/components/LanguageSwitcher';
import { ThemeToggle } from '@/components/ThemeToggle';
import type { Locale } from '@/i18n/locale';
import type { Messages } from '@/i18n/ko';
import type { PortfolioMessages } from '@/i18n/portfolio-ko';
import type { Theme } from '@/theme/theme';

/** 헤더 오른쪽 언어·테마 버튼에 필요한 현재 값과 문구. 서버에서 쿠키로 정해 넘긴다. */
export type HeaderSettings = {
  locale: Locale;
  theme: Theme;
  labels: {
    language: Messages['language'];
    theme: Messages['theme'];
    header: PortfolioMessages['header'];
    footerNav: PortfolioMessages['footerNav'];
  };
};
type HeaderLabels = PortfolioMessages['header'];

const sections = ['profile', 'projects', 'works'] as const;

/** 모바일 메뉴에서 섹션 목록 아래 구분선 다음에 보여주는 페이지. */
const menuPages = [
  ['/lab', 'lab'],
  ['/admin', 'admin'],
  ['/guide', 'guide'],
] as const;

const externalLinks = [
  ['https://github.com/Jonghwan-Won', 'GitHub'],
  ['/board', 'Blog'],
] as const;

function reducedMotion() {
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

function RollText({ text }: { text: string }) {
  return (
    <span className={s.roll}>
      <span>{text}</span>
      <span aria-hidden="true">{text}</span>
    </span>
  );
}

function ExternalHint({ href, label }: { href: string; label: string }) {
  return href.startsWith('http') ? (
    <span className="srOnly">{label}</span>
  ) : null;
}

/** 맨 위로 이동하되 주소창에 #해시를 남기지 않는다. */
function scrollToTop(event: MouseEvent<HTMLAnchorElement>) {
  if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
  event.preventDefault();
  window.scrollTo({ top: 0, behavior: reducedMotion() ? 'auto' : 'smooth' });
  if (window.location.hash)
    window.history.replaceState(
      window.history.state,
      '',
      window.location.pathname + window.location.search,
    );
}

export function ScrollTopLink({
  className,
  children,
  label,
}: {
  className?: string;
  children: ReactNode;
  label?: string;
}) {
  return (
    <a
      href="#portfolio"
      className={className}
      aria-label={label}
      onClick={scrollToTop}
    >
      {children}
    </a>
  );
}

/** 홈에서는 해당 섹션으로 부드럽게 이동하고, 다른 페이지에서는 링크(/#id)를 그대로 따른다. */
function goToSection(event: MouseEvent<HTMLAnchorElement>, id: string) {
  if (window.location.pathname !== '/') return;
  if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
  const target = document.getElementById(id);
  if (!target) return;
  event.preventDefault();
  target.focus({ preventScroll: true });
  target.scrollIntoView({ behavior: reducedMotion() ? 'instant' : 'smooth' });
  // 부드러운 스크롤 도중 위쪽 이미지가 로드되어 높이가 바뀌면 목표에서 어긋난다.
  // 스크롤이 끝났을 때 구분선이 헤더 바로 아래에 오지 않았으면 한 번 더 맞춘다.
  const align = () => {
    window.clearTimeout(giveUp);
    const margin = parseFloat(getComputedStyle(target).scrollMarginTop) || 0;
    if (Math.abs(target.getBoundingClientRect().top - margin) > 2)
      target.scrollIntoView({ behavior: 'instant' });
  };
  window.addEventListener('scrollend', align, { once: true });
  const giveUp = window.setTimeout(
    () => window.removeEventListener('scrollend', align),
    2000,
  );
  if (window.location.hash)
    window.history.replaceState(
      window.history.state,
      '',
      window.location.pathname + window.location.search,
    );
}

function externalProps(href: string) {
  return href.startsWith('http') ? { target: '_blank', rel: 'noreferrer' } : {};
}

export function PortfolioHeader({ settings }: { settings: HeaderSettings }) {
  const text = settings.labels.header;
  const pathname = usePathname();
  const [active, setActive] = useState('');
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const menuButtonRef = useRef<HTMLButtonElement>(null);

  // 메뉴가 열린 동안 뒤 화면 스크롤을 막고, Esc나 넓은 화면 전환 시 닫는다.
  useEffect(() => {
    if (!menuOpen) return;
    const root = document.documentElement;
    const previous = root.style.overflow;
    const previousGutter = root.style.scrollbarGutter;
    // 스크롤바가 사라지며 폭이 넓어지면 글줄이 다시 감겨 본문이 위아래로 밀린다.
    // 스크롤바 자리를 그대로 남겨 폭을 고정한다(겹쳐 그리는 모바일 스크롤바에는 영향 없음).
    root.style.scrollbarGutter = 'stable';
    root.style.overflow = 'hidden';
    const onKey = (event: KeyboardEvent) => {
      if (event.key !== 'Escape') return;
      setMenuOpen(false);
      menuButtonRef.current?.focus();
    };
    const wide = window.matchMedia('(min-width: 1024px)');
    const onWide = () => {
      if (wide.matches) setMenuOpen(false);
    };
    window.addEventListener('keydown', onKey);
    wide.addEventListener('change', onWide);
    return () => {
      root.style.overflow = previous;
      root.style.scrollbarGutter = previousGutter;
      window.removeEventListener('keydown', onKey);
      wide.removeEventListener('change', onWide);
    };
  }, [menuOpen]);
  const closeMenu = () => setMenuOpen(false);

  useEffect(() => {
    const update = () => {
      let current = '';
      for (const id of sections) {
        const top =
          document.getElementById(id)?.getBoundingClientRect().top ?? Infinity;
        if (top <= window.innerHeight * 0.35) current = id;
      }
      setActive(current);
      setScrolled(window.scrollY > 8);
    };
    update();
    window.addEventListener('scroll', update, { passive: true });
    window.addEventListener('resize', update);
    return () => {
      window.removeEventListener('scroll', update);
      window.removeEventListener('resize', update);
    };
  }, [pathname]);

  // 스크롤 등장 효과. JS나 모션이 꺼져 있으면 data-motion이 없어 처음부터 모두 보인다.
  useEffect(() => {
    const root = document.getElementById('portfolio');
    if (!root || reducedMotion() || !('IntersectionObserver' in window)) return;
    root
      .querySelectorAll('section > p, section article, section > ul > li')
      .forEach((element, index) => {
        element.setAttribute('data-reveal-item', '');
        if (element instanceof HTMLElement)
          element.style.setProperty('--reveal-delay', `${(index % 3) * 80}ms`);
      });
    root.dataset.motion = 'on';
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (!entry.isIntersecting) continue;
          (entry.target as HTMLElement).dataset.visible = 'true';
          observer.unobserve(entry.target);
        }
      },
      { rootMargin: '0px 0px -12% 0px' },
    );
    root
      .querySelectorAll('[data-reveal], [data-reveal-item]')
      .forEach((el) => observer.observe(el));
    return () => {
      observer.disconnect();
      delete root.dataset.motion;
    };
  }, [pathname]);

  // 넓은 화면은 헤더 가운데 독과 오른쪽 링크·설정, 좁은 화면(1023px 이하)은 오른쪽 메뉴 버튼이 맡는다.
  return (
    <header
      className={s.header}
      data-scrolled={scrolled || undefined}
      data-menu-open={menuOpen || undefined}
    >
      {pathname === '/' ? (
        <ScrollTopLink className={s.logo} label={text.logoLabel}>
          Jonghwan Won
        </ScrollTopLink>
      ) : (
        <Link href="/" className={s.logo}>
          Jonghwan Won
        </Link>
      )}
      <SectionDock active={active} labels={text} />
      <div className={s.headerEnd}>
        <ul className={s.headerLinks}>
          {externalLinks.map(([href, label]) => (
            <li key={href}>
              <a href={href} {...externalProps(href)}>
                <RollText text={label} />
                <ExternalHint href={href} label={text.newWindow} />
              </a>
            </li>
          ))}
        </ul>
        <span className={s.headerDivider} aria-hidden="true" />
        <div className={s.headerSettings}>
          <LanguageSwitcher
            className={s.settingButton}
            locale={settings.locale}
            labels={settings.labels.language}
          />
          <ThemeToggle
            className={s.settingButton}
            theme={settings.theme}
            labels={settings.labels.theme}
          />
        </div>
      </div>
      <div className={s.mobileBar}>
        <div className={s.mobileSettings}>
          <ThemeToggle
            className={s.settingButton}
            theme={settings.theme}
            labels={settings.labels.theme}
          />
          <LanguageSwitcher
            className={s.settingButton}
            locale={settings.locale}
            labels={settings.labels.language}
          />
        </div>
        <button
          ref={menuButtonRef}
          type="button"
          className={s.menuButton}
          aria-expanded={menuOpen}
          aria-controls="p2-side-nav"
          aria-label={menuOpen ? text.menuClose : text.menuOpen}
          onClick={() => setMenuOpen((open) => !open)}
        >
          <span aria-hidden="true" />
          <span aria-hidden="true" />
          <span aria-hidden="true" />
        </button>
      </div>
      <div
        className={s.sideNavBackdrop}
        aria-hidden="true"
        onClick={closeMenu}
      />
      <aside
        id="p2-side-nav"
        className={s.sideNav}
        aria-label={text.menu}
        inert={!menuOpen}
      >
        <div className={s.sideNavCurve} aria-hidden="true">
          <span />
        </div>
        <div className={s.sideNavInner}>
          <div>
            <nav aria-label={text.sectionNav}>
              <ol className={s.sideNavSections}>
                {sections.map((id, index) => (
                  <li key={id}>
                    <a
                      href={'/#' + id}
                      aria-current={active === id ? 'location' : undefined}
                      onClick={(event) => {
                        // 스크롤 잠금(overflow: hidden)을 먼저 풀어야 이동 도중 끊기지 않는다.
                        document.documentElement.style.overflow = '';
                        closeMenu();
                        goToSection(event, id);
                      }}
                    >
                      {text.sections[id]}
                      <span aria-hidden="true">0{index + 1}</span>
                    </a>
                  </li>
                ))}
              </ol>
            </nav>
            <ul className={s.sideNavPages}>
              {menuPages.map(([href, key]) => (
                <li key={href}>
                  <Link
                    href={href}
                    aria-current={pathname === href ? 'page' : undefined}
                    onClick={closeMenu}
                  >
                    {text.pages[key]}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
          <ul className={s.sideNavLinks}>
            {externalLinks.map(([href, label]) => (
              <li key={href}>
                <a href={href} {...externalProps(href)} onClick={closeMenu}>
                  {label}
                  <ExternalHint href={href} label={text.newWindow} />
                </a>
              </li>
            ))}
          </ul>
        </div>
      </aside>
    </header>
  );
}

/**
 * 홈 화면의 섹션 독을 글자 버전으로 옮긴 목차.
 * 넓은 화면에서만 헤더 가운데에 보이고, 좁은 화면에서는 메뉴 패널이 대신한다.
 */
function SectionDock({
  active,
  labels,
}: {
  active: string;
  labels: HeaderLabels;
}) {
  const navRef = useRef<HTMLElement>(null);
  const [indicator, setIndicator] = useState<{ x: number; w: number } | null>(
    null,
  );

  useLayoutEffect(() => {
    const nav = navRef.current;
    if (!nav) return;
    const measure = () => {
      const item = nav.querySelector<HTMLElement>('[aria-current]');
      setIndicator(item ? { x: item.offsetLeft, w: item.offsetWidth } : null);
    };
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(nav);
    return () => observer.disconnect();
  }, [active]);

  return (
    <nav
      ref={navRef}
      className={s.dock}
      aria-label={labels.sectionNav}
      style={
        indicator
          ? ({
              '--dock-x': `${indicator.x}px`,
              '--dock-w': `${indicator.w}px`,
            } as CSSProperties)
          : undefined
      }
    >
      <span
        className={s.dockIndicator}
        data-visible={indicator ? true : undefined}
        aria-hidden="true"
      >
        <span key={active} />
      </span>
      {sections.map((id, index) => (
        <a
          key={id}
          href={'/#' + id}
          onClick={(event) => goToSection(event, id)}
          aria-current={active === id ? 'location' : undefined}
        >
          <sup aria-hidden="true">0{index + 1}</sup>
          {labels.sections[id]}
        </a>
      ))}
    </nav>
  );
}

export type StackGroup = {
  label: string;
  items: { name: string; count: number }[];
  notes: string[];
};

/**
 * 기술 이름으로 아이콘 대신 쓸 짧은 표식을 만든다.
 * 예: Spring Boot → SB, JSP → JSP, Java → Ja, Next.js → Ne
 */
function stackMark(name: string) {
  const words = name
    .replace(/\.js$/i, '')
    .split(/[\s/]+/)
    .map((word) => word.replace(/[^a-z0-9]/gi, ''))
    .filter(Boolean);
  if (words.length > 1)
    return words
      .map((word) => word[0])
      .join('')
      .slice(0, 3)
      .toUpperCase();
  const word = words[0] ?? name;
  if (word.length <= 4 && word === word.toUpperCase()) return word;
  return word[0].toUpperCase() + word.slice(1, 2).toLowerCase();
}

export function StackTabs({
  groups,
  labels,
}: {
  groups: StackGroup[];
  labels: PortfolioMessages['stackTabs'];
}) {
  const [selected, setSelected] = useState(0);
  const baseId = useId();
  const tabRefs = useRef<(HTMLButtonElement | null)[]>([]);
  const current = groups[selected] ?? groups[0];
  if (!current) return null;

  const onKeyDown = (event: ReactKeyboardEvent<HTMLDivElement>) => {
    const last = groups.length - 1;
    const next =
      event.key === 'ArrowRight'
        ? selected === last
          ? 0
          : selected + 1
        : event.key === 'ArrowLeft'
          ? selected === 0
            ? last
            : selected - 1
          : event.key === 'Home'
            ? 0
            : event.key === 'End'
              ? last
              : -1;
    if (next < 0) return;
    event.preventDefault();
    setSelected(next);
    tabRefs.current[next]?.focus();
  };

  return (
    <div className={s.stackTabs}>
      <div
        role="tablist"
        aria-label={labels.label}
        className={s.tabs}
        onKeyDown={onKeyDown}
      >
        {groups.map((group, index) => (
          <button
            key={group.label}
            ref={(el) => {
              tabRefs.current[index] = el;
            }}
            type="button"
            role="tab"
            id={`${baseId}-tab-${index}`}
            aria-controls={`${baseId}-panel`}
            aria-selected={index === selected}
            tabIndex={index === selected ? 0 : -1}
            onClick={() => setSelected(index)}
          >
            {group.label}
          </button>
        ))}
      </div>
      <div
        role="tabpanel"
        id={`${baseId}-panel`}
        aria-labelledby={`${baseId}-tab-${selected}`}
        className={s.stackPanel}
      >
        {current.notes.length > 0 && (
          <div className={s.stackMain}>
            <strong>{labels.usage}</strong>
            <ul>
              {current.notes.map((note) => (
                <li key={note}>{note}</li>
              ))}
            </ul>
          </div>
        )}
        <ul className={s.stackGrid}>
          {current.items.map((item) => (
            <li key={item.name}>
              <span
                className={s.stackMark}
                data-main={item.count > 1 || undefined}
                aria-hidden="true"
              >
                {technologyIcons[item.name] ? (
                  <Image
                    src={technologyIcons[item.name]}
                    alt=""
                    width={32}
                    height={32}
                    unoptimized
                    className={s.stackIcon}
                  />
                ) : (
                  stackMark(item.name)
                )}
              </span>
              <strong>{item.name}</strong>
            </li>
          ))}
        </ul>
        <small className={s.iconCredit}>
          {labels.iconCredit}{' '}
          <a href="https://icons8.com/" target="_blank" rel="noreferrer">
            Icons8
          </a>
        </small>
      </div>
    </div>
  );
}

const views = ['large', 'small', 'list'] as const;
type View = (typeof views)[number];

const viewIcons: Record<View, ReactNode> = {
  large: <rect x="3" y="3" width="18" height="18" rx="2" />,
  small: (
    <>
      <rect x="3" y="3" width="7.5" height="7.5" rx="1.5" />
      <rect x="13.5" y="3" width="7.5" height="7.5" rx="1.5" />
      <rect x="3" y="13.5" width="7.5" height="7.5" rx="1.5" />
      <rect x="13.5" y="13.5" width="7.5" height="7.5" rx="1.5" />
    </>
  ),
  list: <path d="M4 6h16M4 12h16M4 18h16" />,
};

export function ProjectViews({
  intro,
  large,
  small,
  list,
  labels,
}: {
  intro: ReactNode;
  large: ReactNode;
  small: ReactNode;
  list: ReactNode;
  labels: PortfolioMessages['views'];
}) {
  const [view, setView] = useState<View>('large');
  return (
    <>
      <div className={s.viewBar}>
        {intro}
        <div className={s.viewSwitch} role="group" aria-label={labels.label}>
          {views.map((id) => (
            <button
              key={id}
              type="button"
              aria-pressed={view === id}
              aria-label={labels[id]}
              onClick={() => setView(id)}
            >
              <svg viewBox="0 0 24 24" aria-hidden="true">
                {viewIcons[id]}
              </svg>
              <span>{labels[id]}</span>
            </button>
          ))}
        </div>
      </div>
      {view === 'large' && <div className={s.features}>{large}</div>}
      {view === 'small' && <div className={s.tiles}>{small}</div>}
      {view === 'list' && list}
    </>
  );
}

export function WorksRail({
  intro,
  cards,
  list,
  labels,
}: {
  intro: ReactNode;
  cards: ReactNode;
  list: ReactNode;
  labels: PortfolioMessages['works'];
}) {
  const [showList, setShowList] = useState(false);
  const [edges, setEdges] = useState({ start: true, end: false });
  const railRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const rail = railRef.current;
    if (!rail) return;
    const update = () =>
      setEdges({
        start: rail.scrollLeft <= 4,
        end: rail.scrollLeft + rail.clientWidth >= rail.scrollWidth - 4,
      });
    update();
    rail.addEventListener('scroll', update, { passive: true });
    window.addEventListener('resize', update);
    return () => {
      rail.removeEventListener('scroll', update);
      window.removeEventListener('resize', update);
    };
  }, [showList]);

  const scroll = (direction: 1 | -1) => {
    const rail = railRef.current;
    if (!rail) return;
    rail.scrollBy({
      left: direction * Math.max(rail.clientWidth * 0.8, 280),
      behavior: reducedMotion() ? 'auto' : 'smooth',
    });
  };

  return (
    <>
      <div className={s.worksHead}>
        {intro}
        <button
          type="button"
          className={s.fillButton}
          aria-pressed={showList}
          onClick={() => setShowList((value) => !value)}
        >
          <RollText text={showList ? labels.showCards : labels.showList} />
        </button>
      </div>
      {showList ? (
        list
      ) : (
        <div className={s.railWrap}>
          <div
            ref={railRef}
            className={s.rail}
            data-start={edges.start}
            data-end={edges.end}
            tabIndex={0}
            role="region"
            aria-label={labels.rail}
          >
            {cards}
          </div>
          <div className={s.railNav}>
            <button
              type="button"
              onClick={() => scroll(-1)}
              disabled={edges.start}
              aria-label={labels.previous}
            >
              ←
            </button>
            <button
              type="button"
              onClick={() => scroll(1)}
              disabled={edges.end}
              aria-label={labels.next}
            >
              →
            </button>
          </div>
        </div>
      )}
    </>
  );
}

/** 누르면 주소를 복사하고, 버튼 문구로 결과를 잠깐 보여 준 뒤 원래대로 돌아간다. */
export function EmailButton({
  email,
  labels,
}: {
  email: string;
  labels: PortfolioMessages['email'];
}) {
  const [state, setState] = useState<'idle' | 'copied' | 'failed'>('idle');
  useEffect(() => {
    if (state === 'idle') return;
    const timer = window.setTimeout(() => setState('idle'), 2000);
    return () => window.clearTimeout(timer);
  }, [state]);
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(email);
      setState('copied');
    } catch {
      setState('failed');
    }
  };
  return (
    <div className={s.emailBox}>
      <button
        type="button"
        onClick={copy}
        data-state={state}
        aria-describedby="p2-email-hint"
      >
        {state === 'idle' ? email : labels[state]}
      </button>
      <p id="p2-email-hint" className="srOnly">
        {labels.hint}
      </p>
      <p className="srOnly" role="status" aria-live="polite">
        {state === 'copied'
          ? labels.copiedStatus.replace('{email}', email)
          : state === 'failed'
            ? labels.failedStatus.replace('{email}', email)
            : ''}
      </p>
    </div>
  );
}
