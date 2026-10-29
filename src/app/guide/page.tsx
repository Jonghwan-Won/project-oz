import type { Metadata } from 'next';
import { GuideTabs } from './GuideTabs';
import { headers } from 'next/headers';
import { getAdminSession } from '@/server/auth';

export const metadata: Metadata = {
  title: '개발 가이드',
  robots: { index: false, follow: false },
};

export default async function Guide() {
  return <GuideTabs admin={!!(await getAdminSession(await headers()))} />;
}
