import 'server-only';
import { cache } from 'react';
import { getMessages } from './server';
import { guideEn } from './guide-en';
import { guideKo } from './guide-ko';
import type { Locale } from './locale';

export function guideMessagesFor(locale: Locale) {
  return locale === 'en' ? guideEn : guideKo;
}

/** 실험실·UI 가이드 화면 문구. locale은 공통 getMessages()의 쿠키 판정을 따른다. */
export const getGuideMessages = cache(async () => {
  const { locale } = await getMessages();
  return { locale, messages: guideMessagesFor(locale) };
});
