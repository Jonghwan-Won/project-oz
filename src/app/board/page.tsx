import { Button } from '@/components/ui/Button';
import Link from 'next/link';
import { categories, filterPosts, getCategoryLabel } from '@/content/site';
import { getMessages } from '@/i18n/server';
export async function generateMetadata() {
  const { messages } = await getMessages();
  return { title: messages.navigation.board };
}
export default async function Board({
  searchParams,
}: {
  searchParams: Promise<{ category?: string; q?: string }>;
}) {
  const { messages } = await getMessages();
  const copy = messages.board;
  const params = await searchParams;
  const category =
    typeof params.category === 'string' && categories.includes(params.category)
      ? params.category
      : '전체';
  const q = typeof params.q === 'string' ? params.q.slice(0, 100) : '';
  const selected = filterPosts(category, q);
  return (
    <div className="page">
      <span className="eyebrow">NOTES / LEARNING & IDEAS</span>
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
        <input type="hidden" name="category" value={category} />
        <label className="srOnly" htmlFor="query">
          {copy.searchLabel}
        </label>
        <input
          id="query"
          name="q"
          maxLength={100}
          defaultValue={q}
          placeholder={copy.placeholder}
        />
        <Button
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
        </Button>
      </form>
      <p className="eyebrow">
        {getCategoryLabel(category, messages)} · {copy.count}: {selected.length}
      </p>
      {selected.map((post) => (
        <Link className="listRow" key={post.slug} href={'/board/' + post.slug}>
          <div>
            <span className="tag">
              {getCategoryLabel(post.category, messages)}
            </span>
            <h2>{post.title}</h2>
            <p>{post.excerpt}</p>
          </div>
          <span>{post.date} ↗</span>
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
