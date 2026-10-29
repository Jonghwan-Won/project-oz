import type { Metadata } from 'next';
import Link from 'next/link';
import { getMessages } from '@/i18n/server';
import { getTheme } from '@/theme/server';
import { BrandLogo } from '@/components/BrandLogo';
import { Header } from '@/components/Header';
import { NavigationScroll } from '@/components/NavigationScroll';
import { ScrollToTop } from '@/components/ScrollToTop';
import { MantineRoot } from '@/components/MantineRoot';
import '@mantine/core/styles.css';
import './globals.css';
export async function generateMetadata(): Promise<Metadata> {
  const { messages } = await getMessages();
  return {
    title: { default: messages.site.title, template: '%s | ddoza' },
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
          <Header
            labels={messages.navigation}
            locale={locale}
            languageLabels={messages.language}
            theme={theme}
            themeLabels={messages.theme}
          />
          <NavigationScroll />
          <main id="main">{children}</main>
          <footer>
            <Link
              className="wordmark"
              href="/"
              aria-label={messages.navigation.home}
            >
              <BrandLogo />
            </Link>
            <p>{messages.site.footer}</p>
            <small>© 2026 ddoza. Made with curiosity.</small>
          </footer>
          <ScrollToTop label={messages.site.backToTop} />
        </MantineRoot>
      </body>
    </html>
  );
}
