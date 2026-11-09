import type { Metadata } from 'next';
import { IdeaPlayground } from '@/app/guide/ideas/IdeaPlayground';
import { getGuideMessages } from '@/i18n/guide-server';

export async function generateMetadata(): Promise<Metadata> {
  const { messages } = await getGuideMessages();
  return {
    title: messages.ideas.labMetaTitle,
    robots: { index: false, follow: false },
  };
}

export default async function LabIdeasPage() {
  const { messages } = await getGuideMessages();
  return (
    <IdeaPlayground
      messages={messages.ideas}
      backToLab={messages.lab.backToLab}
    />
  );
}
