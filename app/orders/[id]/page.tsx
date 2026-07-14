'use client';

import Link from 'next/link';
import { useEffect, useState, use } from 'react';
import { formatMoney } from '@/lib/format';

type OrderStatus = {
  id: string;
  status: string;
  paymentStatus: string;
  stage?: string;
  posStatus?: string | null;
  paymentMethod?: string | null;
  total: number;
  currency: string;
  isPickup: boolean;
  items: Array<{ name: string; price: number; qty: number }>;
  mpesaRef: string | null;
  paymentRef?: string | null;
  updatedAt: string;
};

// Customer-facing fulfilment stages, in order. `completed` shares the last dot
// with a "done" flourish; `cancelled` is handled separately.
const STAGES = ['pending', 'confirmed', 'preparing', 'ready', 'completed'] as const;
type Stage = (typeof STAGES)[number];

const STAGE_LABEL: Record<Stage, string> = {
  pending:   'Order placed',
  confirmed: 'Payment confirmed',
  preparing: 'Being prepared',
  ready:     'Ready',
  completed: 'Completed',
};

const STAGE_HINT: Record<Stage, string> = {
  pending:   'We’re waiting for your payment to complete.',
  confirmed: 'Payment received — the store has your order.',
  preparing: 'The store is preparing your order.',
  ready:     'Your order is ready.',
  completed: 'All done. Thanks for your order!',
};

// Derive the stage: prefer the server's unified `stage`, else infer from the
// payment/order status for backward compatibility.
function resolveStage(o: OrderStatus): Stage | 'cancelled' {
  if (o.stage && (STAGES as readonly string[]).includes(o.stage)) return o.stage as Stage;
  if (o.stage === 'cancelled') return 'cancelled';
  if (o.status === 'cancelled' || o.paymentStatus === 'failed') return 'cancelled';
  if (o.paymentStatus === 'paid') return 'confirmed';
  return 'pending';
}

export default function OrderStatusPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [order, setOrder] = useState<OrderStatus | null>(null);
  const [error] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    let interval: ReturnType<typeof setInterval> | null = null;

    async function poll() {
      const res = await fetch(`/api/storefront/orders/${id}/status`).catch(() => null);
      if (!res?.ok || !active) return;
      const data: OrderStatus = await res.json();
      if (!active) return;
      setOrder(data);
      // Stop polling only when nothing more can change.
      const done = data.paymentStatus === 'failed' || data.status === 'cancelled'
        || data.stage === 'completed' || data.stage === 'cancelled';
      if (done && interval) { clearInterval(interval); interval = null; }
    }

    poll();
    interval = setInterval(() => { poll().catch(() => {}); }, 4000);
    return () => { active = false; if (interval) clearInterval(interval); };
  }, [id]);

  if (error) {
    return <section className="container" style={{ padding: '48px 0' }}><p className="muted">{error}</p></section>;
  }
  if (!order) {
    return <section className="container" style={{ padding: '48px 0' }}><p className="muted">Loading order…</p></section>;
  }

  const stage = resolveStage(order);
  const cancelled = stage === 'cancelled';
  const paid = order.paymentStatus === 'paid';
  const awaiting = stage === 'pending';
  const orderNo = `#${order.id.slice(-6).toUpperCase()}`;
  const currentIdx = cancelled ? -1 : STAGES.indexOf(stage);

  const headline = cancelled ? 'Order cancelled'
    : awaiting ? 'Awaiting payment'
    : STAGE_LABEL[stage as Stage];

  return (
    <section className="container" style={{ padding: '32px 0 56px', maxWidth: 560 }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12, marginBottom: 4 }}>
        <div>
          <p className="muted" style={{ margin: 0, fontSize: 12, letterSpacing: 0.6, fontWeight: 600 }}>ORDER {orderNo}</p>
          <h1 style={{ margin: '2px 0 0' }}>{headline}</h1>
        </div>
        <span style={{
          marginTop: 6, borderRadius: 99, padding: '4px 12px', fontSize: 12, fontWeight: 700, whiteSpace: 'nowrap',
          background: cancelled ? '#fdecec' : paid ? '#e7f6ec' : '#fff7e0',
          color: cancelled ? '#b42318' : paid ? '#1a7f37' : '#946200',
        }}>
          {cancelled ? 'Cancelled' : paid ? 'Paid' : 'Unpaid'}
        </span>
      </div>
      <p className="muted" style={{ marginTop: 0, marginBottom: 24, fontSize: 13 }}>
        {order.isPickup ? 'Pickup' : 'Delivery'} · Ref <span style={{ fontFamily: 'monospace' }}>{order.id}</span>
      </p>

      {/* Cancelled banner */}
      {cancelled ? (
        <div style={{ border: '1px solid #f3c6c2', background: '#fdf4f3', borderRadius: 'var(--radius)', padding: 16, marginBottom: 20 }}>
          <p style={{ margin: 0, fontSize: 14 }}>This order was cancelled and any reserved items have been released.</p>
          <Link href="/checkout" className="button secondary" style={{ display: 'inline-flex', marginTop: 12 }}>Order again</Link>
        </div>
      ) : (
        /* Vertical timeline */
        <div style={{ border: '1px solid var(--border)', borderRadius: 'var(--radius)', padding: '20px 20px 8px', marginBottom: 16 }}>
          {STAGES.map((s, i) => {
            const done = i < currentIdx || (i === currentIdx && stage === 'completed');
            const active = i === currentIdx && stage !== 'completed';
            const reached = i <= currentIdx;
            const isLast = i === STAGES.length - 1;
            return (
              <div key={s} style={{ display: 'flex', gap: 14, alignItems: 'stretch' }}>
                {/* Dot + connector */}
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                  <span style={{
                    width: 18, height: 18, borderRadius: '50%', flexShrink: 0, marginTop: 2,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 11, color: '#fff',
                    background: reached ? 'var(--primary, #16a34a)' : 'var(--border, #e5e7eb)',
                    boxShadow: active ? '0 0 0 4px rgba(22,163,74,0.15)' : 'none',
                  }}>
                    {done ? '✓' : ''}
                  </span>
                  {!isLast && <span style={{ width: 2, flex: 1, minHeight: 22, background: i < currentIdx ? 'var(--primary, #16a34a)' : 'var(--border, #e5e7eb)' }} />}
                </div>
                {/* Label */}
                <div style={{ paddingBottom: 16 }}>
                  <p style={{ margin: 0, fontWeight: active ? 700 : 500, color: reached ? 'inherit' : 'var(--muted-foreground, #9ca3af)' }}>
                    {STAGE_LABEL[s]}
                  </p>
                  {active && <p className="muted" style={{ margin: '2px 0 0', fontSize: 13 }}>{STAGE_HINT[s]}</p>}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Live-updating hint while awaiting */}
      {awaiting && (
        <p className="muted" style={{ fontSize: 13, marginTop: -4, marginBottom: 16 }}>
          <span style={{ display: 'inline-block', width: 8, height: 8, borderRadius: '50%', background: 'var(--primary, #16a34a)', marginRight: 6, animation: 'pulse 1.5s infinite' }} />
          This page updates automatically — keep it open while you complete payment.
        </p>
      )}

      {/* Items */}
      <div style={{ border: '1px solid var(--border)', borderRadius: 'var(--radius)', padding: 16, marginBottom: 16 }}>
        <strong style={{ display: 'block', marginBottom: 10 }}>Items</strong>
        {order.items.map((item, i) => (
          <p key={i} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 14, margin: '6px 0' }}>
            <span>{item.name} <span className="muted">× {item.qty}</span></span>
            <span>{formatMoney(item.price * item.qty, order.currency)}</span>
          </p>
        ))}
        <p style={{ display: 'flex', justifyContent: 'space-between', borderTop: '1px solid var(--border)', paddingTop: 10, marginTop: 10, fontWeight: 700, fontSize: 16 }}>
          <span>Total</span>
          <span>{formatMoney(order.total, order.currency)}</span>
        </p>
      </div>

      {/* Payment receipt */}
      {paid && (order.paymentRef || order.mpesaRef) && (
        <div style={{ border: '1px solid var(--border)', borderRadius: 'var(--radius)', padding: 16, marginBottom: 16 }}>
          <strong style={{ display: 'block', marginBottom: 10 }}>Payment receipt</strong>
          <Row label="Method"><span style={{ textTransform: 'capitalize' }}>{order.paymentMethod ?? 'Payment'}</span></Row>
          <Row label="Reference"><span style={{ fontFamily: 'monospace' }}>{order.paymentRef ?? order.mpesaRef}</span></Row>
          <Row label="Amount"><span>{formatMoney(order.total, order.currency)}</span></Row>
          <Row label="Paid"><span>{new Date(order.updatedAt).toLocaleString()}</span></Row>
          {/* /api route, not a page — a plain download anchor is correct here. */}
          <a href={`/api/storefront/orders/${order.id}/receipt`} className="button secondary" style={{ display: 'inline-flex', marginTop: 12 }}>
            Download receipt (PDF)
          </a>
        </div>
      )}

      <Link href="/orders" className="button secondary" style={{ display: 'inline-block', marginTop: 4 }}>
        All my orders
      </Link>
    </section>
  );
}

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <p style={{ display: 'flex', justifyContent: 'space-between', fontSize: 14, margin: '6px 0' }}>
      <span className="muted">{label}</span>
      {children}
    </p>
  );
}
