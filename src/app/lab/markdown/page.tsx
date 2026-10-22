import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { CommonButtonLink } from '@/components/ui/CommonButton';
import { getGuideDocuments } from '@/server/services/guide-documents';
import { MarkdownViewer } from '@/app/guide/markdown/MarkdownViewer';
import s from '@/app/guide/guide.module.css';

export const metadata: Metadata = {
  title: '실험실 · Markdown 뷰어',
  robots: { index: false, follow: false },
};

export default async function LabMarkdownPage() {
  if (process.env.NODE_ENV !== 'development') notFound();
  const documents = await getGuideDocuments();
  return (
    <div className={`page ${s.guide}`}>
      <h1>
        Markdown 뷰어
        <span className="accentDot" />
      </h1>
      <p>프로젝트 문서를 선택하거나 내 PC의 Markdown 파일을 열어보세요.</p>
      <div className={s.row}>
        <CommonButtonLink href="/lab">실험실로 돌아가기</CommonButtonLink>
        <CommonButtonLink href="/guide/environment">
          환경 구조도
        </CommonButtonLink>
      </div>
      <MarkdownViewer documents={documents} />
    </div>
  );
}
