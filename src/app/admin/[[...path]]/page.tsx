import { ProjectManager } from '../ProjectManager';
import { getAdminProjects } from '@/server/services/admin-projects';
import { redirect, notFound } from 'next/navigation';
import { posts } from '@/content/site';
import { AdminEditor } from '../AdminEditor';
import { ButtonLink } from '@/components/ui/Button';
import s from '../admin.module.css';

const planned = {
  categories: {
    title: '분류 관리',
    description:
      '프로젝트 유형·작업 구분과 게시판 카테고리를 관리할 메뉴입니다.',
  },
  media: {
    title: '미디어 관리',
    description:
      '프로젝트 썸네일과 게시글 첨부 이미지를 관리할 메뉴입니다. NAS 파일 저장 연동 후 구현합니다.',
  },
  settings: {
    title: '사이트 관리',
    description: '사이트 소개·메뉴·공개 설정을 관리할 메뉴입니다.',
  },
};

export default async function Admin({
  params,
}: {
  params: Promise<{ path?: string[] }>;
}) {
  if (process.env.NODE_ENV !== 'development') redirect('/login');
  const { path = [] } = await params;
  if (path.length > 1) notFound();
  const section = path[0];
  if (section === 'projects')
    return <ProjectManager {...await getAdminProjects()} />;
  if (section === 'board') {
    const entries = posts.map((post) => ({
      id: post.slug,
      slug: post.slug,
      title: post.title,
      summary: post.excerpt,
      body: post.paragraphs.join('\n\n'),
      category: post.category,
      status: '공개',
      thumbnail: '',
    }));
    return (
      <AdminEditor key={section} section={section} initialEntries={entries} />
    );
  }
  if (section) {
    const item = Object.entries(planned).find(([key]) => key === section)?.[1];
    if (!item) notFound();
    return (
      <section className={s.panel}>
        <span className="eyebrow">PLANNED</span>
        <p>{item.description}</p>
        <p>현재는 메뉴와 용도를 확인하는 준비 화면입니다.</p>
      </section>
    );
  }
  const projectCount = (await getAdminProjects()).projects.length;
  return (
    <section>
      <p>프로젝트는 개발 DB, 게시글은 저장소 콘텐츠를 기준으로 표시합니다.</p>
      <div className={s.stats}>
        <div className={s.panel}>
          <span>프로젝트</span>
          <strong>{projectCount}</strong>
          <ButtonLink href="/admin/projects">프로젝트 관리 ↗</ButtonLink>
        </div>
        <div className={s.panel}>
          <span>게시글</span>
          <strong>{posts.length}</strong>
          <ButtonLink href="/admin/board">게시판 관리 ↗</ButtonLink>
        </div>
      </div>
      <div className={s.panel}>
        <h3>다음 연결 항목</h3>
        <p>
          프로젝트 조회·저장은 개발 DB에 연결했습니다. 운영 관리자 인증·권한과
          게시판 DB 저장은 다음 단계입니다.
        </p>
      </div>
    </section>
  );
}
