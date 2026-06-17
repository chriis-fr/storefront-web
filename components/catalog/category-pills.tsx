import Link from 'next/link';
import type { StorefrontCategory } from '@/lib/types';

export function CategoryPills({ categories }: { categories: StorefrontCategory[] }) {
  if (!categories.length) {
    return null;
  }

  return (
    <div style={{ display: 'flex', gap: 8, overflowX: 'auto', padding: '6px 0 16px' }}>
      {categories.map((category) => (
        <Link key={category.id} className="button secondary" href={`/search?tag=${encodeURIComponent(category.name)}`}>
          {category.name}
        </Link>
      ))}
    </div>
  );
}
