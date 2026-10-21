import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { IdeaPlayground } from './IdeaPlayground';

export const metadata: Metadata = {
  title: '아이디어 저장소 초안',
  robots: { index: false, follow: false },
};

export default function IdeasPage() {
  if (process.env.NODE_ENV !== 'development') notFound();
  return <IdeaPlayground />;
}
