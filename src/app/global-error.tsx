'use client';

import { ErrorView } from '@/components/ErrorView';
import { errorMessages } from '@/i18n/errors';
import { useErrorLocale } from '@/i18n/use-error-locale';
import { useSyncExternalStore } from 'react';
import { resolveTheme, themeCookie } from '@/theme/theme';
import './globals.css';

const subscribe = () => () => {};
const getTheme = () =>
  resolveTheme(
    document.cookie
      .split('; ')
      .find((item) => item.startsWith(`${themeCookie}=`))
      ?.split('=')[1],
  );
const serverTheme = () => 'dark' as const;

export default function GlobalError({
  retry,
}: {
  error: unknown;
  retry: () => void;
}) {
  const locale = useErrorLocale();
  const theme = useSyncExternalStore(subscribe, getTheme, serverTheme);
  return (
    <html lang={locale} data-theme={theme}>
      <body>
        <main>
          <ErrorView labels={errorMessages[locale]} failure onRetry={retry} />
        </main>
      </body>
    </html>
  );
}
