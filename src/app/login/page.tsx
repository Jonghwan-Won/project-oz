import { CommonButtonLink } from '@/components/ui/CommonButton';
import { getMessages } from '@/i18n/server';
import { headers } from 'next/headers';
import { redirect } from 'next/navigation';
import { getAuth, getAdminSession } from '@/server/auth';
import { returnPathFromReferer, safeReturnPath } from '@/lib/return-path';
import { LoginActions } from './LoginActions';
import s from './login.module.css';

export async function generateMetadata() {
  const { messages } = await getMessages();
  return {
    title: messages.account.metadata,
    robots: { index: false, follow: false },
  };
}

export default async function Login({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { messages } = await getMessages();
  const copy = messages.account;
  const auth = getAuth();
  const requestHeaders = await headers();
  let signedIn = false;
  let admin = false;
  let available = !!auth;
  if (auth) {
    try {
      signedIn = !!(await auth.api.getSession({
        headers: requestHeaders,
        query: { disableCookieCache: true },
      }));
      if (signedIn) admin = !!(await getAdminSession(requestHeaders));
    } catch {
      available = false;
    }
  }
  const query = await searchParams;
  // 로그인 후 돌아갈 곳: ?next= 값, 없으면 직전 페이지(같은 사이트의 Referer), 그것도 없으면 홈.
  const next =
    typeof query.next === 'string'
      ? safeReturnPath(query.next)
      : returnPathFromReferer(
          requestHeaders.get('referer'),
          requestHeaders.get('host'),
        );
  if (admin) redirect(next);
  return (
    <div className={`page ${s.page}`}>
      <section className={s.card} aria-labelledby="login-title">
        <div className={s.brand} aria-hidden="true">
          <span className={s.wordmark}>Jonghwan Won</span>
          <span className={s.eyebrow}>{copy.eyebrow}</span>
        </div>
        <h1 id="login-title">{copy.title}</h1>
        <p className={s.description}>{copy.intro}</p>
        <div className={s.access}>
          <span className={s.lock} aria-hidden="true">
            <svg viewBox="0 0 24 24" focusable="false">
              <rect x="5" y="10.5" width="14" height="10" rx="2.5" />
              <path d="M8.5 10.5V8a3.5 3.5 0 0 1 7 0v2.5M12 14.5v2" />
            </svg>
          </span>
          <p>{copy.notice}</p>
        </div>
        {!available ? (
          <p className={s.error} role="status">
            {copy.unavailable}
          </p>
        ) : (
          <LoginActions signedIn={signedIn} copy={copy} next={next} />
        )}
        {query.error && (
          <p className={s.error} role="alert">
            {copy.failed}
          </p>
        )}
        <CommonButtonLink href="/" variant="ghost" className={s.github}>
          {copy.home}
        </CommonButtonLink>
      </section>
    </div>
  );
}
