import Image from 'next/image';
import Link from 'next/link';
import type { StorefrontAbout } from '@/lib/types';
import { Slot } from '@/components/plugin-slot';

export function Footer({ about }: { about?: StorefrontAbout | null }) {
  const year = 2026; // Date.now() is unavailable in some runtimes; keep static.
  return (
    <footer
      className="page-band"
      style={{ borderTop: '1px solid var(--border)', background: 'var(--surface)', marginTop: 48, flexShrink: 0 }}
    >
      <div
        className="container"
        style={{ display: 'flex', justifyContent: 'space-between', gap: 32, flexWrap: 'wrap', padding: '40px 0' }}
      >
        {/* Store identity */}
        <div style={{ maxWidth: 520 }} className="stack">
          <strong style={{ fontSize: '1.05rem' }}>{about?.name ?? 'Storefront Web'}</strong>
          <p className="muted" style={{ margin: 0 }}>
            {about?.description ?? 'Customer-facing commerce powered by Chains-ERP.'}
          </p>
          <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', marginTop: 4 }}>
            <Link className="muted" href="/search" style={{ fontSize: 14 }}>Browse</Link>
            <Link className="muted" href="/orders" style={{ fontSize: 14 }}>Orders</Link>
            <Link className="muted" href="/account" style={{ fontSize: 14 }}>Account</Link>
          </div>
        </div>

        <Slot name="Footer.columns" />

        {/* Powered by Chains-ERP */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8, alignItems: 'flex-start' }}>
          <span className="muted" style={{ fontSize: 12, textTransform: 'uppercase', letterSpacing: 0.5 }}>Powered by</span>
          <a
            href="https://chains-erp.com"
            target="_blank"
            rel="noopener noreferrer"
            style={{ display: 'inline-flex', alignItems: 'center', gap: 10 }}
          >
            <Image src="/chainsnobg.png" alt="Chains-ERP" width={32} height={32} style={{ objectFit: 'contain' }} />
            <strong style={{ fontSize: '1.05rem' }}>Chains-ERP</strong>
          </a>
          <a
            href="https://chains-erp.com"
            target="_blank"
            rel="noopener noreferrer"
            className="muted"
            style={{ fontSize: 13 }}
          >
            chains-erp.com
          </a>
        </div>
      </div>

      {/* Base line */}
      <div style={{ borderTop: '1px solid var(--border)' }}>
        <div className="container" style={{ padding: '16px 0', display: 'flex', justifyContent: 'space-between', gap: 16, flexWrap: 'wrap' }}>
          <span className="muted" style={{ fontSize: 13 }}>© {year} {about?.name ?? 'Storefront'}. All rights reserved.</span>
          <span className="muted" style={{ fontSize: 13 }}>Customer-facing commerce powered by Chains-ERP.</span>
        </div>
      </div>
    </footer>
  );
}
