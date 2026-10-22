import type { Metadata } from 'next';
import { redirect } from 'next/navigation';

export const metadata: Metadata = {
  title: '아이디어 저장소 초안',
  robots: { index: false, follow: false },
};

export default function IdeasPage() {
  redirect('/lab/ideas');
}
