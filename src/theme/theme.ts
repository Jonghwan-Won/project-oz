export type Theme = 'dark' | 'light';
export const themeCookie = 'ddoza-theme';

export function isTheme(value: unknown): value is Theme {
  return value === 'dark' || value === 'light';
}

export function resolveTheme(value: unknown): Theme {
  return isTheme(value) ? value : 'dark';
}
