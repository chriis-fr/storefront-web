import Image from 'next/image';
import type { NetworkStore } from '@/lib/types';

export function StoreDirectory({ stores }: { stores: NetworkStore[] }) {
  return (
    <div className="grid" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(230px, 1fr))' }}>
      {stores.map((store) => (
        <article key={store.id} style={{ border: '1px solid var(--border)', borderRadius: 'var(--radius)', padding: 14, background: 'var(--surface)', display: 'flex', gap: 12 }}>
          {store.logo_url ? <Image src={store.logo_url} alt="" width={48} height={48} style={{ borderRadius: 8, objectFit: 'cover' }} /> : null}
          <div>
            <strong>{store.name}</strong>
            <p className="muted" style={{ margin: '4px 0 0' }}>{store.description}</p>
          </div>
        </article>
      ))}
    </div>
  );
}
