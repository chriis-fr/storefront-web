import Image from 'next/image';
import Link from 'next/link';
import type { StorefrontProduct } from '@/lib/types';
import { productPrice } from '@/lib/format';
import { Slot } from '@/components/plugin-slot';

export function ProductCard({ product }: { product: StorefrontProduct }) {
  return (
    <article style={{ border: '1px solid var(--border)', borderRadius: 'var(--radius)', overflow: 'hidden', background: '#fff' }}>
      <Link href={`/products/${product.id}`} style={{ display: 'grid' }}>
        <div style={{ aspectRatio: '4 / 3', background: 'var(--surface)', position: 'relative' }}>
          {product.primary_image_url ? (
            <Image src={product.primary_image_url} alt={product.name} fill sizes="(max-width: 760px) 50vw, 25vw" style={{ objectFit: 'cover' }} />
          ) : null}
        </div>
        <div style={{ padding: 14, display: 'grid', gap: 8 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8 }}>
            <strong>{product.name}</strong>
            <strong style={{ color: 'var(--primary)' }}>{productPrice(product)}</strong>
          </div>
          <Slot name="ProductCard.badges" props={{ product }} />
          {product.description && <p className="muted" style={{ margin: 0, lineHeight: 1.4 }}>{product.description}</p>}
        </div>
      </Link>
    </article>
  );
}
