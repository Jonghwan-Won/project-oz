import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { ButtonLink } from '@/components/ui/Button';
import { getGuideDocuments } from '@/server/services/guide-documents';
import { MarkdownViewer } from './MarkdownViewer';
import s from '../guide.module.css';

export const metadata: Metadata = {
  title: 'Markdown 뷰어',
  robots: { index: false, follow: false },
};

export default async function MarkdownPage() {
  if (process.env.NODE_ENV !== 'development') notFound();
  const documents = await getGuideDocuments();
  return (
    <div className={`page ${s.guide}`}>
      <span className="eyebrow">MARKDOWN VIEWER</span>
      <h1>
        문서를 읽는 공간
        <span className="accentDot" />
      </h1>
      <p>프로젝트 문서를 선택하거나 내 PC의 Markdown 파일을 열어보세요.</p>
      <div className={s.row}>
        <ButtonLink href="/guide">가이드로 돌아가기</ButtonLink>
        <ButtonLink href="/guide/environment">환경 구조도</ButtonLink>
      </div>
      <MarkdownViewer documents={documents} />
    </div>
  );
}
