import type { StorefrontAbout } from '@/lib/types';
import { Slot } from '@/components/plugin-slot';

export function Footer({ about }: { about?: StorefrontAbout | null }) {
  return (
    <footer className="page-band" style={{ borderTop: '1px solid var(--border)', padding: '28px 0', background: 'var(--surface)' }}>
      <div className="container" style={{ display: 'flex', justifyContent: 'space-between', gap: 24, flexWrap: 'wrap' }}>
        <div>
          <strong>{about?.name ?? 'Storefront Web'}</strong>
          <p className="muted" style={{ maxWidth: 520 }}>{about?.description ?? 'Customer-facing commerce powered by Fleetbase Storefront.'}</p>
        </div>
        <Slot name="Footer.columns" />
      </div>
    </footer>
  );
}
