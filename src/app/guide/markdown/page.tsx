import type { Metadata } from 'next';
import { redirect } from 'next/navigation';

export const metadata: Metadata = {
  title: 'Markdown 뷰어',
  robots: { index: false, follow: false },
};

export default function MarkdownPage() {
  redirect('/lab/markdown');
}
