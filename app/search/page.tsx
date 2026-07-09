import { ProductGrid } from '@/components/catalog/product-grid';
import { searchProducts } from '@/lib/provider';

export default async function SearchPage({ searchParams }: { searchParams: Promise<{ q?: string; tag?: string }> }) {
  const params = await searchParams;
  const query = params.q ?? params.tag ?? '';
  const products = query ? await searchProducts(query).catch(() => []) : [];

  return (
    <section className="container" style={{ padding: '32px 0 56px' }}>
      <div className="section-title">
        <div>
          <h1>Search</h1>
          <p className="muted">{query ? `Results for "${query}"` : 'Enter a search term to find products.'}</p>
        </div>
        <form action="/search" style={{ minWidth: 280 }}>
          <input className="field" name="q" defaultValue={query} placeholder="Search products" />
        </form>
      </div>
      <ProductGrid products={products} emptyMessage={query ? 'No products matched this search.' : 'Search for products by name, tag, or category.'} />
    </section>
  );
}
