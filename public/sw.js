/* Storefront service worker — offline-capable, dev-safe.
 *
 * Strategy:
 *   • /api/*            → never touched (dynamic / auth data stays fresh).
 *   • images & fonts    → cache-first (stale-while-revalidate).
 *   • pages, JS, CSS    → network-first, fall back to cache (then offline page).
 * Network-first for code means online always serves fresh assets (safe with
 * Next dev/HMR); the cache only kicks in when the network is unavailable.
 */
const CACHE = 'sf-cache-v1';
const OFFLINE_URL = '/offline';

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE).then((cache) => cache.addAll(['/', OFFLINE_URL]).catch(() => {})).then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  const { request } = event;
  if (request.method !== 'GET') return;

  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;   // only same-origin
  if (url.pathname.startsWith('/api/')) return;       // dynamic — never cache

  const isAsset = /\.(?:png|jpg|jpeg|svg|webp|avif|gif|ico|woff2?)$/.test(url.pathname);

  if (isAsset) {
    // Cache-first, revalidate in background.
    event.respondWith(
      caches.open(CACHE).then(async (cache) => {
        const cached = await cache.match(request);
        const network = fetch(request)
          .then((res) => { if (res && res.ok) cache.put(request, res.clone()); return res; })
          .catch(() => cached);
        return cached || network;
      })
    );
    return;
  }

  // Network-first for pages / JS / CSS.
  event.respondWith(
    fetch(request)
      .then((res) => {
        if (res && res.ok && (request.mode === 'navigate' || /\.(?:js|css)$/.test(url.pathname))) {
          const copy = res.clone();
          caches.open(CACHE).then((c) => c.put(request, copy)).catch(() => {});
        }
        return res;
      })
      .catch(async () => {
        const cached = await caches.match(request);
        if (cached) return cached;
        if (request.mode === 'navigate') {
          return (await caches.match(OFFLINE_URL)) || (await caches.match('/')) || Response.error();
        }
        return Response.error();
      })
  );
});
