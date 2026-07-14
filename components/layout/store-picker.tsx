'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useEffect, useRef, useState } from 'react';
import { ShoppingBag, ChevronDown, Check } from 'lucide-react';
import type { StorefrontAbout, NetworkStore } from '@/lib/types';

/**
 * The store name in the top-left. When the instance serves more than one
 * store/branch it becomes a dropdown to switch between them; with a single
 * store it stays a plain link home (no dropdown, no hint) — per the
 * multi-branch design.
 */
export function StorePicker({ about, stores, logo }: { about?: StorefrontAbout | null; stores: NetworkStore[]; logo?: string | null }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  const name = about?.name ?? 'Storefront Web';
  // Priority resolved server-side: backend logo → env → /public/logo.* → icon.
  const brandLogo = logo ?? about?.logo_url;
  const others = stores.filter((s) => s.id && s.id !== about?.id);
  const hasBranches = others.length > 0;

  useEffect(() => {
    if (!open) return;
    const onDoc = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false); };
    document.addEventListener('mousedown', onDoc);
    return () => document.removeEventListener('mousedown', onDoc);
  }, [open]);

  const brand = (
    <span style={{ display: 'flex', alignItems: 'center', gap: 12, minWidth: 0 }}>
      {brandLogo
        // Plain img (like the hero) so SVG logos and arbitrary URLs work without next.config.
        // eslint-disable-next-line @next/next/no-img-element
        ? <img src={brandLogo} alt="" width={38} height={38} style={{ borderRadius: 12, objectFit: 'contain' }} />
        : <ShoppingBag size={32} />}
      <strong style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{name}</strong>
    </span>
  );

  // Single store → plain link home.
  if (!hasBranches) {
    return <Link href="/" style={{ display: 'flex', alignItems: 'center', minWidth: 0 }}>{brand}</Link>;
  }

  return (
    <div ref={ref} style={{ position: 'relative', minWidth: 0 }}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-haspopup="listbox"
        aria-expanded={open}
        style={{ display: 'flex', alignItems: 'center', gap: 8, background: 'transparent', border: 'none', padding: 0, cursor: 'pointer', color: 'inherit', minWidth: 0 }}
      >
        {brand}
        <ChevronDown size={16} style={{ opacity: 0.6, transform: open ? 'rotate(180deg)' : undefined, transition: 'transform 0.15s ease' }} />
      </button>

      {open && (
        <div
          role="listbox"
          style={{
            position: 'absolute', top: 'calc(100% + 8px)', left: 0, zIndex: 50, minWidth: 240,
            background: 'var(--background)', border: '1px solid var(--border)', borderRadius: 'var(--radius)',
            boxShadow: 'var(--shadow)', padding: 6, maxHeight: 360, overflowY: 'auto',
          }}
        >
          <p className="muted" style={{ margin: '4px 10px 6px', fontSize: 12 }}>Switch store</p>
          {/* Current store */}
          <Link href="/" onClick={() => setOpen(false)} className="button ghost" style={{ width: '100%', justifyContent: 'space-between' }}>
            <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{name}</span>
            <Check size={16} style={{ color: 'var(--primary)' }} />
          </Link>
          {others.map((s) => (
            <Link
              key={s.id}
              href={s.website || `/?branch=${encodeURIComponent(s.id)}`}
              onClick={() => setOpen(false)}
              className="button ghost"
              style={{ width: '100%', justifyContent: 'flex-start', gap: 10 }}
            >
              {s.logo_url ? <Image src={s.logo_url} alt="" width={22} height={22} style={{ borderRadius: 6, objectFit: 'cover' }} /> : <ShoppingBag size={18} />}
              <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{s.name}</span>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
