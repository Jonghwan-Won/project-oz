import { notFound } from 'next/navigation';
import Link from 'next/link';
import { getPublicPost, getPublicPosts } from '@/server/services/posts';
import { CommonRichTextView } from '@/components/ui/CommonRichTextView';
import { getCategoryLabel } from '@/content/site';
import { getMessages } from '@/i18n/server';
import { paginate } from '@/lib/admin-list';
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
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ page?: string }>;
}) {
  const { messages, locale } = await getMessages();
  const { id } = await params;
  const post = await getPublicPost(id, locale);
  if (!post) notFound();
  const posts = await getPublicPosts(locale);
  const currentIndex = posts.findIndex((item) => item.id === post.id);
  const { page } = await searchParams;
  const requestedPage =
    typeof page === 'string' && /^\d+$/.test(page)
      ? Number(page)
      : Math.floor(Math.max(0, currentIndex) / 5) + 1;
  const result = paginate(posts, requestedPage, 5);
  const firstPage = Math.floor((result.page - 1) / 5) * 5 + 1;
  const lastPage = Math.min(firstPage + 4, result.totalPages);
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
        <section id="post-list" aria-label={messages.board.postNavigation}>
          <div className={s.listHeader}>
            <h2>
              {getCategoryLabel('전체', messages)}{' '}
              <span>
                {messages.board.count} {posts.length}
              </span>
            </h2>
            <Link href="/board">{messages.board.allLink} →</Link>
          </div>
          <div className={s.listLabels}>
            <span>{messages.board.postTitle}</span>
            <span>{messages.board.postDate}</span>
          </div>
          <ul className={s.relatedList}>
            {result.items.map((item) => (
              <li key={item.id}>
                <Link
                  href={'/board/' + item.id}
                  className={s.relatedLink}
                  aria-current={item.id === post.id ? 'page' : undefined}
                >
                  <span title={item.title}>{item.title}</span>
                  <time dateTime={item.date.replaceAll('.', '-')}>
                    {item.date}
                  </time>
                </Link>
              </li>
            ))}
          </ul>
          {result.totalPages > 1 && (
            <nav
              className={s.pagination}
              aria-label={messages.board.paginationLabel}
            >
              {firstPage > 1 && (
                <Link
                  href={`?page=${firstPage - 1}`}
                  scroll={false}
                  aria-label={messages.board.previousPage}
                >
                  {messages.board.previousGroup}
                </Link>
              )}
              {Array.from(
                { length: lastPage - firstPage + 1 },
                (_, index) => firstPage + index,
              ).map((number) => (
                <Link
                  key={number}
                  href={`?page=${number}`}
                  scroll={false}
                  aria-label={`${messages.board.pageLabel} ${number}`}
                  aria-current={number === result.page ? 'page' : undefined}
                >
                  {number}
                </Link>
              ))}
              {lastPage < result.totalPages && (
                <Link
                  href={`?page=${lastPage + 1}`}
                  scroll={false}
                  aria-label={messages.board.nextPage}
                >
                  {messages.board.nextGroup}
                </Link>
              )}
            </nav>
          )}
        </section>
      </footer>
    </article>
  );
}
