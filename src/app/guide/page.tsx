import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { GuideTabs } from './GuideTabs';

export const metadata: Metadata = {
  title: '개발 가이드',
  robots: { index: false, follow: false },
};

export default function Guide() {
  if (process.env.NODE_ENV !== 'development') notFound();
  return <GuideTabs />;
}
