import { getPublicProject } from '@/server/services/projects';
import { publicProjectDetail } from '@/lib/project-detail';
import { getMessages } from '@/i18n/server';
import { uuid } from '@/lib/project-form';

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  if (!uuid(id))
    return Response.json(
      { message: '프로젝트를 찾을 수 없습니다.' },
      { status: 404 },
    );
  const { locale } = await getMessages();
  const project = await getPublicProject(id, locale);
  if (!project)
    return Response.json(
      { message: '프로젝트를 찾을 수 없습니다.' },
      { status: 404 },
    );
  return Response.json(publicProjectDetail(project, locale), {
    headers: { 'Cache-Control': 'no-store' },
  });
}
