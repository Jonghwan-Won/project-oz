import type { Metadata } from 'next';

import { getMessages } from '@/i18n/server';
import { getTheme } from '@/theme/server';
import { getHeaderSettings } from '@/server/header-settings';
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
  const [theme, headerSettings] = await Promise.all([
    getTheme(),
    getHeaderSettings(),
  ]);
  return (
    <html lang={locale} data-theme={theme} data-mantine-color-scheme={theme}>
      <body>
        <MantineRoot colorScheme={theme}>
          <a className="skip" href="#main">
            {messages.site.skip}
          </a>
          <NavigationScroll />
          <SiteFrame headerSettings={headerSettings}>
            <main id="main">{children}</main>
          </SiteFrame>
          <ScrollToTop label={messages.site.backToTop} />
        </MantineRoot>
      </body>
    </html>
  );
}
