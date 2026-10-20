import { ErrorView } from '@/components/ErrorView';
import { getMessages } from '@/i18n/server';
import { errorMessages } from '@/i18n/errors';

export const metadata = { robots: { index: false, follow: false } };

export default async function ErrorPreview() {
  const { locale } = await getMessages();
  return <ErrorView labels={errorMessages[locale]} />;
}
