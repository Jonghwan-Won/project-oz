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
      '#674db8',
      '#513b99',
      '#403078',
      '#30245b',
    ],
  },
  fontFamily: "Arial, 'Malgun Gothic', sans-serif",
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
