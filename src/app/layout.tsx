import type { Metadata } from 'next';

import { getMessages } from '@/i18n/server';
import { getTheme } from '@/theme/server';
import { SiteFrame } from '@/components/SiteFrame';
import { NavigationScroll } from '@/components/NavigationScroll';
import { ScrollToTop } from '@/components/ScrollToTop';
import { MantineRoot } from '@/components/MantineRoot';
import '@mantine/core/styles.css';
import './globals.css';
export async function generateMetadata(): Promise<Metadata> {
  const { messages } = await getMessages();
  return {
    title: { default: messages.site.title, template: '%s | ddozaa' },
    description: messages.site.description,
  };
}
export default async function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const { locale, messages } = await getMessages();
  const theme = await getTheme();
  return (
    <html lang={locale} data-theme={theme} data-mantine-color-scheme={theme}>
      <body>
        <MantineRoot colorScheme={theme}>
          <a className="skip" href="#main">
            {messages.site.skip}
          </a>
          <NavigationScroll />
          <SiteFrame>
            <main id="main">{children}</main>
          </SiteFrame>
          <ScrollToTop label={messages.site.backToTop} />
        </MantineRoot>
      </body>
    </html>
  );
}
