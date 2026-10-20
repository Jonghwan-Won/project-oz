import { ErrorView } from '@/components/ErrorView';
import { getMessages } from '@/i18n/server';
import { errorMessages } from '@/i18n/errors';

export default async function NotFound() {
  const { locale } = await getMessages();
  return <ErrorView labels={errorMessages[locale]} />;
}
