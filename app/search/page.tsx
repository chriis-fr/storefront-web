import Link from 'next/link';
import { ProductGrid } from '@/components/catalog/product-grid';
import { browseProducts, getCategoryTree } from '@/lib/provider';

const PAGE_SIZE = 24;

type SearchParams = { q?: string; tag?: string; category?: string; subcategory?: string; page?: string };

export default async function SearchPage({ searchParams }: { searchParams: Promise<SearchParams> }) {
  const params = await searchParams;
  const q = (params.q ?? '').trim();
  const page = Math.max(1, Number(params.page) || 1);

  const tree = await getCategoryTree().catch(() => []);
  const mains = tree.filter((c) => c.type === 'main');

  // Category can arrive as an id (?category=) or a legacy name (?tag=). Resolve
  // a name to its id so the old category pills keep working.
  let category = params.category;
  if (!category && params.tag) {
    category = mains.find((c) => c.name.toLowerCase() === params.tag!.toLowerCase())?.id;
  }
  const subcategory = params.subcategory;
  const subs = category ? tree.filter((c) => c.type === 'sub' && c.parentId === category) : [];

  const { products, total } = await browseProducts({ category, subcategory, q, page, limit: PAGE_SIZE })
    .catch(() => ({ products: [], total: 0, page: 1, pageSize: PAGE_SIZE }));

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  // Build a URL that keeps the current filters but overrides some of them.
  const href = (over: Partial<SearchParams>) => {
    const sp = new URLSearchParams();
    const merged = { q, category, subcategory, page: String(page), ...over };
    if (merged.q) sp.set('q', merged.q);
    if (merged.category) sp.set('category', merged.category);
    if (merged.subcategory) sp.set('subcategory', merged.subcategory);
    if (merged.page && merged.page !== '1') sp.set('page', String(merged.page));
    const s = sp.toString();
    return s ? `/search?${s}` : '/search';
  };

  const activeCatName = category ? mains.find((c) => c.id === category)?.name : null;
  const heading = q ? `Results for “${q}”` : activeCatName ?? 'Browse all';

  return (
    <section className="container" style={{ padding: '32px 0 56px' }}>
      <div className="section-title">
        <div>
          <h1>Browse</h1>
          <p className="muted">{total > 0 ? `${total} item${total === 1 ? '' : 's'} · ${heading}` : heading}</p>
        </div>
        {/* Search keeps the active category so text search narrows within it. */}
        <form action="/search" style={{ minWidth: 280 }}>
          {category && <input type="hidden" name="category" value={category} />}
          {subcategory && <input type="hidden" name="subcategory" value={subcategory} />}
          <input className="field" name="q" defaultValue={q} placeholder="Search products" />
        </form>
      </div>

      {/* Main category filter */}
      {mains.length > 0 && (
        <div style={{ display: 'flex', gap: 8, overflowX: 'auto', padding: '4px 0 12px' }}>
          <Link className={`button ${category ? 'secondary' : ''}`} href={href({ category: undefined, subcategory: undefined, page: '1' })}>
            All
          </Link>
          {mains.map((c) => (
            <Link
              key={c.id}
              className={`button ${category === c.id ? '' : 'secondary'}`}
              href={href({ category: c.id, subcategory: undefined, page: '1' })}
              style={{ whiteSpace: 'nowrap' }}
            >
              {c.name}
            </Link>
          ))}
        </div>
      )}

      {/* Subcategory filter (only when a category with subs is active) */}
      {subs.length > 0 && (
        <div style={{ display: 'flex', gap: 8, overflowX: 'auto', padding: '0 0 16px' }}>
          <Link className={`button ${subcategory ? 'ghost' : 'secondary'}`} href={href({ subcategory: undefined, page: '1' })}>
            All {activeCatName}
          </Link>
          {subs.map((s) => (
            <Link
              key={s.id}
              className={`button ${subcategory === s.id ? 'secondary' : 'ghost'}`}
              href={href({ subcategory: s.id, page: '1' })}
              style={{ whiteSpace: 'nowrap' }}
            >
              {s.name}
            </Link>
          ))}
        </div>
      )}

      <ProductGrid
        products={products}
        emptyMessage={q ? 'No products matched this search.' : 'No products here yet.'}
      />

      {/* Numbered pagination */}
      {totalPages > 1 && (
        <nav style={{ display: 'flex', gap: 6, justifyContent: 'center', alignItems: 'center', padding: '28px 0 0', flexWrap: 'wrap' }}>
          {page > 1 && <Link className="button secondary" href={href({ page: String(page - 1) })}>Prev</Link>}
          {Array.from({ length: totalPages }, (_, i) => i + 1)
            .filter((p) => p === 1 || p === totalPages || Math.abs(p - page) <= 2)
            .map((p, idx, arr) => (
              <span key={p} style={{ display: 'inline-flex', gap: 6, alignItems: 'center' }}>
                {idx > 0 && p - arr[idx - 1] > 1 && <span className="muted">…</span>}
                <Link
                  className={`button ${p === page ? '' : 'secondary'}`}
                  href={href({ page: String(p) })}
                  aria-current={p === page ? 'page' : undefined}
                >
                  {p}
                </Link>
              </span>
            ))}
          {page < totalPages && <Link className="button secondary" href={href({ page: String(page + 1) })}>Next</Link>}
        </nav>
      )}
    </section>
  );
}
