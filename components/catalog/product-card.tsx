import Image from 'next/image';
import Link from 'next/link';
import type { StorefrontProduct } from '@/lib/types';
import { productPrice, formatMoney } from '@/lib/format';
import { categoryVisual } from '@/lib/category-icons';
import { Slot } from '@/components/plugin-slot';

export function ProductCard({ product }: { product: StorefrontProduct }) {
  const categoryName = (product.meta as { categoryName?: string | null } | undefined)?.categoryName ?? product.name;
  const fallback = categoryVisual(categoryName);
  return (
    <article style={{ border: '1px solid var(--border)', borderRadius: 'var(--radius)', overflow: 'hidden', background: 'var(--surface)', boxShadow: 'var(--shadow)' }}>
      <Link href={`/products/${product.id}`} style={{ display: 'grid' }}>
        <div style={{ aspectRatio: '4 / 3', background: fallback.bg, position: 'relative' }}>
          {product.primary_image_url ? (
            <Image src={product.primary_image_url} alt={product.name} fill sizes="(max-width: 760px) 50vw, 25vw" style={{ objectFit: 'cover' }} />
          ) : (
            <span
              aria-hidden
              style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 44, opacity: 0.85 }}
            >
              {fallback.emoji}
            </span>
          )}
        </div>
        <div style={{ padding: 14, display: 'grid', gap: 8 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8, alignItems: 'baseline' }}>
            <strong>{product.name}</strong>
            <span style={{ display: 'flex', gap: 6, alignItems: 'baseline', whiteSpace: 'nowrap' }}>
              {product.is_on_sale && (
                <span className="muted" style={{ textDecoration: 'line-through', fontSize: '0.85em' }}>
                  {formatMoney(product.price ?? 0, product.currency)}
                </span>
              )}
              <strong style={{ color: 'var(--primary)' }}>{productPrice(product)}</strong>
            </span>
          </div>
          <Slot name="ProductCard.badges" props={{ product }} />
          {product.description && <p className="muted" style={{ margin: 0, lineHeight: 1.4 }}>{product.description}</p>}
        </div>
      </Link>
    </article>
  );
}
