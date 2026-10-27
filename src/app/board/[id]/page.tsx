import { notFound } from 'next/navigation';
import Link from 'next/link';
import { getPublicPost } from '@/server/services/posts';
import { CommonRichTextView } from '@/components/ui/CommonRichTextView';
import { getCategoryLabel } from '@/content/site';
import { getMessages } from '@/i18n/server';
import { CommonButtonLink } from '@/components/ui/CommonButton';
import s from './post.module.css';

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { messages, locale } = await getMessages();
  const { id } = await params;
  return {
    title: (await getPublicPost(id, locale))?.title ?? messages.board.missing,
  };
}
export default async function Post({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { messages, locale } = await getMessages();
  const { id } = await params;
  const post = await getPublicPost(id, locale);
  if (!post) notFound();
  return (
    <article className={s.article}>
      <Link className={s.back} href="/board">
        {messages.board.back}
      </Link>
      <header className={s.header}>
        <div className={s.meta}>
          <Link
            className={s.category}
            href={'/board?' + new URLSearchParams({ category: post.category })}
          >
            {getCategoryLabel(post.category, messages)}
          </Link>
          <span className={s.dot} aria-hidden="true" />
          <time dateTime={post.date.replaceAll('.', '-')}>{post.date}</time>
        </div>
        <h1 className={s.title}>{post.title}</h1>
        {post.summary && <p className={s.summary}>{post.summary}</p>}
      </header>
      {locale !== post.contentLocale && (
        <p className={s.notice}>
          {locale === 'en'
            ? 'This post is available in Korean.'
            : '원문을 표시합니다.'}
        </p>
      )}
      <div className={s.body}>
        <CommonRichTextView value={post.body} />
      </div>
      <footer className={s.footer}>
        <span className={s.endmark} aria-hidden="true">
          ✳
        </span>
        <CommonButtonLink href="/board" variant="neutral">
          {messages.board.back}
        </CommonButtonLink>
      </footer>
    </article>
  );
}
