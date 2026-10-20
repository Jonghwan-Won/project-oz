'use server';

import { cookies } from 'next/headers';
import { isLocale, localeCookie } from './locale';

export async function changeLocale(value: unknown) {
  if (!isLocale(value)) throw new Error('Unsupported language');
  (await cookies()).set(localeCookie, value, {
    path: '/',
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    maxAge: 60 * 60 * 24 * 365,
  });
}
