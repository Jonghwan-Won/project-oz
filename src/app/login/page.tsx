import { CommonButtonLink } from '@/components/ui/CommonButton';
import { getMessages } from '@/i18n/server';
import { headers } from 'next/headers';
import { redirect } from 'next/navigation';
import { getAuth, getAdminSession } from '@/server/auth';
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
  if (admin) redirect('/');
  const query = await searchParams;
  return (
    <div className={`page ${s.page}`}>
      <section className={s.card} aria-labelledby="login-title">
        <div className={s.mark} aria-hidden="true">
          OZ
        </div>
        <h1 id="login-title">{copy.title}</h1>
        <p className={s.description}>{copy.intro}</p>
        <div className={s.access}>
          <span aria-hidden="true">◈</span>
          <p>{copy.notice}</p>
        </div>
        {!available ? (
          <p className={s.error} role="status">
            {copy.unavailable}
          </p>
        ) : (
          <LoginActions signedIn={signedIn} copy={copy} />
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
