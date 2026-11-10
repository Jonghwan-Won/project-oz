import type { Metadata } from 'next';
import { technologyName } from '@/lib/technology-name';
import Image from 'next/image';
import { ProjectCard } from '@/components/ProjectCard';
import { ProjectPreviewLink } from '@/components/ProjectPreviewLink';
import Link from 'next/link';
import type { ReactNode } from 'react';
import { getMessages } from '@/i18n/server';
import type { Locale } from '@/i18n/locale';
import type { PortfolioMessages } from '@/i18n/portfolio-ko';
import { formatProjectPeriod } from '@/lib/project-detail';
import { projectGroupOf } from '@/lib/project-origin';
import { portfolioFileStatus } from '@/server/services/assets';
import { getHeaderSettings } from '@/server/header-settings';
import {
  getPublicProjects,
  type PublicProject,
} from '@/server/services/projects';
import {
  EmailButton,
  PortfolioHeader,
  ProjectViews,
  SectionLink,
  StackTabs,
  WorksRail,
  type StackGroup,
} from './Interactive';
import s from './home.module.css';
import { HeroBackground } from './HeroBackground';

export async function generateMetadata(): Promise<Metadata> {
  const { messages } = await getMessages();
  const meta = messages.portfolio.meta;
  return {
    title: { absolute: meta.title },
    description: meta.description,
    openGraph: { title: meta.title, description: meta.ogDescription },
  };
}

/** PDF 내려받기 버튼. 실제 파일은 서버 환경 변수로 지정한다. */
const downloads = ['resume', 'portfolio'] as const;

/** PDF는 새 탭의 브라우저 PDF 뷰어로 연다. 저장은 뷰어의 저장 버튼으로 한다. */
function PortfolioDownloads({
  files,
  labels,
  className = '',
  kinds,
}: {
  files: ReturnType<typeof portfolioFileStatus>;
  labels: PortfolioMessages['downloads'];
  className?: string;
  /** 일부 파일만 보여줄 때. 히어로는 포트폴리오만, 마무리 섹션은 둘 다 보여준다. */
  kinds?: readonly (typeof downloads)[number][];
}) {
  const visible = kinds
    ? downloads.filter((kind) => kinds.includes(kind))
    : downloads;
  return (
    <ul className={`${s.downloads} ${className}`} aria-label={labels.label}>
      {visible.map((kind) => (
        <li key={kind}>
          {files[kind] ? (
            <a
              href={`/api/portfolio-files/${kind}`}
              target="_blank"
              rel="noopener"
              aria-label={labels.openNewTab.replace('{file}', labels[kind])}
            >
              <FileIcon />
              {labels[kind]}
              <DownloadIcon />
            </a>
          ) : (
            <span aria-disabled="true">
              <FileIcon />
              {labels[kind]}
            </span>
          )}
        </li>
      ))}
    </ul>
  );
}
function FileIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M14 3H6a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9Z" />
      <path d="M14 3v6h6M8 13h8M8 17h5" />
    </svg>
  );
}

function DownloadIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M12 4v11m-5-5 5 5 5-5M5 20h14" />
    </svg>
  );
}

/** 프로필 카드 아이콘. 이모지는 OS마다 모양이 달라 직접 그린 선 아이콘을 쓴다. */
const storyIcons = {
  // 말풍선: 듣고 제안하기
  listen: (
    <>
      <path d="M4 5.5A1.5 1.5 0 0 1 5.5 4h13A1.5 1.5 0 0 1 20 5.5v9a1.5 1.5 0 0 1-1.5 1.5H9.5L5 20v-4h-.5A.5.5 0 0 1 4 15.5Z" />
      <path className={s.storyIconDots} d="M8.5 10h.01M12 10h.01M15.5 10h.01" />
    </>
  ),
  // 서버 두 대: 운영하기
  operate: (
    <>
      <rect x="4" y="4" width="16" height="6.5" rx="2" />
      <rect x="4" y="13.5" width="16" height="6.5" rx="2" />
      <path className={s.storyIconDots} d="M8 7.25h.01M8 16.75h.01" />
      <path d="M12 7.25h4M12 16.75h4" />
    </>
  ),
  // 코드 괄호: 직접 만들기
  build: <path d="m8 8-4 4 4 4M16 8l4 4-4 4M13.5 5l-3 14" />,
};

/**
 * 프로필 카드 아이콘. 문구(messages.portfolio.stories)와 같은 순서로 붙인다.
 * 사실관계는 이력 목록과 맞춘다. 근거 없는 성과·수치는 넣지 않는다.
 */
const storyIconList = [storyIcons.listen, storyIcons.operate, storyIcons.build];

/** 프로젝트 기술 태그를 분야별로 묶는다. 목록에 없는 태그는 마지막 묶음으로 간다. */
const stackCategories = [
  {
    label: 'Backend',
    names: [
      'Java',
      'Spring Boot',
      'Spring Framework',
      'Spring Security',
      'JPA',
      'MyBatis',
      'JSP',
      'Prisma',
      'Swagger',
      'JWT',
    ],
  },
  {
    label: 'Frontend',
    names: [
      'TypeScript',
      'JavaScript',
      'React',
      'Next.js',
      'Vue.js',
      'Nuxt.js',
      'Vuex',
      'Vuetify',
      'Axios',
      'Redux',
      'HTML',
      'CSS',
      'Mantine',
      'MUI',
      'Tiptap',
      'Nexacro',
    ],
  },
  {
    label: 'Database',
    names: ['MySQL', 'PostgreSQL', 'Oracle', 'MSSQL', 'Redis'],
  },
  {
    label: 'Tools',
    names: [
      'AWS S3',
      'Docker',
      'Cloudflare',
      'Git',
      'GitHub',
      'GitHub Actions',
      'SVN',
      'TortoiseSVN',
      'Notion',
      'Figma',
      'Kakao Map API',
      'PortOne (아임포트)',
    ],
  },
];

/** 앞면 글자가 위로 빠지고 뒷면 글자가 올라오는 hover 효과. 뒷면은 장식용이다. */
function Roll({ front, back }: { front: ReactNode; back?: ReactNode }) {
  return (
    <span className={s.roll}>
      <span>{front}</span>
      <span aria-hidden="true">{back ?? front}</span>
    </span>
  );
}

function SectionLabel({
  index,
  name,
  meta,
}: {
  index: string;
  name: string;
  meta: string;
}) {
  return (
    <div className={s.label} aria-hidden="true">
      <span>{index}</span>
      <span>{name}</span>
      <span>{meta}</span>
    </div>
  );
}

function technologies(project: PublicProject) {
  return project.tags.filter((tag) => tag.kind === 'TECHNOLOGY');
}

/** 기간을 '2026. 01 ~ 현재'처럼 마침표 뒤를 한 칸 띄워 보여 준다. */
function period(project: PublicProject, locale: Locale) {
  return project.startedOn
    ? formatProjectPeriod(project.startedOn, project.endedOn, locale).replace(
        /\.(?=\d)/g,
        '. ',
      )
    : '';
}

function stackOf(items: PublicProject[]) {
  const counts = new Map<string, number>();
  for (const project of items)
    for (const name of new Set(
      technologies(project).map((tag) => technologyName(tag.name)),
    ))
      counts.set(name, (counts.get(name) ?? 0) + 1);
  return [...counts]
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count || a.name.localeCompare(b.name, 'ko'));
}

function groupStack(
  items: { name: string; count: number }[],
  stackNotes: Record<string, string[]>,
) {
  const known = new Set(stackCategories.flatMap((c) => c.names));
  const groups = stackCategories.map((category) => ({
    label: category.label,
    items: category.names.flatMap((name) => {
      const item = items.find((entry) => entry.name === name);
      return item ? [item] : [];
    }),
  }));
  const tools = groups.find((group) => group.label === 'Tools');
  tools?.items.push(...items.filter((item) => !known.has(item.name)));
  return groups
    .filter((group) => group.items.length)
    .map((group): StackGroup => ({
      ...group,
      notes: stackNotes[group.label] ?? [],
    }));
}

function seoulYear() {
  return new Intl.DateTimeFormat('en', {
    timeZone: 'Asia/Seoul',
    year: 'numeric',
  }).format(new Date());
}

function Cover({ project, sizes }: { project: PublicProject; sizes: string }) {
  return (
    <span className={s.cover} aria-hidden="true">
      {project.thumbnail ? (
        <>
          <Image
            unoptimized
            src={project.thumbnail}
            alt=""
            fill
            sizes={sizes}
            className={s.coverImage}
          />
        </>
      ) : (
        <span className={s.coverArt}>
          <span>{project.title.slice(0, 1)}</span>
        </span>
      )}
    </span>
  );
}

function ProjectFeature({
  project,
  status,
  locale,
  text,
}: {
  project: PublicProject;
  status: string | null;
  locale: Locale;
  text: PortfolioMessages['projects'];
}) {
  const tech = technologies(project);
  return (
    <article className={s.feature}>
      <div className={s.featureMedia}>
        <ProjectPreviewLink
          href={'/work/' + project.id}
          className={s.mediaLink}
          projectId={project.id}
          locale={locale}
        >
          <Cover project={project} sizes="(max-width: 767px) 100vw, 45vw" />
          <span className="srOnly">
            {text.detail.replace('{title}', project.title)}
          </span>
        </ProjectPreviewLink>
        <p className={s.mediaMeta}>
          <span>{project.typeLabel ?? project.originLabel}</span>
          <span>{period(project, locale)}</span>
        </p>
      </div>
      <div className={s.featureBody}>
        <div className={s.badges}>
          <span className={s.badgeStrong}>{project.originLabel}</span>
          {status && <span className={s.badge}>{status}</span>}
        </div>
        <h3>
          <ProjectPreviewLink
            href={'/work/' + project.id}
            className=""
            projectId={project.id}
            locale={locale}
          >
            {project.title}
          </ProjectPreviewLink>
        </h3>
        {project.customerName && (
          <p className={s.lead}>
            <span className={s.spin} aria-hidden="true">
              *
            </span>
            {project.customerName}
          </p>
        )}
        <p className={s.summary}>{project.summary}</p>
        {tech.length > 0 && (
          <ul className={s.chips} aria-label={text.techLabel}>
            {tech.slice(0, 6).map((tag) => (
              <li key={tag.name}>{tag.name}</li>
            ))}
            {tech.length > 6 && (
              <li
                aria-label={text.moreTech.replace(
                  '{count}',
                  String(tech.length - 6),
                )}
              >
                +{tech.length - 6}
              </li>
            )}
          </ul>
        )}
        <div>
          <ProjectPreviewLink
            href={'/work/' + project.id}
            className={s.fillButton}
            projectId={project.id}
            locale={locale}
          >
            <Roll front={text.more} />
          </ProjectPreviewLink>
        </div>
      </div>
    </article>
  );
}

function ProjectTile({
  project,
  locale,
}: {
  project: PublicProject;
  locale: Locale;
}) {
  return (
    <article className={s.tile}>
      <Link href={'/work/' + project.id}>
        <Cover
          project={project}
          sizes="(max-width: 767px) 50vw, (max-width: 1279px) 33vw, 25vw"
        />
        <h3>{project.title}</h3>
        <p>{period(project, locale) || project.originLabel}</p>
      </Link>
    </article>
  );
}

function ProjectRows({
  items,
  locale,
}: {
  items: PublicProject[];
  locale: Locale;
}) {
  return (
    <ul className={s.rows}>
      {items.map((p) => (
        <li key={p.id}>
          <Link href={'/work/' + p.id}>
            <small>{period(p, locale) || p.originLabel}</small>
            <span>
              <strong>{p.title}</strong>
              <span>{p.summary}</span>
            </span>
            <span aria-hidden="true">↗</span>
          </Link>
        </li>
      ))}
    </ul>
  );
}

export default async function Home() {
  const [{ messages, locale }, headerSettings] = await Promise.all([
    getMessages(),
    getHeaderSettings(),
  ]);
  const all = await getPublicProjects(locale);
  const text = messages.portfolio;
  const projects = all.filter(
    (p) => projectGroupOf(p.originCode) === 'personal',
  );
  const works = all.filter((p) => projectGroupOf(p.originCode) === 'work');
  const statusOf = (p: PublicProject) =>
    p.endedOn
      ? text.projects.completed
      : p.lifecycle
        ? messages.projectStatuses[p.lifecycle]
        : null;
  const stack = stackOf(all);
  const stackGroups = groupStack(stack, text.stackNotes);
  const files = portfolioFileStatus();

  return (
    <div id="portfolio" className={s.page}>
      <PortfolioHeader settings={headerSettings} />

      <section className={s.hero} id="intro" aria-labelledby="hero-title">
        <HeroBackground dark={headerSettings.theme === 'dark'} />
        <div className={s.heroContent}>
          <p className={s.heroEyebrow} aria-hidden="true">
            Portfolio
          </p>
          <h1 id="hero-title" className={s.heroTitle}>
            {text.hero.titleStart}
            <br />
            <em>{text.hero.titleEmphasis}</em>
          </h1>
          <p className={s.heroLead}>{text.hero.lead}</p>
          <div className={s.heroActions}>
            <SectionLink id="profile" className={s.heroPrimary}>
              {text.hero.profileButton}
              <span aria-hidden="true">↓</span>
            </SectionLink>
            <PortfolioDownloads
              files={files}
              labels={text.downloads}
              kinds={['portfolio']}
            />
          </div>
        </div>
      </section>

      <div className={s.contents}>
        <section
          className={s.section}
          id="profile"
          tabIndex={-1}
          aria-labelledby="profile-title"
        >
          <SectionLabel index="01" name="about me" meta="profile" />
          <h2 id="profile-title" className="srOnly">
            Profile
          </h2>
          <div className={s.intro}>
            <svg
              className={`${s.profileSymbol} ${s.petals}`}
              viewBox="0 0 100 100"
              aria-hidden="true"
              focusable="false"
            >
              <g>
                <path
                  id="profile-petal"
                  d="M43 39C34 27 32 7 50 7C68 7 66 27 57 39"
                />
                <use href="#profile-petal" transform="rotate(72 50 50)" />
                <use href="#profile-petal" transform="rotate(144 50 50)" />
                <use href="#profile-petal" transform="rotate(216 50 50)" />
                <use href="#profile-petal" transform="rotate(288 50 50)" />
              </g>
            </svg>{' '}
            <p className={s.headline}>
              {text.profile.headlineStart}
              <br />
              <em>{text.profile.headlineEmphasis}</em>
              {text.profile.headlineEnd}
            </p>
          </div>
          <div className={s.profileText}>
            <p className={s.body}>
              {text.profile.bodyStart}
              <strong>{text.profile.bodyStrong}</strong>
              {text.profile.bodyEnd}
            </p>
            <ol className={s.aboutCards}>
              {text.stories.map((item, index) => (
                <li key={item.step}>
                  <span className={s.storyIcon} aria-hidden="true">
                    <svg viewBox="0 0 24 24" focusable="false">
                      {storyIconList[index]}
                    </svg>
                  </span>
                  <small>{item.step}</small>
                  <h3>{item.title}</h3>
                  <p>{item.body}</p>
                </li>
              ))}
            </ol>
          </div>
          <div className={s.career}>
            <h3 className={s.subTitle}>{text.profile.careerTitle}</h3>
            <ol>
              {text.career.map((item) => (
                <li key={item.org} data-current={item.current || undefined}>
                  <span>{item.period}</span>
                  <p>
                    <strong>
                      {item.org}
                      {item.tag && (
                        <small className={s.careerTag}>{item.tag}</small>
                      )}
                    </strong>
                    <span>{item.role}</span>
                  </p>
                </li>
              ))}
            </ol>
          </div>
          <div className={s.stack}>
            <h3 className={s.subTitle}>{text.profile.stackTitle}</h3>
            {stackGroups.length ? (
              <StackTabs groups={stackGroups} labels={text.stackTabs} />
            ) : (
              <p className={s.empty}>{text.profile.stackEmpty}</p>
            )}
          </div>
        </section>

        <section
          className={s.section}
          id="projects"
          tabIndex={-1}
          aria-labelledby="projects-title"
        >
          <SectionLabel index="02" name="built by me" meta="projects" />
          <h2 id="projects-title" className={s.display} data-reveal>
            <span>Projects</span>
          </h2>
          {projects.length ? (
            <ProjectViews
              intro={<p className={s.note}>{text.projects.intro}</p>}
              labels={text.views}
              large={projects.map((p) => (
                <ProjectFeature
                  key={p.id}
                  project={p}
                  status={statusOf(p)}
                  locale={locale}
                  text={text.projects}
                />
              ))}
              small={projects.map((p) => (
                <ProjectTile key={p.id} project={p} locale={locale} />
              ))}
              list={<ProjectRows items={projects} locale={locale} />}
            />
          ) : (
            <p className={s.empty}>{text.projects.empty}</p>
          )}
        </section>

        <section
          className={s.section}
          id="works"
          tabIndex={-1}
          aria-labelledby="works-title"
        >
          <SectionLabel index="03" name="on the job" meta="works" />
          <h2 id="works-title" className={s.display} data-reveal>
            <span>Works</span>
          </h2>
          {works.length ? (
            <WorksRail
              intro={<p className={s.note}>{text.works.intro}</p>}
              labels={text.works}
              cards={works.map((p) => (
                <div key={p.id} className={s.workCard}>
                  <ProjectCard project={p} locale={locale} compact />
                </div>
              ))}
              list={<ProjectRows items={works} locale={locale} />}
            />
          ) : (
            <p className={s.empty}>{text.works.empty}</p>
          )}
        </section>
      </div>

      <footer className={s.footer} aria-labelledby="contact-title">
        <SectionLabel index="04" name="say hello" meta="contact" />
        <h2 id="contact-title" className="srOnly">
          {text.contact.title}
        </h2>
        <div className={s.closing}>
          <div className={s.closingIntro}>
            <p className={s.availability}>
              <span aria-hidden="true" />
              {text.contact.availability}
            </p>
            <p className={s.closingText}>
              {text.contact.closingStart}
              <br />
              <em>{text.contact.closingEmphasis}</em>
            </p>
            <p className={s.contactDescription}>{text.contact.description}</p>
          </div>
          <div className={s.contactPanel}>
            <dl className={s.contactLinks}>
              <div>
                <dt>
                  <span className={s.contactIcon} aria-hidden="true">
                    <svg viewBox="0 0 24 24" focusable="false">
                      <rect x="3" y="5" width="18" height="14" rx="3" />
                      <path d="m4 7.5 8 5.5 8-5.5" />
                    </svg>
                  </span>
                  EMAIL
                </dt>
                <dd>
                  <EmailButton
                    email="anarose4815@naver.com"
                    labels={text.email}
                  />
                </dd>
              </div>
              <div>
                <dt>
                  <span className={s.contactIcon} aria-hidden="true">
                    <svg viewBox="0 0 24 24" focusable="false">
                      <circle cx="6.5" cy="6" r="2.25" />
                      <circle cx="6.5" cy="18" r="2.25" />
                      <circle cx="17.5" cy="8" r="2.25" />
                      <path d="M6.5 8.25v7.5M17.5 10.25c0 4-4.5 3.5-9.5 6" />
                    </svg>
                  </span>
                  GITHUB
                </dt>
                <dd>
                  <a
                    href="https://github.com/Jonghwan-Won"
                    target="_blank"
                    rel="noreferrer"
                  >
                    github.com/Jonghwan-Won ↗
                  </a>
                </dd>
              </div>
            </dl>
            <PortfolioDownloads
              files={files}
              labels={text.downloads}
              className={s.contactDownloads}
            />
          </div>
        </div>
        <div className={s.legal}>
          <p>© {seoulYear()} Won Jonghwan. All rights reserved.</p>
          <nav aria-label={text.footerNav.label}>
            <Link href="/">{text.footerNav.home}</Link>
            <Link href="/projects">{text.footerNav.projects}</Link>
            <Link href="/board">{text.footerNav.blog}</Link>
            <Link href="/lab">{text.footerNav.lab}</Link>
            <Link href="/guide">{text.footerNav.guide}</Link>
            <Link href="/admin">{text.footerNav.admin}</Link>
          </nav>
        </div>
      </footer>
    </div>
  );
}
