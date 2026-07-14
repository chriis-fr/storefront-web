import type { StorefrontAbout } from '@/lib/types';
import { resolveHeroImage, resolveStoreLogo } from '@/lib/hero';

export function StoreHero({ about }: { about?: StorefrontAbout | null }) {
  // A store-set backdrop wins; else an image dropped in /public; else null.
  const heroImage = about?.backdrop_url ?? resolveHeroImage();
  const logo = resolveStoreLogo(about);

  // Text sits on either a photo or the branded gradient. Either way we keep a
  // dark scrim + fixed light text so contrast is guaranteed regardless of the
  // image's colours — the readability never depends on the picture.
  const scrim = 'linear-gradient(90deg, rgba(0,0,0,0.72) 0%, rgba(0,0,0,0.45) 45%, rgba(0,0,0,0.15) 100%)';
  const brandGradient =
    'linear-gradient(135deg, color-mix(in srgb, var(--primary) 88%, #000) 0%, color-mix(in srgb, var(--primary) 42%, #000) 100%)';

  return (
    <section
      style={{
        position: 'relative',
        overflow: 'hidden',
        borderBottom: '1px solid var(--border)',
        background: heroImage ? '#0b0b0c' : brandGradient,
      }}
    >
      {heroImage && (
        <>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={heroImage}
            alt=""
            style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', zIndex: 0 }}
          />
          <div style={{ position: 'absolute', inset: 0, zIndex: 1, background: scrim }} />
        </>
      )}

      <div
        className="container hero-inner"
        style={{
          position: 'relative',
          zIndex: 2,
          display: 'grid',
          alignItems: 'end',
          color: '#ffffff',
        }}
      >
        <div style={{ maxWidth: 720, textShadow: '0 1px 12px rgba(0,0,0,0.35)' }}>
          {logo && (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={logo}
              alt=""
              width={68}
              height={68}
              style={{ borderRadius: 16, objectFit: 'cover', marginBottom: 16, boxShadow: '0 4px 16px rgba(0,0,0,0.3)' }}
            />
          )}
          <h1 style={{ fontSize: 'clamp(2rem, 5vw, 4.2rem)', lineHeight: 1.02, margin: 0, color: '#ffffff' }}>
            {about?.name ?? 'Launch your storefront'}
          </h1>
          <p style={{ color: 'rgba(255,255,255,0.9)', fontSize: '1.08rem', lineHeight: 1.6, maxWidth: 640, marginTop: 12 }}>
            {about?.description ?? 'Browse our menu and order online — pickup or delivery available.'}
          </p>
        </div>
      </div>
    </section>
  );
}
