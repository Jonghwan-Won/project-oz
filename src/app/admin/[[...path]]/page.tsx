import { getMessages } from '@/i18n/server';
import { getPostCategories } from '@/server/services/post-categories';
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
import { CodeManager } from '../CodeManager';
import { getAdminCodes } from '@/server/services/admin-codes';
import { AssetManager } from '../AssetManager';
import { getAdminAssets } from '@/server/services/admin-assets';
import { emptyAssetSearch, formatAssetSize } from '@/lib/admin-assets';
import { headers } from 'next/headers';
import { InquiryManager } from '../InquiryManager';
import { getAdminInquiries } from '@/server/services/admin-inquiries';

import { CommonButton, CommonButtonLink } from '@/components/ui/CommonButton';
import s from '../admin.module.css';
import { getAdminSession } from '@/server/auth';
import { getDashboardSummary } from '@/server/services/dashboard';

export default async function Admin({
  params,
  searchParams,
}: {
  params: Promise<{ path?: string[] }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { path = [] } = await params;
  if (path.length > 2 || (path.length > 1 && path[0] !== 'board')) notFound();
  const section = path[0];
  const admin = await getAdminSession(await headers());
  const readOnly = !admin;
  if (
    readOnly &&
    (['codes', 'inquiries'].includes(section) ||
      (section === 'board' && path[1] === 'new'))
  )
    redirect(`/login?next=${encodeURIComponent('/admin/' + path.join('/'))}`);
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
      getAdminProjects(search, readOnly),
      getAdminProjectCount(readOnly),
    ]);
    return (
      <ProjectManager
        key={JSON.stringify(search)}
        readOnly={readOnly}
        {...data}
        initialSearch={search}
        total={total}
      />
    );
  }
  if (section === 'board') {
    const { locale } = await getMessages();
    const categoryOptions = await getPostCategories();
    if (path[1] === 'new')
      return (
        <PostEditor
          categoryOptions={categoryOptions}
          displayLocale={locale}
          readOnly={readOnly}
        />
      );
    if (path[1]) {
      const post = await getAdminPost(path[1], readOnly);
      if (!post) notFound();
      return (
        <PostEditor
          categoryOptions={categoryOptions}
          key={post.id}
          initialPost={post}
          readOnly={readOnly}
        />
      );
    }
    const search = {
      keyword: value('keyword'),
      category: value('category'),
      status: value('status'),
    };
    const [posts, total] = await Promise.all([
      getAdminPosts(search, readOnly),
      getAdminPostCount(readOnly),
    ]);
    return (
      <BoardManager
        categoryOptions={categoryOptions}
        key={JSON.stringify(search)}
        readOnly={readOnly}
        posts={posts}
        initialSearch={search}
        total={total}
      />
    );
  }
  if (section === 'codes') return <CodeManager {...await getAdminCodes()} />;
  if (section === 'inquiries') {
    const search = {
      type: value('type'),
      status: value('status'),
      keyword: value('keyword'),
    };
    return (
      <InquiryManager
        key={JSON.stringify(search)}
        {...await getAdminInquiries(search)}
        initialSearch={search}
      />
    );
  }
  if (section === 'assets') {
    const search = {
      keyword: value('keyword'),
      filter: value('filter') || emptyAssetSearch.filter,
      sort: value('sort') || emptyAssetSearch.sort,
    };
    return (
      <AssetManager
        key={JSON.stringify(search)}
        readOnly={readOnly}
        {...await getAdminAssets(search, readOnly)}
        initialSearch={search}
      />
    );
  }
  if (section) notFound();
  const { postsSummary, projectsSummary, unusedAssets, pendingInquiries } =
    await getDashboardSummary();
  return (
    <section>
      {readOnly && (
        <p className={s.notice}>
          관리 화면을 읽기 전용으로 둘러보고 있습니다. 공개 콘텐츠만 표시하며
          문의·공통코드는 관리자 전용입니다. 대시보드는 집계 정보만 표시합니다.
        </p>
      )}
      <div className={s.stats}>
        <div className={s.panel}>
          <span>프로젝트</span>
          <strong>{projectsSummary.total}개</strong>
          <small>
            노출 {projectsSummary.visible}개 · 미노출{' '}
            {projectsSummary.total - projectsSummary.visible}개
          </small>
          <CommonButtonLink href="/admin/projects">
            프로젝트 관리
          </CommonButtonLink>
        </div>
        <div className={s.panel}>
          <span>게시글</span>
          <strong>{postsSummary.total}개</strong>
          <small>
            노출 {postsSummary.visible}개 · 미노출{' '}
            {postsSummary.total - postsSummary.visible}개
          </small>
          <CommonButtonLink href="/admin/board">게시판 관리</CommonButtonLink>
        </div>
        {
          <div className={s.panel}>
            <span>처리 대기 문의</span>
            <strong>{pendingInquiries}건</strong>
            <small>상태가 대기인 문의·버그 제보</small>
            {readOnly ? (
              <CommonButton disabled title="관리자만 확인할 수 있습니다.">
                대기 문의 확인
              </CommonButton>
            ) : (
              <CommonButtonLink href="/admin/inquiries?status=0">
                대기 문의 확인
              </CommonButtonLink>
            )}
          </div>
        }
        <div className={s.panel}>
          <span>미사용 첨부파일</span>
          <strong>{unusedAssets.count}개</strong>
          <small>
            총 {formatAssetSize(unusedAssets.size)} · 저장된 콘텐츠에 연결되지
            않은 파일
          </small>
          <CommonButtonLink href="/admin/assets?filter=unused">
            미사용 파일 확인
          </CommonButtonLink>
        </div>
      </div>
      <div className={s.panel}>
        <h3>관리 권한 안내</h3>
        <p>
          공개 콘텐츠는 누구나 조회할 수 있습니다. 등록·수정·삭제와 내부 관리
          정보는 지정된 GitHub 계정으로 로그인한 관리자만 사용할 수 있습니다.
        </p>
        {readOnly && (
          <CommonButtonLink href="/login?next=%2Fadmin" variant="primary">
            관리자 로그인
          </CommonButtonLink>
        )}
      </div>
    </section>
  );
}
