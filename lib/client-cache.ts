'use client';

import { useCallback, useEffect, useState } from 'react';

// Tiny client-side cache: in-memory + sessionStorage, with stale-while-revalidate.
// Lets pages show already-fetched data (user details, config, orders) instantly on
// reload and skip the network entirely while the entry is fresh.

type Entry = { data: unknown; ts: number };
const mem = new Map<string, Entry>();
const PREFIX = 'sf-cache:';

function load(key: string): Entry | null {
  const m = mem.get(key);
  if (m) return m;
  if (typeof window === 'undefined') return null;
  try {
    const raw = window.sessionStorage.getItem(PREFIX + key);
    if (!raw) return null;
    const e = JSON.parse(raw) as Entry;
    mem.set(key, e);
    return e;
  } catch {
    return null;
  }
}

export function cacheGet<T>(key: string): T | null {
  const e = load(key);
  return e ? (e.data as T) : null;
}

export function cacheAgeMs(key: string): number {
  const e = load(key);
  return e ? Date.now() - e.ts : Infinity;
}

export function cacheSet(key: string, data: unknown): void {
  const e: Entry = { data, ts: Date.now() };
  mem.set(key, e);
  if (typeof window !== 'undefined') {
    try { window.sessionStorage.setItem(PREFIX + key, JSON.stringify(e)); } catch { /* quota / private mode */ }
  }
}

export function cacheClear(key: string): void {
  mem.delete(key);
  if (typeof window !== 'undefined') {
    try { window.sessionStorage.removeItem(PREFIX + key); } catch { /* ignore */ }
  }
}

/**
 * Cached GET. Returns cached data immediately (memory → sessionStorage) and only
 * hits the network when the entry is missing or older than `ttlMs`. `set` lets a
 * caller update the cache after a mutation so other pages see the change.
 */
export function useCachedGet<T>(
  key: string,
  url: string,
  opts: { ttlMs?: number; enabled?: boolean; select?: (raw: unknown) => T } = {},
): { data: T | null; loading: boolean; refresh: () => Promise<void>; set: (d: T) => void } {
  const { ttlMs = 5 * 60_000, enabled = true } = opts;
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState<boolean>(enabled);

  const refresh = useCallback(async () => {
    try {
      const res = await fetch(url);
      if (!res.ok) { setLoading(false); return; }
      const json = (await res.json()) as T;
      cacheSet(key, json);
      setData(json);
    } catch {
      /* keep whatever we had */
    } finally {
      setLoading(false);
    }
  }, [key, url]);

  const set = useCallback((d: T) => { cacheSet(key, d); setData(d); }, [key]);

  useEffect(() => {
    if (!enabled) { setLoading(false); return; }
    const cached = cacheGet<T>(key);
    if (cached !== null) {
      setData(cached);
      setLoading(false);
      if (cacheAgeMs(key) > ttlMs) void refresh(); // stale → revalidate quietly
    } else {
      void refresh();
    }
  }, [enabled, key, ttlMs, refresh]);

  return { data, loading, refresh, set };
}
