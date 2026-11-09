import type { Metadata } from 'next';
import { technologyName } from '@/lib/technology-name';
import Image from 'next/image';
import { ProjectCard } from '@/components/ProjectCard';
import { ProjectPreviewLink } from '@/components/ProjectPreviewLink';
import Link from 'next/link';
import type { ReactNode } from 'react';
import { getMessages } from '@/i18n/server';
import { formatProjectPeriod } from '@/lib/project-detail';
import { projectGroupOf } from '@/lib/project-origin';
import { portfolioFileStatus } from '@/server/services/assets';
import {
  getPublicProjects,
  type PublicProject,
} from '@/server/services/projects';
import {
  EmailButton,
  PortfolioHeader,
  ProjectViews,
  StackTabs,
  WorksRail,
  type StackGroup,
} from './Interactive';
import s from './home.module.css';
import { HeroBackground } from './HeroBackground';

const title = '원종환 | 풀스택 개발자 포트폴리오';
export const metadata: Metadata = {
  title: { absolute: title },
  description: '원종환의 개인·교육 프로젝트와 실무 개발 이력을 소개합니다.',
  openGraph: {
    title,
    description: '개인 프로젝트부터 실무 개발까지, 원종환의 작업 기록.',
  },
};

/** PDF 내려받기 버튼. 실제 파일은 서버 환경 변수로 지정한다. */
const downloads = [
  { kind: 'resume', label: '이력서.pdf' },
  { kind: 'portfolio', label: '포트폴리오.pdf' },
] as const;

/** PDF는 새 탭의 브라우저 PDF 뷰어로 연다. 저장은 뷰어의 저장 버튼으로 한다. */
function PortfolioDownloads({
  files,
  className = '',
  kinds,
}: {
  files: ReturnType<typeof portfolioFileStatus>;
  className?: string;
  /** 일부 파일만 보여줄 때. 히어로는 포트폴리오만, 마무리 섹션은 둘 다 보여준다. */
  kinds?: readonly (typeof downloads)[number]['kind'][];
}) {
  const visible = kinds
    ? downloads.filter((file) => kinds.includes(file.kind))
    : downloads;
  return (
    <ul
      className={`${s.downloads} ${className}`}
      aria-label="이력서·포트폴리오 PDF"
    >
      {visible.map((file) => (
        <li key={file.kind}>
          {files[file.kind] ? (
            <a
              href={`/api/portfolio-files/${file.kind}`}
              target="_blank"
              rel="noopener"
              aria-label={`${file.label} 새 탭에서 열기`}
            >
              <FileIcon />
              {file.label}
              <DownloadIcon />
            </a>
          ) : (
            <span aria-disabled="true">
              <FileIcon />
              {file.label}
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

/** 직무 연관 이력(최신순). */
const career = [
  {
    period: '2023. 01 - 현재',
    org: '엠투엠글로벌',
    role: 'SI 프로젝트 풀스택 웹 개발',
    tag: '재직 중',
  },
  {
    period: '2022. 07 - 2022. 12',
    org: '비트캠프 강남본원',
    tag: '교육',
    role: '"JAVA 기반 AWS 웹 개발자 양성 과정" 수료',
  },
  {
    period: '2018. 03 - 2022. 05',
    org: '비에스온',
    role: 'IT지원팀 · 서버·네트워크 인프라 운영',
  },
  {
    period: '2016. 11 - 2018. 02',
    org: '지오유아이티',
    role: '고객사 맞춤 그룹웨어 컨설팅',
  },
];

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
 * 프로필 카드: 경력의 세 단계를 오래된 순으로 잇는다.
 * 사실관계는 위 career 목록과 맞춘다. 근거 없는 성과·수치는 넣지 않는다.
 */
const storyCards = [
  {
    icon: storyIcons.listen,
    step: '그룹웨어 컨설팅',
    title: '듣고, 방향을 제안했습니다',
    body: '고객사 담당자에게 지금의 업무 방식을 듣고 요구사항을 정리해, 그룹웨어를 업무에 맞게 구성하는 방향을 제안했습니다. 요청 뒤에 있는 실제 필요를 묻는 습관이 여기서 생겼습니다.',
  },
  {
    icon: storyIcons.operate,
    step: 'IT지원 · 인프라 운영',
    title: '멈추지 않게 운영했습니다',
    body: 'IT지원팀에서 서버와 네트워크 등 인프라를 운영했습니다. 만든 것이 실제 환경에서 어떻게 돌아가고, 문제가 생기면 어디부터 살펴야 하는지 몸으로 익혔습니다.',
  },
  {
    icon: storyIcons.build,
    step: '풀스택 웹 개발',
    title: '이제 직접 만듭니다',
    body: 'SI 업체에서 Java·Spring 서버와 Vue·React 화면, 데이터베이스까지 고객사가 요청한 기능을 처음부터 끝까지 개발하고 있습니다. 앞의 두 경험이 기능을 설계하는 기준이 됩니다.',
  },
];

/**
 * 분야별로 어떤 기술을 어디에 썼는지 정리한 문장.
 * 공개 프로젝트 설명을 바탕으로 썼으므로 프로젝트 내용이 바뀌면 함께 고친다.
 */
const stackNotes: Record<string, string[]> = {
  Backend: [
    'Java·Spring Boot로 업무 기능의 API와 비즈니스 로직 구현',
    'MyBatis·JPA로 조회·등록·수정 데이터 처리',
    '대량 등록·수정, 재고 동기화 같은 배치와 외부 시스템 연계',
    'PlanB의 Spring Security·JWT 인증 구성과 Swagger 기반 API 문서화',
  ],
  Frontend: [
    'React·Next.js, Vue.js·Nuxt.js로 고객·판매자·관리자 화면 구현',
    'Mantine·MUI·Vuetify 컴포넌트로 서비스·관리 화면 구성',
    'PlanB에서 Vuex 상태 관리와 Axios API 통신 사용',
    '하이브리드 앱의 웹 화면과 반응형 화면 구현',
  ],
  Database: [
    'MySQL·PostgreSQL·Oracle·MSSQL 등 프로젝트 환경에 맞춘 RDB 사용',
    'Redis 연동',
  ],
  Tools: [
    'Git·GitHub, 농협몰의 SVN으로 소스와 변경 이력 관리',
    'OZ에서 Docker·GitHub Actions로 이미지 빌드, Cloudflare Tunnel로 서비스 연결',
    'PlanB의 PortOne(아임포트) 결제 요청·주문 저장, 조공의 카카오맵 API 연동',
  ],
};

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
function period(project: PublicProject) {
  return project.startedOn
    ? formatProjectPeriod(project.startedOn, project.endedOn, 'ko').replace(
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

function groupStack(items: { name: string; count: number }[]) {
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
}: {
  project: PublicProject;
  status: string | null;
}) {
  const tech = technologies(project);
  return (
    <article className={s.feature}>
      <div className={s.featureMedia}>
        <ProjectPreviewLink
          href={'/work/' + project.id}
          className={s.mediaLink}
          projectId={project.id}
          locale="ko"
        >
          <Cover project={project} sizes="(max-width: 767px) 100vw, 45vw" />
          <span className="srOnly">{project.title} 상세 보기</span>
        </ProjectPreviewLink>
        <p className={s.mediaMeta}>
          <span>{project.typeLabel ?? project.originLabel}</span>
          <span>{period(project)}</span>
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
            locale="ko"
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
          <ul className={s.chips} aria-label="사용 기술">
            {tech.slice(0, 6).map((tag) => (
              <li key={tag.name}>{tag.name}</li>
            ))}
            {tech.length > 6 && (
              <li aria-label={`외 ${tech.length - 6}개`}>+{tech.length - 6}</li>
            )}
          </ul>
        )}
        <div>
          <ProjectPreviewLink
            href={'/work/' + project.id}
            className={s.fillButton}
            projectId={project.id}
            locale="ko"
          >
            <Roll front="자세히 보기" />
          </ProjectPreviewLink>
        </div>
      </div>
    </article>
  );
}

function ProjectTile({ project }: { project: PublicProject }) {
  return (
    <article className={s.tile}>
      <Link href={'/work/' + project.id}>
        <Cover
          project={project}
          sizes="(max-width: 767px) 50vw, (max-width: 1279px) 33vw, 25vw"
        />
        <h3>{project.title}</h3>
        <p>{period(project) || project.originLabel}</p>
      </Link>
    </article>
  );
}

function ProjectRows({ items }: { items: PublicProject[] }) {
  return (
    <ul className={s.rows}>
      {items.map((p) => (
        <li key={p.id}>
          <Link href={'/work/' + p.id}>
            <small>{period(p) || p.originLabel}</small>
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
  const [{ messages }, all] = await Promise.all([
    getMessages(),
    getPublicProjects('ko'),
  ]);
  const projects = all.filter(
    (p) => projectGroupOf(p.originCode) === 'personal',
  );
  const works = all.filter((p) => projectGroupOf(p.originCode) === 'work');
  const statusOf = (p: PublicProject) =>
    p.endedOn
      ? '개발 완료'
      : p.lifecycle
        ? messages.projectStatuses[p.lifecycle]
        : null;
  const stack = stackOf(all);
  const stackGroups = groupStack(stack);
  const files = portfolioFileStatus();

  return (
    <div id="portfolio" className={s.page}>
      <PortfolioHeader />

      <section className={s.hero} id="intro" aria-labelledby="hero-title">
        <HeroBackground />
        <div className={s.heroContent}>
          <p className={s.heroEyebrow} aria-hidden="true">
            Portfolio
          </p>
          <h1 id="hero-title" className={s.heroTitle}>
            요구를 듣고, 운영을 알고,
            <br />
            <em>직접 만듭니다.</em>
          </h1>
          <p className={s.heroLead}>
            그룹웨어 컨설팅과 인프라 운영을 거쳐 지금은 서버부터 화면까지 만드는
            9년 차 풀스택 개발자, 원종환입니다.
          </p>
          <div className={s.heroActions}>
            <a href="#profile" className={s.heroPrimary}>
              프로필 보기
              <span aria-hidden="true">↓</span>
            </a>
            <PortfolioDownloads files={files} kinds={['portfolio']} />
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
              듣는 일에서 시작해
              <br />
              <em>만드는 일</em>까지 왔습니다.
            </p>
          </div>
          <div className={s.profileText}>
            <p className={s.body}>
              9년 동안 세 자리에서 일했습니다. 고객의 이야기를 듣고 방향을
              제안하던 컨설턴트에서, 서버와 네트워크를 지키던 운영자를 거쳐,
              지금은 <strong>풀스택 웹 개발자</strong>로 일하고 있습니다. 그래서
              기능을 만들 때 고객이 실제로 원하는 것인지, 운영에서 문제없이
              돌아갈지를 함께 봅니다.
            </p>
            <ol className={s.aboutCards}>
              {storyCards.map((item) => (
                <li key={item.step}>
                  <span className={s.storyIcon} aria-hidden="true">
                    <svg viewBox="0 0 24 24" focusable="false">
                      {item.icon}
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
            <h3 className={s.subTitle}>직무 연관 이력</h3>
            <ol>
              {career.map((item) => (
                <li
                  key={item.org}
                  data-current={item.tag === '재직 중' || undefined}
                >
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
            <h3 className={s.subTitle}>기술 스택</h3>
            {stackGroups.length ? (
              <StackTabs groups={stackGroups} />
            ) : (
              <p className={s.empty}>등록된 기술 태그가 없습니다.</p>
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
              intro={
                <p className={s.note}>
                  교육 과정과 개인 작업으로 만든 프로젝트입니다.
                </p>
              }
              large={projects.map((p) => (
                <ProjectFeature key={p.id} project={p} status={statusOf(p)} />
              ))}
              small={projects.map((p) => (
                <ProjectTile key={p.id} project={p} />
              ))}
              list={<ProjectRows items={projects} />}
            />
          ) : (
            <p className={s.empty}>공개된 프로젝트가 없습니다.</p>
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
              intro={
                <p className={s.note}>
                  실무에서 참여한 프로젝트입니다. 공개 가능한 범위와 담당한
                  역할을 중심으로 정리했습니다.
                </p>
              }
              cards={works.map((p) => (
                <div key={p.id} className={s.workCard}>
                  <ProjectCard project={p} locale="ko" compact />
                </div>
              ))}
              list={<ProjectRows items={works} />}
            />
          ) : (
            <p className={s.empty}>공개된 실무 프로젝트가 없습니다.</p>
          )}
        </section>
      </div>

      <footer className={s.footer} aria-labelledby="contact-title">
        <SectionLabel index="04" name="say hello" meta="contact" />
        <h2 id="contact-title" className="srOnly">
          연락하기
        </h2>
        <div className={s.closing}>
          <div className={s.closingIntro}>
            <p className={s.availability}>
              <span aria-hidden="true" />
              새로운 협업 제안을 기다립니다
            </p>
            <p className={s.closingText}>
              함께 좋은 서비스를
              <br />
              <em>만들고 싶은 분께.</em>
            </p>
            <p className={s.contactDescription}>
              요구를 듣는 일부터 운영까지 겪어 본 개발자로서, 화면부터 서버까지
              필요한 기능을 직접 만들어 갑니다. 프로젝트와 협업에 관한 이야기를
              편하게 전해 주세요.
            </p>
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
                  <EmailButton email="anarose4815@naver.com" />
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
            <PortfolioDownloads files={files} className={s.contactDownloads} />
          </div>
        </div>
        <div className={s.legal}>
          <p>© {seoulYear()} Won Jonghwan. All rights reserved.</p>
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
