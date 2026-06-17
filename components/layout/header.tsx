import Image from 'next/image';
import Link from 'next/link';
import { ShoppingBag, UserRound } from 'lucide-react';
import type { StorefrontAbout } from '@/lib/types';
import { Slot } from '@/components/plugin-slot';

export function Header({ about }: { about?: StorefrontAbout | null }) {
  return (
    <header className="page-band" style={{ background: 'var(--background)' }}>
      <Slot name="Header.before" />
      <div className="container" style={{ minHeight: 72, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16 }}>
        <Link href="/" style={{ display: 'flex', alignItems: 'center', gap: 12, minWidth: 0 }}>
          {about?.logo_url ? <Image src={about.logo_url} alt="" width={38} height={38} style={{ borderRadius: 8, objectFit: 'cover' }} /> : <ShoppingBag size={32} />}
          <strong style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{about?.name ?? 'Storefront Web'}</strong>
        </Link>
        <nav style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <Link className="button ghost" href="/search">Search</Link>
          <Link className="button ghost" href="/orders">Orders</Link>
          <Link className="button secondary" href="/account" aria-label="Account">
            <UserRound size={18} />
          </Link>
          <Link className="button" href="/cart">
            <ShoppingBag size={18} /> Cart
          </Link>
        </nav>
      </div>
      <Slot name="Header.after" />
    </header>
  );
}
