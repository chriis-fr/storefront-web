'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import type { Order } from '@/lib/types';
import { formatMoney } from '@/lib/format';
import { cacheGet, cacheSet, cacheAgeMs } from '@/lib/client-cache';

type OrderItem = { name?: string; qty?: number; price?: number };
type OrderMeta = {
  paymentStatus?: string;
  orderStatus?: string;
  paymentMethod?: string | null;
  total?: number;
  currency?: string;
  isPickup?: boolean;
  items?: OrderItem[];
};

// Short, stable, human-friendly order number derived from the order id — unique
// per order and consistent across the list, detail page and receipts.
function orderNumber(id?: string): string {
  if (!id) return '——';
  return `#${id.slice(-6).toUpperCase()}`;
}

// Payment/fulfilment status → label + colour. Payment state takes priority since
// that's what the customer is waiting on.
function statusBadge(meta: OrderMeta, topStatus?: string): { label: string; bg: string; fg: string } {
  const pay = meta.paymentStatus;
  const st = meta.orderStatus ?? topStatus;
  if (pay === 'paid' || st === 'paid') return { label: 'Paid', bg: '#e7f6ec', fg: '#1a7f37' };
  if (st === 'cancelled' || pay === 'failed') return { label: 'Cancelled', bg: '#fdecec', fg: '#b42318' };
  if (st === 'confirmed') return { label: 'Confirmed', bg: '#e8f0fe', fg: '#1a56db' };
  if (st === 'preparing') return { label: 'Preparing', bg: '#fff4e5', fg: '#b54708' };
  if (st === 'ready')     return { label: 'Ready', bg: '#e8f0fe', fg: '#1a56db' };
  return { label: 'Awaiting payment', bg: '#fff7e0', fg: '#946200' };
}

function itemSummary(items: OrderItem[]): string {
  if (!items.length) return '';
  const count = items.reduce((n, i) => n + (i.qty ?? 0), 0);
  const names = items.map((i) => i.name).filter(Boolean).slice(0, 3).join(', ');
  const more = items.length > 3 ? '…' : '';
  return `${count} item${count === 1 ? '' : 's'}${names ? ` · ${names}${more}` : ''}`;
}

export function OrdersPageClient() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [needsAuth, setNeedsAuth] = useState(false);

  useEffect(() => {
    // Show cached orders instantly; only refetch when stale (short TTL).
    const cached = cacheGet<Order[]>('orders');
    if (cached) { setOrders(cached); setLoading(false); }
    if (cached && cacheAgeMs('orders') <= 60_000) return;
    fetch('/api/storefront/orders')
      .then((response) => response.json().then((payload) => ({ ok: response.ok, payload })))
      .then(({ ok, payload }) => {
        if (!ok) { setNeedsAuth(true); return; }
        const list: Order[] = payload.orders ?? [];
        setOrders(list);
        cacheSet('orders', list);
      })
      .catch(() => { if (!cached) setNeedsAuth(true); })
      .finally(() => setLoading(false));
  }, []);

  return (
    <section className="container" style={{ padding: '32px 0 56px' }}>
      <h1>Orders</h1>

      {loading && <p className="muted">Loading orders…</p>}

      {/* Logged-out: a clear prompt with a real sign-in button (returns here) */}
      {!loading && needsAuth && (
        <div style={{ border: '1px solid var(--border)', borderRadius: 'var(--radius)', padding: 24, marginTop: 12, textAlign: 'center' }} className="stack">
          <p style={{ margin: 0 }}><strong>Sign in to see your orders</strong></p>
          <p className="muted" style={{ margin: 0 }}>Your order history is tied to your account.</p>
          <Link className="button" href="/account?next=/orders" style={{ justifySelf: 'center', marginTop: 4 }}>
            Sign in
          </Link>
        </div>
      )}

      {!loading && !needsAuth && orders.length === 0 && (
        <div style={{ marginTop: 12 }} className="stack">
          <p className="muted">You haven’t placed any orders yet.</p>
          <Link className="button secondary" href="/search" style={{ width: 'max-content' }}>Start shopping</Link>
        </div>
      )}

      <div className="stack" style={{ gap: 12, marginTop: 12 }}>
        {orders.map((order) => {
          const meta = (order.meta ?? {}) as OrderMeta;
          const badge = statusBadge(meta, order.status);
          const items = meta.items ?? [];
          const summary = itemSummary(items);
          const when = order.created_at ? new Date(order.created_at) : null;
          const fulfilment = meta.isPickup === false ? 'Delivery' : 'Pickup';
          return (
            <Link
              key={order.id}
              href={`/orders/${order.id}`}
              style={{ textDecoration: 'none', color: 'inherit' }}
            >
              <article style={{ border: '1px solid var(--border)', borderRadius: 'var(--radius)', padding: 16 }} className="stack">
                {/* Header: order number + status badge */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12 }}>
                  <strong style={{ fontSize: 16 }}>Order {orderNumber(order.id)}</strong>
                  <span style={{ background: badge.bg, color: badge.fg, borderRadius: 99, padding: '3px 10px', fontSize: 12, fontWeight: 700, whiteSpace: 'nowrap' }}>
                    {badge.label}
                  </span>
                </div>

                {/* Items summary */}
                {summary && <p className="muted" style={{ margin: 0, fontSize: 14 }}>{summary}</p>}

                {/* Amount + meta */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', gap: 12 }}>
                  <div className="muted" style={{ fontSize: 13, lineHeight: 1.5 }}>
                    {when && <div>{when.toLocaleDateString()} · {when.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</div>}
                    <div style={{ textTransform: 'capitalize' }}>
                      {fulfilment}{meta.paymentMethod ? ` · ${meta.paymentMethod}` : ''}
                    </div>
                  </div>
                  {typeof meta.total === 'number' && (
                    <strong style={{ fontSize: 18, whiteSpace: 'nowrap' }}>{formatMoney(meta.total, meta.currency)}</strong>
                  )}
                </div>
              </article>
            </Link>
          );
        })}
      </div>
    </section>
  );
}
