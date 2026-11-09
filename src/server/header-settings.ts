import 'server-only';
import { getMessages } from '@/i18n/server';
import { getTheme } from '@/theme/server';
import type { HeaderSettings } from '@/app/Interactive';

/** 포트폴리오 헤더의 언어·테마 캡슐에 넘길 값. 쿠키 기준이며 문구만 골라 보낸다. */
export async function getHeaderSettings(): Promise<HeaderSettings> {
  const [{ locale, messages }, theme] = await Promise.all([
    getMessages(),
    getTheme(),
  ]);
  return {
    locale,
    theme,
    labels: {
      language: messages.language,
      theme: messages.theme,
      header: messages.portfolio.header,
      footerNav: messages.portfolio.footerNav,
    },
  };
}
