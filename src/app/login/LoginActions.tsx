'use client';
import { useRef, useState } from 'react';
import type { Messages } from '@/i18n/ko';
import { useRouter } from 'next/navigation';
import { authClient } from '@/lib/auth-client';
import { CommonLoading } from '@/components/ui/CommonLoading';
import { CommonButton } from '@/components/ui/CommonButton';
import s from './login.module.css';
export function LoginActions({
  signedIn,
  copy,
  next,
  compact = false,
}: {
  signedIn: boolean;
  copy: Messages['account'];
  /** 로그인 성공 후 돌아갈 내부 경로. 서버에서 safeReturnPath로 검증한 값이다. */
  next: string;
  compact?: boolean;
}) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const pending = useRef(false);
  const [error, setError] = useState(false);
  async function action() {
    if (pending.current) return;
    pending.current = true;
    setBusy(true);
    setError(false);
    try {
      const result = signedIn
        ? await authClient.signOut()
        : await authClient.signIn.social({
            provider: 'github',
            callbackURL: next,
            errorCallbackURL: `/login?next=${encodeURIComponent(next)}`,
          });
      if (result.error) throw Error('Sign-in failed');
      if (signedIn) {
        router.replace('/login');
        router.refresh();
        pending.current = false;
        setBusy(false);
      }
    } catch {
      pending.current = false;
      setError(true);
      setBusy(false);
    }
  }
  return (
    <div className={compact ? undefined : s.actions}>
      <CommonLoading open={busy} />
      {signedIn && !compact && <p>{copy.otherAccount}</p>}
      <CommonButton
        className={compact ? undefined : s.github}
        variant="primary"
        disabled={busy}
        onClick={action}
      >
        {compact ? (
          copy.signOut
        ) : (
          <span className={s.buttonContent}>
            <svg
              viewBox="0 0 24 24"
              width="21"
              height="21"
              fill="currentColor"
              aria-hidden="true"
            >
              <path d="M12 .8a11.2 11.2 0 0 0-3.54 21.83c.56.1.77-.24.77-.54v-2.08c-3.13.68-3.79-1.33-3.79-1.33-.51-1.3-1.25-1.65-1.25-1.65-1.03-.7.08-.69.08-.69 1.14.08 1.74 1.17 1.74 1.17 1.01 1.73 2.65 1.23 3.3.94.1-.73.4-1.23.72-1.51-2.5-.28-5.13-1.25-5.13-5.54 0-1.22.44-2.22 1.16-3-.12-.28-.5-1.42.11-2.96 0 0 .95-.3 3.08 1.15a10.7 10.7 0 0 1 5.6 0c2.13-1.44 3.07-1.15 3.07-1.15.62 1.54.24 2.68.12 2.96.72.78 1.15 1.78 1.15 3.01 0 4.3-2.63 5.25-5.14 5.53.4.35.76 1.03.76 2.08v3.17c0 .3.2.65.77.54A11.2 11.2 0 0 0 12 .8Z" />
            </svg>
            <span>{signedIn ? copy.signOut : copy.signIn}</span>
          </span>
        )}
      </CommonButton>
      {error && (
        <p className={s.error} role="alert">
          {copy.connectionFailed}
        </p>
      )}
    </div>
  );
}
