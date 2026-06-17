import Image from 'next/image';
import type { StorefrontAbout } from '@/lib/types';

export function StoreHero({ about }: { about?: StorefrontAbout | null }) {
  return (
    <section style={{ background: 'var(--surface)', borderBottom: '1px solid var(--border)' }}>
      <div className="container" style={{ minHeight: 330, display: 'grid', alignItems: 'end', padding: '36px 0', position: 'relative', overflow: 'hidden' }}>
        {about?.backdrop_url && (
          <Image
            src={about.backdrop_url}
            alt=""
            fill
            priority
            style={{ objectFit: 'cover', zIndex: 0, opacity: 0.28 }}
          />
        )}
        <div style={{ position: 'relative', zIndex: 1, maxWidth: 720 }}>
          {about?.logo_url && <Image src={about.logo_url} alt="" width={68} height={68} style={{ borderRadius: 12, objectFit: 'cover', marginBottom: 16 }} />}
          <h1 style={{ fontSize: 'clamp(2rem, 5vw, 4.2rem)', lineHeight: 1, margin: 0 }}>{about?.name ?? 'Launch your storefront'}</h1>
          <p style={{ color: 'var(--muted)', fontSize: '1.08rem', lineHeight: 1.6, maxWidth: 640 }}>
            {about?.description ?? 'A ready-to-customize web storefront powered by Fleetbase Storefront API.'}
          </p>
        </div>
      </div>
    </section>
  );
}
