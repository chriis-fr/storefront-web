import type { MetadataRoute } from 'next';
import config from '@/storefront.config';
import { getStorefrontAbout } from '@/lib/provider';

// Web app manifest — makes the storefront installable. Branded from the store
// (name + theme colour) where available, with safe fallbacks.
export default async function manifest(): Promise<MetadataRoute.Manifest> {
  const about = await getStorefrontAbout().catch(() => null);
  const name = about?.name ?? config.name ?? 'Storefront';
  const brand = (typeof about?.options?.brandColor === 'string' ? about.options.brandColor : null) ?? '#16a34a';

  return {
    name,
    short_name: name.length > 12 ? name.slice(0, 12) : name,
    description: about?.description ?? 'Order online from your favourite local store.',
    start_url: '/',
    scope: '/',
    display: 'standalone',
    orientation: 'portrait',
    background_color: '#ffffff',
    theme_color: brand,
    icons: [
      // SVG scales crisply to any size (satisfies Chrome installability).
      { src: '/chains.svg', sizes: 'any', type: 'image/svg+xml', purpose: 'any' },
      { src: '/chainsnobg.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
    ],
  };
}
