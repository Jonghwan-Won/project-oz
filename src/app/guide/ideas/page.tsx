import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { getGuideMessages } from '@/i18n/guide-server';

export async function generateMetadata(): Promise<Metadata> {
  const { messages } = await getGuideMessages();
  return {
    title: messages.ideas.draftMetaTitle,
    robots: { index: false, follow: false },
  };
}

export default function IdeasPage() {
  redirect('/lab/ideas');
}
