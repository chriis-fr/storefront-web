import Link from 'next/link';
import { ShoppingBag, UserRound, Search } from 'lucide-react';
import type { StorefrontAbout, NetworkStore } from '@/lib/types';
import { Slot } from '@/components/plugin-slot';
import { CartCount } from './cart-count';
import { ThemeToggle } from './theme-toggle';
import { StorePicker } from './store-picker';
import { MobileMenu } from './mobile-menu';

export function Header({ about, stores = [], logo = null }: { about?: StorefrontAbout | null; stores?: NetworkStore[]; logo?: string | null }) {
  return (
    <header className="page-band" style={{ background: 'var(--background)', position: 'sticky', top: 0, zIndex: 40 }}>
      <Slot name="Header.before" />
      <div className="container site-header__bar">
        <StorePicker about={about} stores={stores} logo={logo} />

        {/* Search box — submits to the browse hub. Full-width row on phones. */}
        <form action="/search" className="site-header__search">
          <Search size={16} style={{ position: 'absolute', left: 10, opacity: 0.5, pointerEvents: 'none' }} aria-hidden />
          <input className="field" name="q" placeholder="Search products" style={{ paddingLeft: 32, width: '100%' }} />
        </form>

        {/* Desktop nav */}
        <nav className="site-header__nav">
          <Link className="button ghost" href="/search">Browse</Link>
          <Link className="button ghost" href="/orders">Orders</Link>
          <ThemeToggle />
          <Link className="button secondary" href="/account" aria-label="Account">
            <UserRound size={18} />
          </Link>
          <Link className="button" href="/cart" style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
            <ShoppingBag size={18} /> Cart <CartCount />
          </Link>
        </nav>

        {/* Compact cluster for phones/tablets: theme, cart, menu */}
        <div className="site-header__mobile">
          <ThemeToggle />
          <Link className="button" href="/cart" aria-label="Cart" style={{ padding: '0 12px', display: 'inline-flex', alignItems: 'center', gap: 6 }}>
            <ShoppingBag size={18} /> <CartCount />
          </Link>
          <MobileMenu />
        </div>
      </div>
      <Slot name="Header.after" />
    </header>
  );
}
