import Link from 'next/link';
import { ArrowRight, Search } from 'lucide-react';
import { ProductGrid } from '@/components/catalog/product-grid';
import { StoreHero } from '@/components/store-hero';
import { CategoryPills } from '@/components/catalog/category-pills';
import { StoreDirectory } from '@/components/catalog/store-directory';
import { getCategories, getNetworkStores, getProducts, getStorefrontAbout } from '@/lib/provider';

export default async function HomePage() {
  const [about, categories, products, networkStores] = await Promise.all([
    getStorefrontAbout().catch(() => null),
    getCategories().catch(() => []),
    getProducts({ limit: 16 }).catch(() => []),
    getNetworkStores().catch(() => [])
  ]);
  

  return (
    <>
      <StoreHero about={about} />
      <section className="container" style={{ padding: '28px 0 12px' }}>
        <form action="/search" className="section-title" style={{ alignItems: 'center' }}>
          <div>
            <h1>{about?.is_network ? 'Explore the marketplace' : 'Shop products'}</h1>
            <p className="muted">Browse products, services, and local delivery options.</p>
          </div>
          <label style={{ display: 'flex', alignItems: 'center', gap: 8, width: '100%', maxWidth: 360, minWidth: 0 }}>
            <Search size={18} style={{ flexShrink: 0 }} />
            <input className="field" name="q" placeholder="Search products" style={{ flex: 1, minWidth: 0 }} />
          </label>
        </form>
        <CategoryPills categories={categories} />
      </section>
      {networkStores.length > 0 && (
        <section className="container" style={{ padding: '16px 0 28px' }}>
          <div className="section-title">
            <h2>Stores</h2>
            <Link className="button secondary" href="/stores">
              View stores <ArrowRight size={16} />
            </Link>
          </div>
          <StoreDirectory stores={networkStores.slice(0, 8)} />
        </section>
      )}
      <section className="container" style={{ padding: '16px 0 48px' }}>
        <div className="section-title">
          <h2>Featured products</h2>
          <Link className="button secondary" href="/search">
            Browse all <ArrowRight size={16} />
          </Link>
        </div>
        <ProductGrid products={products} />
      </section>
    </>
  );
}
