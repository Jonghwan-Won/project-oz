import { notFound } from 'next/navigation';
import Link from 'next/link';
import { getPublicPosts } from '@/server/services/posts';
import { CommonRichTextView } from '@/components/ui/CommonRichTextView';
import { getCategoryLabel } from '@/content/site';
import { getMessages } from '@/i18n/server';

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { messages, locale } = await getMessages();
  const { slug } = await params;
  return {
    title:
      (await getPublicPosts(locale, slug))[0]?.title ?? messages.board.missing,
  };
}
export default async function Post({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { messages, locale } = await getMessages();
  const { slug } = await params;
  const post = (await getPublicPosts(locale, slug))[0];
  if (!post) notFound();
  return (
    <article className="page">
      <Link className="textLink" href="/board">
        {messages.board.back}
      </Link>
      <h1>{post.title}</h1>
      <p className="lead">
        {getCategoryLabel(post.category, messages)} · {post.date}
      </p>
      {locale !== post.contentLocale && (
        <p>
          {locale === 'en'
            ? 'This post is available in Korean.'
            : '원문을 표시합니다.'}
        </p>
      )}
      <p className="lead">{post.summary}</p>
      <CommonRichTextView value={post.body} />
    </article>
  );
}
