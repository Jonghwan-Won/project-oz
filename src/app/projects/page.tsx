import Link from 'next/link';
import { ProjectCard } from '@/components/ProjectCard';
import { getPublicProjects } from '@/server/services/projects';
import { getMessages } from '@/i18n/server';

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
  const types = [
    ...new Set(allProjects.flatMap((p) => (p.type ? [p.type] : []))),
  ];
  const selected = types.find((type) => type === category);
  const projects = allProjects.filter(
    (project) => !selected || project.type === selected,
  );
  const copy = messages.projects;
  return (
    <div className="page">
      <h1 className="accentDot">{copy.title}</h1>
      <p className="lead">{copy.description}</p>
      {types.length > 1 && (
        <div className="filter" aria-label={copy.filterLabel}>
          <Link href="/projects" aria-current={!selected ? 'page' : undefined}>
            {copy.all}
          </Link>
          {types.map((type) => (
            <Link
              key={type}
              href={`/projects?category=${encodeURIComponent(type)}`}
              aria-current={selected === type ? 'page' : undefined}
            >
              {allProjects.find((p) => p.type === type)?.typeLabel}
            </Link>
          ))}
        </div>
      )}
      <div className="projectGrid">
        {projects.map((project) => (
          <ProjectCard
            key={project.slug}
            project={project}
            locale={locale}
          />
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
