import { getAdminProject } from '@/server/services/admin-projects';
import { getAdminSession } from '@/server/auth';
import { AdminAccessError } from '@/server/admin-access';
import { uuid } from '@/lib/project-form';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  if (!uuid(id))
    return Response.json(
      { message: '프로젝트를 찾을 수 없습니다.' },
      { status: 404, headers: { 'Cache-Control': 'no-store' } },
    );
  try {
    const project = await getAdminProject(
      id,
      !(await getAdminSession(request.headers)),
    );
    return project
      ? Response.json(project, { headers: { 'Cache-Control': 'no-store' } })
      : Response.json(
          { message: '프로젝트를 찾을 수 없습니다.' },
          { status: 404, headers: { 'Cache-Control': 'no-store' } },
        );
  } catch (error) {
    if (error instanceof AdminAccessError)
      return Response.json(
        { message: error.message },
        { status: 403, headers: { 'Cache-Control': 'no-store' } },
      );
    console.error('Admin project detail query failed');
    return Response.json(
      { message: '프로젝트를 불러오지 못했습니다.' },
      { status: 503, headers: { 'Cache-Control': 'no-store' } },
    );
  }
}
