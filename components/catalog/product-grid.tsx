import type { StorefrontProduct } from '@/lib/types';
import { ProductCard } from './product-card';

export function ProductGrid({ products, emptyMessage = 'No products are available yet.' }: { products: StorefrontProduct[]; emptyMessage?: string }) {
  if (!products.length) {
    return <p className="muted">{emptyMessage}</p>;
  }

  return (
    <div className="grid product-grid">
      {products.map((product) => (
        <ProductCard key={product.id} product={product} />
      ))}
    </div>
  );
}
