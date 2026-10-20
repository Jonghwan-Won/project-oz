import { cookies } from 'next/headers';
import { resolveTheme, themeCookie } from './theme';

export async function getTheme() {
  return resolveTheme((await cookies()).get(themeCookie)?.value);
}
