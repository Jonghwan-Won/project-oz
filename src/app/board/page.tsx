import { CommonInput } from '@/components/ui/CommonInput';
import { CommonButton } from '@/components/ui/CommonButton';
import Link from 'next/link';
import { categories, getCategoryLabel } from '@/content/site';
import { getPublicPosts } from '@/server/services/posts';
import { getMessages } from '@/i18n/server';
import { MainPageLink } from '@/components/MainPageLink';
export async function generateMetadata() {
  const { messages } = await getMessages();
  return { title: messages.navigation.board };
}
export default async function Board({
  searchParams,
}: {
  searchParams: Promise<{ category?: string; q?: string }>;
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
  return (
    <div className="page">
      <MainPageLink href="/#board" label={messages.navigation.main} />
      <h1>{copy.title}</h1>
      <p className="lead">{copy.intro}</p>
      <div className="filter" aria-label={copy.filterLabel}>
        {categories.map((c) => (
          <Link
            key={c}
            href={'/board?' + new URLSearchParams({ category: c, q })}
            aria-current={c === category ? 'page' : undefined}
          >
            {getCategoryLabel(c, messages)}
          </Link>
        ))}
      </div>
      <form className="search" action="/board">
        <CommonInput type="hidden" name="category" value={category} />
        <label className="srOnly" htmlFor="query">
          {copy.searchLabel}
        </label>
        <CommonInput
          id="query"
          name="q"
          maxLength={100}
          defaultValue={q}
          placeholder={copy.placeholder}
        />
        <CommonButton
          className="searchButton"
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
      <p className="eyebrow">
        {getCategoryLabel(category, messages)} · {copy.count}: {selected.length}
      </p>
      {selected.map((post) => (
        <Link className="listRow" key={post.id} href={'/board/' + post.id}>
          <div>
            <span className="tag">
              {getCategoryLabel(post.category, messages)}
            </span>
            <h2>{post.title}</h2>
            <p>{post.excerpt}</p>
          </div>
          <span>{post.date}</span>
        </Link>
      ))}
      {!selected.length && (
        <div className="empty">
          <h2>{copy.empty}</h2>
          <p>{q ? copy.emptyQuery : copy.emptyCategory}</p>
          <Link className="textLink" href="/board">
            {copy.allLink}
          </Link>
        </div>
      )}
    </div>
  );
}
