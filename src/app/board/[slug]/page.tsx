import { notFound } from 'next/navigation';
import Link from 'next/link';
import { posts, getCategoryLabel } from '@/content/site';
import { getMessages } from '@/i18n/server';
export function generateStaticParams() {
  return posts.map(({ slug }) => ({ slug }));
}
export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { messages } = await getMessages();
  const { slug } = await params;
  return {
    title: posts.find((p) => p.slug === slug)?.title ?? messages.board.missing,
  };
}
export default async function Post({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { messages } = await getMessages();
  const { slug } = await params;
  const post = posts.find((p) => p.slug === slug);
  if (!post) notFound();
  return (
    <article className="page">
      <Link className="textLink" href="/board">
        {messages.board.back}
      </Link>
      <h1>{post.title}</h1>
      <p className="lead">
        {getCategoryLabel(post.category, messages)} · {post.date} ·{' '}
        {messages.board.draft}
      </p>
      <div className="prose">
        {post.paragraphs.map((p) => (
          <p key={p}>{p}</p>
        ))}
      </div>
    </article>
  );
}
