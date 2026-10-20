import { notFound } from 'next/navigation';
import Link from 'next/link';
import { getPublicProjects } from '@/content/projects';
import { getMessages } from '@/i18n/server';

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { messages } = await getMessages();
  const { slug } = await params;
  const project = getPublicProjects().find((project) => project.slug === slug);
  return {
    title: project
      ? messages.projectItems[project.slug].title
      : messages.navigation.projects,
  };
}

export default async function Work({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { messages } = await getMessages();
  const { slug } = await params;
  const project = getPublicProjects().find((project) => project.slug === slug);
  if (!project) notFound();
  const item = messages.projectItems[project.slug];
  return (
    <article className="page">
      <Link className="textLink" href="/projects">
        {messages.projects.back}
      </Link>
      <h1>{item.title}</h1>
      <div className="projectTags">
        <span className="tag">{messages.projectOrigins[project.origin]}</span>
        {project.type && (
          <span className="tag">{messages.projectTypes[project.type]}</span>
        )}
        {project.lifecycle && (
          <span className="tag">
            {messages.projectStatuses[project.lifecycle]}
          </span>
        )}
      </div>
      {project.placeholder && (
        <div className="notice">{messages.projects.placeholderNotice}</div>
      )}
      <p className="lead">{item.summary}</p>
      <div className="prose">
        {item.sections.map((section) => (
          <section key={section.title}>
            <h2>{section.title}</h2>
            <p>{section.body}</p>
          </section>
        ))}
      </div>
    </article>
  );
}
