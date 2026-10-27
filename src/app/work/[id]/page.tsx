import { ProjectDetailContent } from '@/components/ProjectDetailContent';
import { publicProjectDetail } from '@/lib/project-detail';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { getPublicProject } from '@/server/services/projects';
import { getMessages } from '@/i18n/server';

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { messages, locale } = await getMessages();
  const { id } = await params;
  const project = await getPublicProject(id, locale);
  return {
    title: project ? project.title : messages.navigation.projects,
  };
}

export default async function Work({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { messages, locale } = await getMessages();
  const { id } = await params;
  const project = await getPublicProject(id, locale);
  if (!project) notFound();
  return (
    <article className="page">
      <Link className="textLink" href="/projects">
        {messages.projects.back}
      </Link>
      <ProjectDetailContent
        project={publicProjectDetail(project, locale)}
        locale={locale}
        heading="h1"
      />
    </article>
  );
}
