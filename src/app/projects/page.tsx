import Link from 'next/link';
import { ProjectCard } from '@/components/ProjectCard';
import { getPublicProjects, getUsedProjectTypes } from '@/content/projects';
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
  const { messages } = await getMessages();
  const { category } = await searchParams;
  const types = getUsedProjectTypes();
  const selected = types.find((type) => type === category);
  const projects = getPublicProjects().filter(
    (project) => !selected || project.type === selected,
  );
  const copy = messages.projects;
  return (
    <div className="page">
      <span className="eyebrow">PROJECTS / IDEAS INTO REALITY</span>
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
              {messages.projectTypes[type]}
            </Link>
          ))}
        </div>
      )}
      <div className="projectGrid">
        {projects.map((project) => (
          <ProjectCard key={project.slug} project={project} labels={messages} />
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
