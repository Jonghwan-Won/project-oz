'use client';

import { MantineProvider, createTheme } from '@mantine/core';
import type { ReactNode } from 'react';

const theme = createTheme({
  primaryColor: 'violet',
  primaryShade: { light: 6, dark: 3 },
  colors: {
    violet: [
      '#f5f2ff',
      '#e8e1ff',
      '#d4c7ff',
      '#baacff',
      '#a08df5',
      '#8068d8',
      // 6·7은 메인 화면의 주 색(--p2-primary, --p2-primary-ink)과 같다.
      '#6a4fd6',
      '#5940ad',
      '#403078',
      '#30245b',
    ],
  },
  // globals.css의 --font-sans와 같은 규칙을 Mantine 컴포넌트에도 쓴다.
  fontFamily: 'var(--font-sans)',
  headings: { fontFamily: 'var(--font-sans)' },
  defaultRadius: 'md',
});

export function MantineRoot({
  colorScheme,
  children,
}: {
  colorScheme: 'dark' | 'light';
  children: ReactNode;
}) {
  return (
    <MantineProvider theme={theme} forceColorScheme={colorScheme}>
      {children}
    </MantineProvider>
  );
}
