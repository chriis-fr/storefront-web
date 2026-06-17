import Image from 'next/image';
import type { StorefrontProduct } from '@/lib/types';
import { productPrice } from '@/lib/format';
import { AddToCartForm } from '@/features/cart/add-to-cart-form';
import { Slot } from '@/components/plugin-slot';

export function ProductDetail({ product }: { product: StorefrontProduct }) {
  const images = product.images?.length ? product.images : product.primary_image_url ? [product.primary_image_url] : [];

  return (
    <section className="container two-column" style={{ padding: '36px 0 56px' }}>
      <div className="stack">
        <div style={{ aspectRatio: '4 / 3', borderRadius: 'var(--radius)', background: 'var(--surface)', position: 'relative', overflow: 'hidden' }}>
          {images[0] && <Image src={images[0]} alt={product.name} fill priority style={{ objectFit: 'cover' }} />}
        </div>
        {images.length > 1 && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 10 }}>
            {images.slice(1, 6).map((image) => (
              <div key={image} style={{ aspectRatio: '1', position: 'relative', borderRadius: 6, overflow: 'hidden', background: 'var(--surface)' }}>
                <Image src={image} alt="" fill style={{ objectFit: 'cover' }} />
              </div>
            ))}
          </div>
        )}
      </div>
      <aside className="stack">
        <div>
          <p className="muted" style={{ margin: 0 }}>{product.is_service ? 'Service' : 'Product'}</p>
          <h1 style={{ margin: '4px 0', fontSize: '2.2rem', lineHeight: 1.08 }}>{product.name}</h1>
          <strong style={{ color: 'var(--primary)', fontSize: '1.4rem' }}>{productPrice(product)}</strong>
          {product.description && <p style={{ lineHeight: 1.6 }}>{product.description}</p>}
        </div>
        <AddToCartForm product={product} />
        <Slot name="ProductDetail.afterOptions" props={{ product }} />
      </aside>
    </section>
  );
}
