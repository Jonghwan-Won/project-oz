'use client';

import { ErrorView } from '@/components/ErrorView';
import { errorMessages } from '@/i18n/errors';
import { useErrorLocale } from '@/i18n/use-error-locale';

export default function Error({
  retry,
}: {
  error: unknown;
  retry: () => void;
}) {
  const locale = useErrorLocale();
  return <ErrorView labels={errorMessages[locale]} failure onRetry={retry} />;
}
