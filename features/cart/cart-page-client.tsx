'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { Trash2, Minus, Plus, ShoppingBag } from 'lucide-react';
import type { Cart } from '@/lib/types';
import { formatMoney } from '@/lib/format';
import { categoryVisual } from '@/lib/category-icons';

export function CartPageClient() {
  const [cart, setCart] = useState<Cart | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [updatingItemId, setUpdatingItemId] = useState<string | null>(null);

  async function loadCart() {
    setLoading(true);
    const response = await fetch('/api/storefront/cart');
    const payload = await response.json();
    setCart(payload.cart ?? null);
    setError(payload.error ?? null);
    setLoading(false);
  }

  async function remove(lineItemId: string) {
    setUpdatingItemId(lineItemId);
    const response = await fetch('/api/storefront/cart/items', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ lineItemId })
    });
    const payload = await response.json();
    setCart(payload.cart ?? null);
    setError(payload.error ?? null);
    setUpdatingItemId(null);
    // Removing a line changes the distinct-product count → refresh the badge.
    window.dispatchEvent(new Event('cart:updated'));
  }

  async function updateQuantity(lineItemId: string, quantity: number) {
    setUpdatingItemId(lineItemId);
    const response = await fetch('/api/storefront/cart/items', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ lineItemId, quantity: Math.max(1, quantity) })
    });
    const payload = await response.json();
    setCart(payload.cart ?? null);
    setError(payload.error ?? null);
    setUpdatingItemId(null);
  }

  useEffect(() => {
    loadCart();
  }, []);

  const isEmpty = !loading && (!cart || !cart.items?.length);
  const uniqueCount = cart?.total_unique_items ?? cart?.items?.length ?? 0;

  return (
    <section className="container" style={{ padding: '32px 0 56px' }}>
      <div className="section-title">
        <div>
          <h1>Your cart</h1>
          <p className="muted">{uniqueCount > 0 ? `${uniqueCount} product${uniqueCount === 1 ? '' : 's'} · review before checkout` : 'Review your items before checkout.'}</p>
        </div>
        <Link className="button secondary" href="/search">Continue shopping</Link>
      </div>

      {loading && <p className="muted">Loading cart…</p>}
      {error && <p style={{ color: 'var(--error)' }}>{error}</p>}

      {cart && cart.items?.length > 0 ? (
        <div className="two-column">
          {/* Line items */}
          <div className="stack">
            {cart.items.map((item) => {
              const fallback = categoryVisual(item.name);
              const updating = updatingItemId === item.id;
              const unit = item.price ?? (item.quantity ? item.subtotal / item.quantity : item.subtotal);
              return (
                <article
                  key={item.id}
                  style={{
                    border: '1px solid var(--border)', borderRadius: 'var(--radius)', background: 'var(--surface)',
                    boxShadow: 'var(--shadow)', padding: 12, display: 'flex', gap: 14, alignItems: 'center',
                    opacity: updating ? 0.6 : 1, transition: 'opacity 0.15s ease', flexWrap: 'wrap',
                  }}
                >
                  {/* Thumbnail */}
                  <div style={{ width: 72, height: 72, borderRadius: 10, overflow: 'hidden', flexShrink: 0, background: item.product_image_url ? 'var(--surface-strong)' : fallback.bg, position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    {item.product_image_url
                      // eslint-disable-next-line @next/next/no-img-element
                      ? <img src={item.product_image_url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      : <span aria-hidden style={{ fontSize: 32, opacity: 0.85 }}>{fallback.emoji}</span>}
                  </div>

                  {/* Name + unit price + stepper */}
                  <div className="stack" style={{ gap: 8, flex: 1, minWidth: 160 }}>
                    <div>
                      <strong style={{ display: 'block' }}>{item.name}</strong>
                      <span className="muted" style={{ fontSize: 13 }}>{formatMoney(unit, cart.currency)} each</span>
                    </div>
                    <div style={{ display: 'inline-flex', alignItems: 'center', border: '1px solid var(--border)', borderRadius: 'var(--radius)', width: 'max-content', overflow: 'hidden', background: 'var(--background)' }}>
                      <button type="button" aria-label="Decrease quantity" disabled={updating || item.quantity <= 1}
                        onClick={() => updateQuantity(item.id, item.quantity - 1)}
                        style={{ width: 38, height: 38, border: 'none', background: 'transparent', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', color: 'inherit', opacity: item.quantity <= 1 ? 0.4 : 1 }}>
                        <Minus size={15} />
                      </button>
                      <span style={{ minWidth: 38, textAlign: 'center', fontWeight: 700, fontVariantNumeric: 'tabular-nums' }}>{item.quantity}</span>
                      <button type="button" aria-label="Increase quantity" disabled={updating}
                        onClick={() => updateQuantity(item.id, item.quantity + 1)}
                        style={{ width: 38, height: 38, border: 'none', background: 'transparent', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', color: 'inherit' }}>
                        <Plus size={15} />
                      </button>
                    </div>
                  </div>

                  {/* Line total + remove */}
                  <div className="stack" style={{ gap: 10, alignItems: 'flex-end', marginLeft: 'auto' }}>
                    <strong style={{ whiteSpace: 'nowrap' }}>{formatMoney(item.subtotal, cart.currency)}</strong>
                    <button type="button" className="button ghost" disabled={updating} onClick={() => remove(item.id)} aria-label={`Remove ${item.name}`} style={{ minHeight: 34, padding: '0 10px', color: 'var(--error)' }}>
                      <Trash2 size={15} /> Remove
                    </button>
                  </div>
                </article>
              );
            })}
          </div>

          {/* Summary */}
          <aside
            className="stack"
            style={{ border: '1px solid var(--border)', borderRadius: 'var(--radius)', background: 'var(--surface)', boxShadow: 'var(--shadow)', padding: 18, height: 'max-content', position: 'sticky', top: 92, gap: 14 }}
          >
            <strong style={{ fontSize: '1.1rem' }}>Order summary</strong>
            <p style={{ display: 'flex', justifyContent: 'space-between', margin: 0 }}>
              <span className="muted">Subtotal ({uniqueCount} item{uniqueCount === 1 ? '' : 's'})</span>
              <strong>{formatMoney(cart.subtotal, cart.currency)}</strong>
            </p>
            <p className="muted" style={{ margin: 0, fontSize: 12 }}>Taxes & delivery are arranged at checkout.</p>
            <Link className="button" href="/checkout" style={{ height: 48, fontSize: '1rem' }}>Checkout</Link>
            <Link className="button secondary" href="/search" style={{ textAlign: 'center' }}>Continue shopping</Link>
          </aside>
        </div>
      ) : isEmpty ? (
        <div style={{ border: '1px solid var(--border)', borderRadius: 'var(--radius)', background: 'var(--surface)', padding: '48px 24px', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12, marginTop: 8 }}>
          <div style={{ width: 64, height: 64, borderRadius: '50%', background: 'var(--surface-strong)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--muted)' }}>
            <ShoppingBag size={28} />
          </div>
          <strong style={{ fontSize: '1.15rem' }}>Your cart is empty</strong>
          <p className="muted" style={{ margin: 0 }}>Browse the store and add a few things.</p>
          <Link className="button" href="/search" style={{ marginTop: 4 }}>Start shopping</Link>
        </div>
      ) : null}
    </section>
  );
}
