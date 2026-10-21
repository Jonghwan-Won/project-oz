import type { Metadata } from 'next';
import Link from 'next/link';
import { getMessages } from '@/i18n/server';
import { getTheme } from '@/theme/server';
import { BrandLogo } from '@/components/BrandLogo';
import { Header } from '@/components/Header';
import { NavigationScroll } from '@/components/NavigationScroll';
import { ScrollToTop } from '@/components/ScrollToTop';
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
    <html lang={locale} data-theme={theme}>
      <body>
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
          <div>
            <Link href="/help">{messages.navigation.help}</Link>
            <Link href="/about">{messages.navigation.about}</Link>
            <Link href="/admin">{messages.site.admin}</Link>
          </div>
          <small>© 2026 ddoza. Made with curiosity.</small>
        </footer>
        <ScrollToTop label={messages.site.backToTop} />
      </body>
    </html>
  );
}
