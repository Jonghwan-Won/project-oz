'use client';

import { useSyncExternalStore } from 'react';
import { localeCookie, resolveLocale } from './locale';

const subscribe = () => () => {};
const serverSnapshot = () => 'ko' as const;
const getSnapshot = () =>
  resolveLocale(
    document.cookie
      .split('; ')
      .find((item) => item.startsWith(`${localeCookie}=`))
      ?.split('=')[1],
  );

export function useErrorLocale() {
  return useSyncExternalStore(subscribe, getSnapshot, serverSnapshot);
}
