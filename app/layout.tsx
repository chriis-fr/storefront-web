import type { Metadata } from 'next';
import './globals.css';
import config from '@/storefront.config';
import { Header } from '@/components/layout/header';
import { Footer } from '@/components/layout/footer';
import { ThemeScript } from '@/components/theme-script';
import { getStorefrontAbout } from '@/lib/fleetbase/storefront';
import { getThemeCssVariables } from '@/lib/theme';
import { PluginProvider } from '@/plugins/provider';

export async function generateMetadata(): Promise<Metadata> {
  const about = await getStorefrontAbout().catch(() => null);
  const title = about?.name ?? config.name;
  const description = about?.description ?? 'A Fleetbase powered storefront.';

  return {
    title: {
      default: title,
      template: `%s | ${title}`
    },
    description,
    metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000'),
    openGraph: {
      title,
      description,
      images: about?.backdrop_url ? [about.backdrop_url] : undefined
    }
  };
}

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const about = await getStorefrontAbout().catch(() => null);
  const themeCss = getThemeCssVariables(config.defaultTheme);

  return (
    <html lang={config.defaultLocale}>
      <body style={themeCss}>
        <ThemeScript />
        <PluginProvider>
          <Header about={about} />
          <main>{children}</main>
          <Footer about={about} />
        </PluginProvider>
      </body>
    </html>
  );
}
