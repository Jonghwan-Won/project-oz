export type Locale = 'ko' | 'en';
export const localeCookie = 'ddoza-locale';

export function isLocale(value: unknown): value is Locale {
  return value === 'ko' || value === 'en';
}

export function resolveLocale(value: unknown): Locale {
  return isLocale(value) ? value : 'ko';
}
