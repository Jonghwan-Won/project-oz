import type { Metadata } from 'next';
import Link from 'next/link';
import { OzParticles } from '@/components/OzParticles';
import { ProjectCard } from '@/components/ProjectCard';
import { getMessages } from '@/i18n/server';
import {
  getPublicProjects,
  type PublicProject,
} from '@/server/services/projects';
import { formatProjectPeriod } from '@/lib/project-detail';
import { PortfolioNav, ProjectViews } from './Controls';
import s from './portfolio.module.css';

const title = '원종환 | 풀스택 개발자 포트폴리오';
export const metadata: Metadata = {
  title: { absolute: title },
  description: '원종환의 개인·교육 프로젝트와 실무 개발 이력을 소개합니다.',
  openGraph: {
    title,
    description: '개인 프로젝트부터 실무 개발까지, 원종환의 작업 기록.',
  },
};

function ProjectRows({ items }: { items: PublicProject[] }) {
  return (
    <ul className={s.rows}>
      {items.map((p) => (
        <li key={p.id}>
          <Link href={'/work/' + p.id}>
            <small>
              {p.startedOn
                ? formatProjectPeriod(p.startedOn, p.endedOn, 'ko')
                : p.originLabel}
            </small>
            <div>
              <h3>{p.title}</h3>
              <p>{p.summary}</p>
            </div>
            <span aria-hidden="true">↗</span>
          </Link>
        </li>
      ))}
    </ul>
  );
}

export default async function Portfolio() {
  const [{ messages }, all] = await Promise.all([
    getMessages(),
    getPublicProjects('ko'),
  ]);
  const projects = all.filter((p) =>
    ['PERSONAL', 'EDUCATION'].includes(p.originCode),
  );
  const works = all.filter((p) => p.originCode === 'COMPANY');
  return (
    <div id="portfolio" className={s.page}>
      <PortfolioNav />
      <section className={s.hero}>
        <OzParticles label={messages.brandMotion.description} />
        <div className={s.intro}>
          <em>Portfolio</em>
          <h1>
            원종환<span>풀스택 개발자</span>
          </h1>
        </div>
        <a className={s.discover} href="#profile">
          프로필 보기 ↓
        </a>
      </section>
      <section className={s.section} id="profile" tabIndex={-1}>
        <h2>Profile</h2>
        <div className={s.bio}>
          <h3>{messages.about.welcome}</h3>
          {messages.about.sections.map((item) => (
            <details key={item.title} open>
              <summary>{item.title}</summary>
              <p>{item.body}</p>
            </details>
          ))}
        </div>
      </section>
      <section className={s.section} id="projects" tabIndex={-1}>
        <h2>Projects</h2>
        <p>교육 · 개인 프로젝트</p>
        {projects.length ? (
          <ProjectViews list={<ProjectRows items={projects} />}>
            {projects.map((p) => (
              <article key={p.id}>
                <ProjectCard project={p} />
                <p>{p.summary}</p>
              </article>
            ))}
          </ProjectViews>
        ) : (
          <p>공개된 프로젝트가 없습니다.</p>
        )}
      </section>
      <section className={s.section} id="works" tabIndex={-1}>
        <h2>Works</h2>
        <p>실무에서 참여한 프로젝트</p>
        {works.length ? (
          <ProjectRows items={works} />
        ) : (
          <p>공개된 실무 프로젝트가 없습니다.</p>
        )}
      </section>
    </div>
  );
}
