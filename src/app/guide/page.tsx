import type { Metadata } from 'next';
import { GuideTabs } from './GuideTabs';
import { headers } from 'next/headers';
import { getAdminSession } from '@/server/auth';
import { getGuideMessages } from '@/i18n/guide-server';

export async function generateMetadata(): Promise<Metadata> {
  const { messages } = await getGuideMessages();
  return {
    title: messages.guide.metaTitle,
    robots: { index: false, follow: false },
  };
}

export default async function Guide() {
  const [admin, { messages }] = await Promise.all([
    getAdminSession(await headers()),
    getGuideMessages(),
  ]);
  return (
    <GuideTabs
      admin={!!admin}
      messages={{
        guide: messages.guide,
        examples: messages.examples,
        components: messages.components,
      }}
    />
  );
}
