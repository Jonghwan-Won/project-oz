import { cache } from 'react';
import { cookies } from 'next/headers';
import { ko } from './ko';
import { en } from './en';
import { localeCookie, resolveLocale } from './locale';

export const getMessages = cache(async () => {
  const locale = resolveLocale((await cookies()).get(localeCookie)?.value);
  return { locale, messages: locale === 'en' ? en : ko };
});
