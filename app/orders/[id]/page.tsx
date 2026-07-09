'use client';

import { useEffect, useState, use } from 'react';
import { formatMoney } from '@/lib/format';

type OrderStatus = {
  id: string;
  status: string;
  paymentStatus: string;
  total: number;
  currency: string;
  isPickup: boolean;
  items: Array<{ name: string; price: number; qty: number }>;
  mpesaRef: string | null;
  updatedAt: string;
};

const STATUS_LABELS: Record<string, string> = {
  pending:   'Order placed',
  confirmed: 'Confirmed',
  preparing: 'Preparing',
  ready:     'Ready for pickup / delivery',
  paid:      'Complete',
  cancelled: 'Cancelled',
};

export default function OrderStatusPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [orderStatus, setOrderStatus] = useState<OrderStatus | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;

    async function poll() {
      const res = await fetch(`/api/storefront/orders/${id}/status`).catch(() => null);
      if (!res?.ok || !active) return;
      const data: OrderStatus = await res.json();
      setOrderStatus(data);
    }

    poll();
    const interval = setInterval(() => {
      if (orderStatus?.paymentStatus === 'paid' || orderStatus?.status === 'cancelled') {
        clearInterval(interval);
        return;
      }
      poll().catch(() => {});
    }, 4000);

    return () => { active = false; clearInterval(interval); };
  }, [id, orderStatus?.paymentStatus, orderStatus?.status]);

  if (error) {
    return (
      <section className="container" style={{ padding: '48px 0' }}>
        <p className="muted">{error}</p>
      </section>
    );
  }

  if (!orderStatus) {
    return (
      <section className="container" style={{ padding: '48px 0' }}>
        <p className="muted">Loading order…</p>
      </section>
    );
  }

  const paid    = orderStatus.paymentStatus === 'paid';
  const failed  = orderStatus.status === 'cancelled';
  const waiting = !paid && !failed;

  return (
    <section className="container" style={{ padding: '48px 0', maxWidth: 540 }}>
      <h1 style={{ marginBottom: 4 }}>
        {paid ? 'Order confirmed' : failed ? 'Order cancelled' : 'Awaiting payment'}
      </h1>
      <p className="muted" style={{ marginBottom: 24, fontSize: 14 }}>
        Ref: <span style={{ fontFamily: 'monospace' }}>{orderStatus.id}</span>
      </p>

      {/* Status stages */}
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 24 }}>
        {['pending', 'confirmed', 'preparing', 'ready', 'paid'].map((s) => {
          const stages = ['pending', 'confirmed', 'preparing', 'ready', 'paid'];
          const current = stages.indexOf(orderStatus.status);
          const thisIdx = stages.indexOf(s);
          const done  = thisIdx <= current;
          const active = thisIdx === current;
          return (
            <span key={s} style={{
              padding: '4px 10px',
              borderRadius: 99,
              fontSize: 12,
              fontWeight: active ? 700 : 400,
              background: done ? 'var(--primary, #4CAF50)' : 'var(--muted, #e5e7eb)',
              color: done ? '#fff' : 'var(--muted-foreground, #6b7280)',
            }}>
              {STATUS_LABELS[s]}
            </span>
          );
        })}
      </div>

      {/* Items */}
      <div style={{ border: '1px solid var(--border)', borderRadius: 'var(--radius)', padding: 16, marginBottom: 16 }}>
        <strong style={{ display: 'block', marginBottom: 10 }}>Items</strong>
        {orderStatus.items.map((item, i) => (
          <p key={i} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 14, margin: '4px 0' }}>
            <span>{item.name} × {item.qty}</span>
            <span>{formatMoney(item.price * item.qty, orderStatus.currency)}</span>
          </p>
        ))}
        <p style={{ display: 'flex', justifyContent: 'space-between', borderTop: '1px solid var(--border)', paddingTop: 10, marginTop: 10, fontWeight: 700 }}>
          <span>Total</span>
          <span>{formatMoney(orderStatus.total, orderStatus.currency)}</span>
        </p>
      </div>

      {paid && orderStatus.mpesaRef && (
        <p style={{ fontSize: 14, marginBottom: 16 }}>
          M-Pesa receipt: <strong style={{ fontFamily: 'monospace' }}>{orderStatus.mpesaRef}</strong>
        </p>
      )}

      {waiting && (
        <p className="muted" style={{ fontSize: 13 }}>
          <span style={{ display: 'inline-block', width: 8, height: 8, borderRadius: '50%', background: '#4CAF50', marginRight: 6 }} />
          This page updates automatically. Keep it open while you complete payment.
        </p>
      )}

      {failed && (
        <p className="muted" style={{ fontSize: 14 }}>
          Payment failed or was cancelled. Your items are available again.{' '}
          <a href="/checkout" style={{ color: 'var(--primary)' }}>Try again</a>
        </p>
      )}

      <a href="/orders" className="button secondary" style={{ display: 'inline-block', marginTop: 20 }}>
        All my orders
      </a>
    </section>
  );
}
