import { CommonInput } from '@/components/ui/CommonInput';
import { CommonButton } from '@/components/ui/CommonButton';
import Link from 'next/link';
import { categories, getCategoryLabel } from '@/content/site';
import { getPublicPosts } from '@/server/services/posts';
import { getMessages } from '@/i18n/server';
import { paginate } from '@/lib/admin-list';
import s from './board.module.css';
export async function generateMetadata() {
  const { messages } = await getMessages();
  return { title: messages.navigation.board };
}
export default async function Board({
  searchParams,
}: {
  searchParams: Promise<{ category?: string; q?: string; page?: string }>;
}) {
  const { messages, locale } = await getMessages();
  const copy = messages.board;
  const params = await searchParams;
  const category =
    typeof params.category === 'string' && categories.includes(params.category)
      ? params.category
      : '전체';
  const q = typeof params.q === 'string' ? params.q.slice(0, 100) : '';
  const posts = await getPublicPosts(locale);
  const selected = posts.filter(
    (post) =>
      (category === '전체' || post.category === category) &&
      (post.title + ' ' + post.summary)
        .toLowerCase()
        .includes(q.trim().toLowerCase()),
  );
  const requestedPage =
    typeof params.page === 'string' && /^\d+$/.test(params.page)
      ? Number(params.page)
      : 1;
  const result = paginate(selected, requestedPage, 10);
  const firstPage = Math.max(
    1,
    Math.min(result.page - 2, result.totalPages - 4),
  );
  const pageHref = (page: number) =>
    '/board?' + new URLSearchParams({ category, q, page: String(page) });
  return (
    <div className={s.page}>
      {/* <MainPageLink href="/#board" label={messages.navigation.main} /> */}
      <header className={s.header}>
        <h1 className="accentDot">{copy.title}</h1>
        <p className={s.intro}>{copy.intro}</p>
      </header>
      <div className={s.tools}>
        <nav className={s.filter} aria-label={copy.filterLabel}>
          {categories.map((c) => (
            <Link
              key={c}
              href={'/board?' + new URLSearchParams({ category: c, q })}
              aria-current={c === category ? 'page' : undefined}
            >
              {getCategoryLabel(c, messages)}
            </Link>
          ))}
        </nav>
      </div>
      <ul className={s.list}>
        {result.items.map((post) => (
          <li key={post.id}>
            <Link className={s.row} href={'/board/' + post.id}>
              <div className={s.content}>
                <div className={s.meta}>
                  <span className={s.category}>
                    {getCategoryLabel(post.category, messages)}
                  </span>
                  <time dateTime={post.date.replaceAll('.', '-')}>
                    {post.date}
                  </time>
                </div>
                <h3>{post.title}</h3>
                {post.excerpt && <p className={s.excerpt}>{post.excerpt}</p>}
              </div>
            </Link>
          </li>
        ))}
      </ul>
      {selected.length > 0 && (
        <nav className={s.pagination} aria-label={copy.paginationLabel}>
          {result.page > 1 && (
            <Link
              href={pageHref(result.page - 1)}
              aria-label={copy.previousPage}
            >
              ←
            </Link>
          )}
          {Array.from(
            { length: Math.min(5, result.totalPages) },
            (_, index) => firstPage + index,
          ).map((page) => (
            <Link
              key={page}
              href={pageHref(page)}
              aria-label={`${copy.pageLabel} ${page}`}
              aria-current={page === result.page ? 'page' : undefined}
            >
              {page}
            </Link>
          ))}
          {result.page < result.totalPages && (
            <Link href={pageHref(result.page + 1)} aria-label={copy.nextPage}>
              →
            </Link>
          )}
        </nav>
      )}
      {!selected.length && (
        <div className={s.empty}>
          <span className={s.emptyMark} aria-hidden="true">
            ✳
          </span>
          <h2>{copy.empty}</h2>
          <p>{q ? copy.emptyQuery : copy.emptyCategory}</p>
          {/* <Link className="textLink" href="/board">
            {copy.allLink}
          </Link> */}
        </div>
      )}
      <form
        className={s.search}
        action="/board"
        role="search"
        autoComplete="off"
      >
        <CommonInput type="hidden" name="category" value={category} />
        <label className="srOnly" htmlFor="query">
          {copy.searchLabel}
        </label>
        <div className={s.searchField}>
          <CommonInput
            id="query"
            name="q"
            autoComplete="off"
            maxLength={100}
            defaultValue={q}
            placeholder={copy.placeholder}
          />
        </div>
        <CommonButton
          className={s.searchButton}
          variant="neutral"
          type="submit"
          aria-label={copy.search}
          title={copy.search}
        >
          <svg
            width="21"
            height="21"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
            aria-hidden="true"
          >
            <circle cx="10.5" cy="10.5" r="6.5" />
            <path d="m16 16 4.5 4.5" />
          </svg>
        </CommonButton>
      </form>
    </div>
  );
}
