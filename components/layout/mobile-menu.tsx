'use client';

import Link from 'next/link';
import { useEffect, useRef, useState } from 'react';
import { Menu, X, Search, Package, UserRound } from 'lucide-react';

/** Hamburger menu shown on phones/tablets — holds the nav links that don't fit
 *  the collapsed header bar. */
export function MobileMenu() {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onDoc = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false); };
    document.addEventListener('mousedown', onDoc);
    return () => document.removeEventListener('mousedown', onDoc);
  }, [open]);

  const link = (href: string, label: string, Icon: typeof Search) => (
    <Link
      href={href}
      onClick={() => setOpen(false)}
      className="button ghost"
      style={{ justifyContent: 'flex-start', gap: 10 }}
    >
      <Icon size={16} /> {label}
    </Link>
  );

  return (
    <div ref={ref} style={{ position: 'relative' }}>
      <button
        type="button"
        className="button secondary"
        aria-label="Menu"
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
        style={{ padding: '0 10px' }}
      >
        {open ? <X size={18} /> : <Menu size={18} />}
      </button>
      {open && (
        <div
          role="menu"
          style={{
            position: 'absolute', right: 0, top: 'calc(100% + 8px)', zIndex: 50, minWidth: 200,
            background: 'var(--background)', border: '1px solid var(--border)', borderRadius: 'var(--radius)',
            boxShadow: 'var(--shadow)', padding: 6, display: 'grid', gap: 4,
          }}
        >
          {link('/search', 'Browse', Search)}
          {link('/orders', 'Orders', Package)}
          {link('/account', 'Account', UserRound)}
        </div>
      )}
    </div>
  );
}
