import Image from 'next/image';
import type { StorefrontProduct } from '@/lib/types';
import { productPrice, formatMoney } from '@/lib/format';
import { categoryVisual } from '@/lib/category-icons';
import { AddToCartForm } from '@/features/cart/add-to-cart-form';
import { BackButton } from '@/components/back-button';
import { Slot } from '@/components/plugin-slot';

export function ProductDetail({ product }: { product: StorefrontProduct }) {
  const images = product.images?.length ? product.images : product.primary_image_url ? [product.primary_image_url] : [];
  const meta = product.meta as { categoryName?: string | null; stock?: number | null } | undefined;
  const categoryName = meta?.categoryName ?? null;
  const fallback = categoryVisual(categoryName ?? product.name);
  const onSale = !!product.is_on_sale && product.sale_price != null;
  const available = product.is_available !== false;
  const stock = meta?.stock;

  return (
    <>
      <div className="container" style={{ paddingTop: 20 }}>
        <BackButton label="Back" />
      </div>

      <section className="container two-column" style={{ padding: '16px 0 56px' }}>
        {/* Gallery */}
        <div className="stack">
          <div
            style={{
              aspectRatio: '4 / 3', borderRadius: 'var(--radius)', border: '1px solid var(--border)',
              background: images[0] ? 'var(--surface)' : fallback.bg, position: 'relative', overflow: 'hidden',
              boxShadow: 'var(--shadow)',
            }}
          >
            {images[0]
              ? <Image src={images[0]} alt={product.name} fill priority sizes="(max-width: 860px) 100vw, 55vw" style={{ objectFit: 'cover' }} />
              : <span aria-hidden style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 96, opacity: 0.85 }}>{fallback.emoji}</span>}
            {onSale && (
              <span style={{ position: 'absolute', top: 12, left: 12, background: 'var(--primary)', color: 'var(--primary-contrast)', fontSize: 12, fontWeight: 700, padding: '4px 10px', borderRadius: 999 }}>
                On sale
              </span>
            )}
          </div>
          {images.length > 1 && (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 10 }}>
              {images.slice(1, 6).map((image) => (
                <div key={image} style={{ aspectRatio: '1', position: 'relative', borderRadius: 8, overflow: 'hidden', background: 'var(--surface)', border: '1px solid var(--border)' }}>
                  <Image src={image} alt="" fill sizes="120px" style={{ objectFit: 'cover' }} />
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Details */}
        <aside className="stack" style={{ gap: 20 }}>
          <div className="stack" style={{ gap: 10 }}>
            {categoryName && (
              <span style={{ alignSelf: 'flex-start', fontSize: 12, fontWeight: 600, color: 'var(--muted)', background: 'var(--surface-strong)', padding: '4px 10px', borderRadius: 999 }}>
                {categoryName}
              </span>
            )}
            <h1 style={{ margin: 0, fontSize: 'clamp(1.6rem, 4vw, 2.4rem)', lineHeight: 1.1 }}>{product.name}</h1>

            {/* Price */}
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 10, flexWrap: 'wrap' }}>
              <strong style={{ color: 'var(--primary)', fontSize: '1.6rem' }}>{productPrice(product)}</strong>
              {onSale && (
                <span className="muted" style={{ textDecoration: 'line-through', fontSize: '1.05rem' }}>
                  {formatMoney(product.price ?? 0, product.currency)}
                </span>
              )}
            </div>

            {/* Availability */}
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8, fontSize: 14 }}>
              <span style={{ width: 9, height: 9, borderRadius: '50%', background: available ? 'var(--success)' : 'var(--error)' }} />
              {available
                ? (typeof stock === 'number' && stock > 0 ? `In stock · ${stock} available` : 'In stock')
                : 'Out of stock'}
            </span>

            {product.description && <p style={{ lineHeight: 1.6, margin: '4px 0 0' }}>{product.description}</p>}
          </div>

          <AddToCartForm product={product} />
          <Slot name="ProductDetail.afterOptions" props={{ product }} />
        </aside>
      </section>
    </>
  );
}
