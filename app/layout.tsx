import type { Metadata, Viewport } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import config from '@/storefront.config';
import { Header } from '@/components/layout/header';
import { Footer } from '@/components/layout/footer';
import { ThemeScript } from '@/components/theme-script';
import { PwaRegister } from '@/components/pwa-register';
import { getStorefrontAbout, getNetworkStores } from '@/lib/provider';
import { resolveStoreLogo } from '@/lib/hero';
import { PluginProvider } from '@/plugins/provider';

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  // Matches the theme background so the status bar / PWA chrome blends in (both modes).
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#ffffff' },
    { media: '(prefers-color-scheme: dark)', color: '#0c0a09' },
  ],
};

// Match the POS app's typeface.
const inter = Inter({ subsets: ['latin'], display: 'swap', variable: '--font-inter' });

export async function generateMetadata(): Promise<Metadata> {
  const about = await getStorefrontAbout().catch(() => null);
  const title = about?.name ?? config.name;
  const description = about?.description ?? 'Order online from your favourite local store.';

  return {
    title: {
      default: title,
      template: `%s | ${title}`
    },
    description,
    metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000'),
    applicationName: title,
    manifest: '/manifest.webmanifest',
    appleWebApp: { capable: true, statusBarStyle: 'default', title },
    icons: {
      icon: [{ url: '/chains.svg', type: 'image/svg+xml' }],
      apple: [{ url: '/chainsnobg.png' }],
    },
    openGraph: {
      title,
      description,
      images: about?.backdrop_url ? [about.backdrop_url] : undefined
    }
  };
}

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const [about, stores] = await Promise.all([
    getStorefrontAbout().catch(() => null),
    getNetworkStores().catch(() => []),
  ]);
  // A store brand colour overrides the primary in both light and dark; base
  // tokens live in globals.css so dark mode can take effect.
  const brandColor = typeof about?.options?.brandColor === 'string' ? about.options.brandColor : null;
  const bodyStyle = (brandColor ? { ['--primary']: brandColor } : undefined) as React.CSSProperties | undefined;

  return (
    <html lang={config.defaultLocale} className={inter.variable} suppressHydrationWarning>
      <body style={bodyStyle}>
        <ThemeScript />
        <PwaRegister />
        <PluginProvider>
          <Header about={about} stores={stores} logo={resolveStoreLogo(about)} />
          <main>{children}</main>
          <Footer about={about} />
        </PluginProvider>
      </body>
    </html>
  );
}
