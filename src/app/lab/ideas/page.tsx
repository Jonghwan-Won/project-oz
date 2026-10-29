import type { Metadata } from 'next';
import { IdeaPlayground } from '@/app/guide/ideas/IdeaPlayground';

export const metadata: Metadata = {
  title: '실험실 · 아이디어 저장소',
  robots: { index: false, follow: false },
};

export default function LabIdeasPage() {
  return <IdeaPlayground />;
}
