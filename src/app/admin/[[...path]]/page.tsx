import { ProjectManager } from '../ProjectManager';
import {
  getAdminProjectCount,
  getAdminProjects,
} from '@/server/services/admin-projects';
import { redirect, notFound } from 'next/navigation';
import {
  getAdminPost,
  getAdminPostCount,
  getAdminPosts,
} from '@/server/services/posts';
import { BoardManager } from '../BoardManager';
import { PostEditor } from '../PostEditor';

import { CommonButtonLink } from '@/components/ui/CommonButton';
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
  searchParams,
}: {
  params: Promise<{ path?: string[] }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  if (process.env.NODE_ENV !== 'development') redirect('/login');
  const { path = [] } = await params;
  if (path.length > 2 || (path.length > 1 && path[0] !== 'board')) notFound();
  const section = path[0];
  const query = await searchParams;
  const value = (key: string) =>
    typeof query[key] === 'string' ? (query[key] as string) : '';
  if (section === 'projects') {
    const search = {
      keyword: value('keyword'),
      originCode: value('originCode'),
      typeCode: value('typeCode'),
      isVisible: value('isVisible'),
    };
    const [data, total] = await Promise.all([
      getAdminProjects(search),
      getAdminProjectCount(),
    ]);
    return (
      <ProjectManager
        key={JSON.stringify(search)}
        {...data}
        initialSearch={search}
        total={total}
      />
    );
  }
  if (section === 'board') {
    if (path[1] === 'new') return <PostEditor />;
    if (path[1]) {
      const post = await getAdminPost(path[1]);
      if (!post) notFound();
      return <PostEditor key={post.id} initialPost={post} />;
    }
    const search = {
      keyword: value('keyword'),
      category: value('category'),
      status: value('status'),
    };
    const [posts, total] = await Promise.all([
      getAdminPosts(search),
      getAdminPostCount(),
    ]);
    return (
      <BoardManager
        key={JSON.stringify(search)}
        posts={posts}
        initialSearch={search}
        total={total}
      />
    );
  }
  if (section) {
    const item = Object.entries(planned).find(([key]) => key === section)?.[1];
    if (!item) notFound();
    return (
      <section className={s.panel}>
        <p>{item.description}</p>
        <p>현재는 메뉴와 용도를 확인하는 준비 화면입니다.</p>
      </section>
    );
  }
  const postCount = await getAdminPostCount();
  const projectCount = await getAdminProjectCount();
  return (
    <section>
      {/* <p>프로젝트는 개발 DB, 게시글은 저장소 콘텐츠를 기준으로 표시합니다.</p> */}
      <div className={s.stats}>
        <div className={s.panel}>
          <span>프로젝트</span>
          <strong>{projectCount}</strong>
          <CommonButtonLink href="/admin/projects">
            프로젝트 관리
          </CommonButtonLink>
        </div>
        <div className={s.panel}>
          <span>게시글</span>
          <strong>{postCount}</strong>
          <CommonButtonLink href="/admin/board">게시판 관리</CommonButtonLink>
        </div>
      </div>
      <div className={s.panel}>
        <h3>다음 연결 항목</h3>
        <p>
          프로젝트와 게시판 조회·저장은 개발 DB에 연결했습니다. 운영 관리자
          인증·권한은 다음 단계입니다.
        </p>
      </div>
    </section>
  );
}
