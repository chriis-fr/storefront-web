'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { Trash2 } from 'lucide-react';
import type { Cart } from '@/lib/types';
import { formatMoney } from '@/lib/format';

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

  return (
    <section className="container" style={{ padding: '32px 0 56px' }}>
      <div className="section-title">
        <div>
          <h1>Your cart</h1>
          <p className="muted">Review your items before checkout.</p>
        </div>
        <Link className="button secondary" href="/search">Continue shopping</Link>
      </div>
      {loading && <p className="muted">Loading cart...</p>}
      {error && <p style={{ color: 'var(--error)' }}>{error}</p>}
      {cart && cart.items?.length > 0 ? (
        <div className="two-column">
          <div className="stack">
            {cart.items.map((item) => (
              <article key={item.id} style={{ border: '1px solid var(--border)', borderRadius: 'var(--radius)', padding: 14, display: 'flex', justifyContent: 'space-between', gap: 16 }}>
                <div className="stack" style={{ gap: 10 }}>
                  <strong>{item.name}</strong>
                  {item.description && <p className="muted">{item.description}</p>}
                  <p>{formatMoney(item.subtotal, cart.currency)}</p>
                  <label style={{ display: 'flex', alignItems: 'center', gap: 8, maxWidth: 180 }}>
                    <span className="muted">Qty</span>
                    <input
                      className="field"
                      type="number"
                      min={1}
                      defaultValue={item.quantity}
                      disabled={updatingItemId === item.id}
                      onBlur={(event) => updateQuantity(item.id, Number(event.target.value))}
                    />
                  </label>
                </div>
                <button className="button secondary" disabled={updatingItemId === item.id} onClick={() => remove(item.id)} aria-label={`Remove ${item.name}`}>
                  <Trash2 size={16} />
                </button>
              </article>
            ))}
          </div>
          <aside className="stack" style={{ border: '1px solid var(--border)', borderRadius: 'var(--radius)', padding: 16, height: 'max-content' }}>
            <strong>Summary</strong>
            <p style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span>Subtotal</span>
              <strong>{formatMoney(cart.subtotal, cart.currency)}</strong>
            </p>
            <Link className="button" href="/checkout">Checkout</Link>
          </aside>
        </div>
      ) : !loading ? (
        <p className="muted">Your cart is empty.</p>
      ) : null}
    </section>
  );
}
