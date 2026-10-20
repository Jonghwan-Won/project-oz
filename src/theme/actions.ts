'use server';

import { cookies } from 'next/headers';
import { isTheme, themeCookie } from './theme';

export async function changeTheme(value: unknown) {
  if (!isTheme(value)) throw new Error('Unsupported theme');
  (await cookies()).set(themeCookie, value, {
    path: '/',
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    maxAge: 60 * 60 * 24 * 365,
  });
}
