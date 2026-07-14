// Server-only branding resolvers (hero image + store logo). Both fall back to a
// file dropped into /public, so a store can be branded without any backend.
//
// Do NOT import this from a client component — it touches the filesystem.
// Resolve server-side and pass the string down as a prop.
import fs from 'node:fs';
import path from 'node:path';

const HERO_CANDIDATES = ['hero.jpg', 'hero.jpeg', 'hero.png', 'hero.webp', 'hero.avif'];
const LOGO_CANDIDATES = ['logo.svg', 'logo.png', 'logo.jpg', 'logo.jpeg', 'logo.webp'];

function findInPublic(candidates: string[]): string | null {
  try {
    const pub = path.join(process.cwd(), 'public');
    for (const name of candidates) {
      if (fs.existsSync(path.join(pub, name))) return `/${name}`;
    }
  } catch {
    /* fs not available (edge/build) — fall through */
  }
  return null;
}

/**
 * Home hero/banner image, in priority order:
 *   1. NEXT_PUBLIC_HERO_IMAGE env (a path like /hero.jpg or a full URL)
 *   2. a file in /public named hero.(jpg|jpeg|png|webp|avif)
 *   3. null → the caller renders a branded gradient instead
 * Recommended banner size: a wide landscape image ~1600×500 (3:1).
 */
export function resolveHeroImage(): string | null {
  const fromEnv = process.env.NEXT_PUBLIC_HERO_IMAGE?.trim();
  if (fromEnv) return fromEnv;
  return findInPublic(HERO_CANDIDATES);
}

/**
 * Store logo, in priority order:
 *   1. the store's backend logo (about.logo_url)
 *   2. NEXT_PUBLIC_LOGO_IMAGE env (a path like /logo.png or a full URL)
 *   3. a file in /public named logo.(svg|png|jpg|jpeg|webp)
 *   4. null → the caller shows the default icon (ShoppingBag)
 * Recommended: a square logo ~256×256 (transparent PNG/SVG).
 */
export function resolveStoreLogo(about?: { logo_url?: string | null } | null): string | null {
  if (about?.logo_url) return about.logo_url;
  const fromEnv = process.env.NEXT_PUBLIC_LOGO_IMAGE?.trim();
  if (fromEnv) return fromEnv;
  return findInPublic(LOGO_CANDIDATES);
}
