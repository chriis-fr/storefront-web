import type { MetadataRoute } from 'next';
import { getProducts } from '@/lib/provider';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000';
  const products = await getProducts({ limit: 100 }).catch(() => []);

  return [
    { url: siteUrl, lastModified: new Date() },
    { url: `${siteUrl}/search`, lastModified: new Date() },
    ...products.map((product) => ({
      url: `${siteUrl}/products/${product.id}`,
      lastModified: product.updated_at ? new Date(product.updated_at) : new Date()
    }))
  ];
}
