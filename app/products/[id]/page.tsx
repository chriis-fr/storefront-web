import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { ProductDetail } from '@/components/catalog/product-detail';
import { getProduct } from '@/lib/fleetbase/storefront';

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params;
  const product = await getProduct(id).catch(() => null);

  if (!product) {
    return { title: 'Product not found' };
  }

  return {
    title: product.name,
    description: product.description,
    openGraph: {
      title: product.name,
      description: product.description,
      images: product.primary_image_url ? [product.primary_image_url] : undefined
    }
  };
}

export default async function ProductPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const product = await getProduct(id).catch(() => null);

  if (!product) {
    notFound();
  }

  return <ProductDetail product={product} />;
}
