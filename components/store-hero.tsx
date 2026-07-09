import type { StorefrontAbout } from '@/lib/types';

export function StoreHero({ about }: { about?: StorefrontAbout | null }) {
  return (
    <section style={{ background: 'var(--surface)', borderBottom: '1px solid var(--border)' }}>
      <div className="container" style={{ minHeight: 330, display: 'grid', alignItems: 'end', padding: '36px 0', position: 'relative', overflow: 'hidden' }}>
        {about?.backdrop_url && (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={about.backdrop_url}
            alt=""
            style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', zIndex: 0, opacity: 0.28 }}
          />
        )}
        <div style={{ position: 'relative', zIndex: 1, maxWidth: 720 }}>
          {about?.logo_url && (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={about.logo_url} alt="" width={68} height={68} style={{ borderRadius: 12, objectFit: 'cover', marginBottom: 16 }} />
          )}
          <h1 style={{ fontSize: 'clamp(2rem, 5vw, 4.2rem)', lineHeight: 1, margin: 0 }}>{about?.name ?? 'Launch your storefront'}</h1>
          <p style={{ color: 'var(--muted)', fontSize: '1.08rem', lineHeight: 1.6, maxWidth: 640 }}>
            {about?.description ?? 'Browse our menu and order online — pickup or delivery available.'}
          </p>
        </div>
      </div>
    </section>
  );
}
