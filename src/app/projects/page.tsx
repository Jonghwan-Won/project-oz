import Link from 'next/link';
import { ProjectCard } from '@/components/ProjectCard';
import { getPublicProjects } from '@/server/services/projects';
import { getMessages } from '@/i18n/server';
import { projectGroupOf, projectGroups } from '@/lib/project-origin';

export async function generateMetadata() {
  const { messages } = await getMessages();
  return { title: messages.navigation.projects };
}

export default async function Projects({
  searchParams,
}: {
  searchParams: Promise<{ category?: string }>;
}) {
  const { messages, locale } = await getMessages();
  const allProjects = await getPublicProjects(locale);
  const { category } = await searchParams;
  // 메인 화면처럼 개인(개인·교육) 작업과 실무 작업으로 나눠 거른다.
  const groups = projectGroups.filter((group) =>
    allProjects.some((p) => projectGroupOf(p.originCode) === group),
  );
  const selected = groups.find((group) => group === category);
  const projects = allProjects.filter(
    (project) => !selected || projectGroupOf(project.originCode) === selected,
  );
  const copy = messages.projects;
  return (
    <div className="page">
      {/* <MainPageLink href="/#projects" label={messages.navigation.main} /> */}
      <h1 className="accentDot">{copy.title}</h1>
      <p className="lead">{copy.description}</p>
      {groups.length > 1 && (
        <div className="filter" aria-label={copy.filterLabel}>
          <Link href="/projects" aria-current={!selected ? 'page' : undefined}>
            {copy.all}
          </Link>
          {groups.map((group) => (
            <Link
              key={group}
              href={`/projects?category=${group}`}
              aria-current={selected === group ? 'page' : undefined}
            >
              {copy.groups[group]}
            </Link>
          ))}
        </div>
      )}
      <div className="projectGrid">
        {projects.map((project) => (
          <ProjectCard key={project.id} project={project} locale={locale} />
        ))}
      </div>
      {!projects.length && (
        <div className="empty">
          <h2>{copy.empty}</h2>
        </div>
      )}
    </div>
  );
}
