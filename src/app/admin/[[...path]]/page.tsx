import { notFound } from 'next/navigation';
import { projects } from '@/content/projects';
import { posts } from '@/content/site';
import { ko } from '@/i18n/ko';
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
    title: '사이트 설정',
    description: '사이트 소개·메뉴·공개 설정을 관리할 메뉴입니다.',
  },
};

export default async function Admin({
  params,
}: {
  params: Promise<{ path?: string[] }>;
}) {
  const { path = [] } = await params;
  if (path.length > 1) notFound();
  const section = path[0];
  if (section === 'projects' || section === 'board') {
    const entries =
      section === 'projects'
        ? projects.map((project) => ({
            id: project.slug,
            slug: project.slug,
            title: ko.projectItems[project.slug].title,
            summary: ko.projectItems[project.slug].summary,
            body: '',
            category: ko.projectOrigins[project.origin],
            status: project.visibility === 'PUBLIC' ? '공개' : '비공개',
            thumbnail: project.thumbnail ?? '',
          }))
        : posts.map((post) => ({
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
        <h2>{item.title}</h2>
        <p>{item.description}</p>
        <p>현재는 메뉴와 용도를 확인하는 준비 화면입니다.</p>
      </section>
    );
  }
  return (
    <section>
      <h2>대시보드</h2>
      <p>현재 저장소에 등록된 콘텐츠를 기준으로 표시합니다.</p>
      <div className={s.stats}>
        <div className={s.panel}>
          <span>프로젝트</span>
          <strong>{projects.length}</strong>
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
          관리자 인증·권한 → 개발 DB 저장 → 썸네일 업로드 → 공개 사이트 반영
          순서로 연결합니다.
        </p>
      </div>
    </section>
  );
}
