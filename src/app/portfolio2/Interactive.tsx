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
import s from './portfolio2.module.css';

const sections = [
  ['profile', '프로필'],
  ['projects', '프로젝트'],
  ['works', '작업'],
] as const;

const externalLinks = [
  ['https://github.com/Jonghwan-Won', 'GitHub'],
  ['/board', '기록'],
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

function ExternalHint({ href }: { href: string }) {
  return href.startsWith('http') ? (
    <span className="srOnly"> (새 창)</span>
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
      href="#portfolio2"
      className={className}
      aria-label={label}
      onClick={scrollToTop}
    >
      {children}
    </a>
  );
}

function externalProps(href: string) {
  return href.startsWith('http') ? { target: '_blank', rel: 'noreferrer' } : {};
}

export function PortfolioHeader() {
  const [active, setActive] = useState('');
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const update = () => {
      let current = '';
      for (const [id] of sections) {
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
  }, []);

  // 스크롤 등장 효과. JS나 모션이 꺼져 있으면 data-motion이 없어 처음부터 모두 보인다.
  useEffect(() => {
    const root = document.getElementById('portfolio2');
    if (!root || reducedMotion() || !('IntersectionObserver' in window)) return;
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
      .querySelectorAll('[data-reveal]')
      .forEach((el) => observer.observe(el));
    return () => {
      observer.disconnect();
      delete root.dataset.motion;
    };
  }, []);

  // 섹션 이동은 독(넓은 화면은 헤더 가운데, 좁은 화면은 화면 아래)이 맡는다.
  return (
    <header className={s.header} data-scrolled={scrolled || undefined}>
      <ScrollTopLink className={s.logo} label="포트폴리오 처음으로">
        Jonghwan Won
      </ScrollTopLink>
      <SectionDock active={active} />
      <ul className={s.headerLinks}>
        {externalLinks.map(([href, label]) => (
          <li key={href}>
            <a href={href} {...externalProps(href)}>
              <RollText text={label} />
              <ExternalHint href={href} />
            </a>
          </li>
        ))}
      </ul>
    </header>
  );
}

/**
 * 홈 화면의 섹션 독을 글자 버전으로 옮긴 목차.
 * 넓은 화면에서는 헤더 가운데, 좁은 화면에서는 화면 아래 가운데에 떠 있다.
 */
function SectionDock({ active }: { active: string }) {
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
      aria-label="포트폴리오 섹션"
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
      {sections.map(([id, label], index) => (
        <a
          key={id}
          href={'#' + id}
          aria-current={active === id ? 'location' : undefined}
        >
          <sup aria-hidden="true">0{index + 1}</sup>
          {label}
        </a>
      ))}
    </nav>
  );
}

const clockFormat = (timeZone: string) =>
  new Intl.DateTimeFormat('ko-KR', {
    timeZone,
    hour: '2-digit',
    minute: '2-digit',
    hourCycle: 'h23',
  });

export function HeroClock({ className }: { className?: string }) {
  const [now, setNow] = useState<Date | null>(null);
  useEffect(() => {
    const tick = () => setNow(new Date());
    tick();
    const timer = window.setInterval(tick, 15_000);
    return () => window.clearInterval(timer);
  }, []);
  const utc = now ? clockFormat('UTC').format(now) : '--:--';
  const seoul = now ? clockFormat('Asia/Seoul').format(now) : '--:--';
  return (
    <p className={className}>
      <time dateTime={now?.toISOString()}>
        UTC {utc} / Seoul {seoul}
      </time>
    </p>
  );
}

export function HeroPolaroid({ caption }: { caption: string }) {
  const cardRef = useRef<HTMLDivElement>(null);
  const [typed, setTyped] = useState(caption);

  useEffect(() => {
    if (reducedMotion()) return;
    let index = 0;
    // 지우기와 타이핑을 같은 타이머 순서로 처리해, 탭이 숨겨진 채 열려도 순서가 뒤바뀌지 않게 한다.
    const reset = window.setTimeout(() => setTyped(''), 0);
    const timer = window.setInterval(() => {
      index += 1;
      setTyped(caption.slice(0, index));
      if (index >= caption.length) window.clearInterval(timer);
    }, 70);
    return () => {
      window.clearTimeout(reset);
      window.clearInterval(timer);
    };
  }, [caption]);

  useEffect(() => {
    const card = cardRef.current;
    if (!card || reducedMotion() || !matchMedia('(hover: hover)').matches)
      return;
    let frame = 0;
    const move = (event: PointerEvent) => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => {
        const x = event.clientX / window.innerWidth - 0.5;
        const y = event.clientY / window.innerHeight - 0.5;
        card.style.setProperty('--tilt-x', `${(-y * 10).toFixed(2)}deg`);
        card.style.setProperty('--tilt-y', `${(x * 14).toFixed(2)}deg`);
        card.style.setProperty('--shift-x', `${(x * 18).toFixed(1)}px`);
        card.style.setProperty('--shift-y', `${(y * 18).toFixed(1)}px`);
      });
    };
    window.addEventListener('pointermove', move, { passive: true });
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener('pointermove', move);
    };
  }, []);

  return (
    <div className={s.polaroid} ref={cardRef}>
      <div className={s.polaroidPhoto} aria-hidden="true">
        <svg viewBox="0 0 100 100" className={s.petals}>
          <g>
            <path id="p2-petal" d="M43 39C34 27 32 7 50 7C68 7 66 27 57 39" />
            <use href="#p2-petal" transform="rotate(72 50 50)" />
            <use href="#p2-petal" transform="rotate(144 50 50)" />
            <use href="#p2-petal" transform="rotate(216 50 50)" />
            <use href="#p2-petal" transform="rotate(288 50 50)" />
          </g>
        </svg>
      </div>
      <p className={s.polaroidCaption}>
        <span className="srOnly">{caption}</span>
        <span aria-hidden="true">{typed}</span>
      </p>
    </div>
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

export function StackTabs({ groups }: { groups: StackGroup[] }) {
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
        aria-label="기술 분야"
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
            <strong>이렇게 사용했어요</strong>
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
                {stackMark(item.name)}
              </span>
              <strong>{item.name}</strong>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

const views = [
  ['large', '크게 보기'],
  ['small', '작게 보기'],
  ['list', '리스트 보기'],
] as const;
type View = (typeof views)[number][0];

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
}: {
  intro: ReactNode;
  large: ReactNode;
  small: ReactNode;
  list: ReactNode;
}) {
  const [view, setView] = useState<View>('large');
  return (
    <>
      <div className={s.viewBar}>
        {intro}
        <div
          className={s.viewSwitch}
          role="group"
          aria-label="프로젝트 보기 방식"
        >
          {views.map(([id, label]) => (
            <button
              key={id}
              type="button"
              aria-pressed={view === id}
              aria-label={label}
              onClick={() => setView(id)}
            >
              <svg viewBox="0 0 24 24" aria-hidden="true">
                {viewIcons[id]}
              </svg>
              <span>{label}</span>
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
}: {
  intro: ReactNode;
  cards: ReactNode;
  list: ReactNode;
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
          <RollText text={showList ? '카드로 보기' : '전체 리스트 보기'} />
        </button>
      </div>
      {showList ? (
        list
      ) : (
        <div className={s.railWrap}>
          <div
            ref={railRef}
            className={s.rail}
            tabIndex={0}
            role="region"
            aria-label="실무 작업 목록, 좌우로 스크롤"
          >
            {cards}
          </div>
          <div className={s.railNav}>
            <button
              type="button"
              onClick={() => scroll(-1)}
              disabled={edges.start}
              aria-label="이전 작업"
            >
              ←
            </button>
            <button
              type="button"
              onClick={() => scroll(1)}
              disabled={edges.end}
              aria-label="다음 작업"
            >
              →
            </button>
          </div>
        </div>
      )}
    </>
  );
}

const emailLabels = {
  idle: 'Email',
  copied: '복사했습니다',
  failed: '복사하지 못했어요',
} as const;

/** 누르면 주소를 복사하고, 버튼 문구로 결과를 잠깐 보여 준 뒤 원래대로 돌아간다. */
export function EmailButton({ email }: { email: string }) {
  const [state, setState] = useState<keyof typeof emailLabels>('idle');
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
        <span className={s.spin} aria-hidden="true">
          {state === 'copied' ? '✓' : '*'}
        </span>
        {emailLabels[state]}
      </button>
      <p id="p2-email-hint" className={s.emailHint}>
        {email} · 눌러서 복사
      </p>
      <p className="srOnly" role="status" aria-live="polite">
        {state === 'copied'
          ? `${email} 주소를 복사했습니다.`
          : state === 'failed'
            ? `복사하지 못했습니다. ${email} 주소를 직접 입력해 주세요.`
            : ''}
      </p>
    </div>
  );
}
