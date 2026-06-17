'use client';

import { useEffect, useState } from 'react';
import type { Order } from '@/lib/types';

export function OrdersPageClient() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [status, setStatus] = useState('Loading orders...');

  useEffect(() => {
    fetch('/api/storefront/orders')
      .then((response) => response.json())
      .then((payload) => {
        setOrders(payload.orders ?? []);
        setStatus(payload.error ?? '');
      });
  }, []);

  return (
    <section className="container" style={{ padding: '32px 0 56px' }}>
      <h1>Orders</h1>
      {status && <p className="muted">{status}</p>}
      <div className="stack">
        {orders.map((order) => (
          <article key={order.id} style={{ border: '1px solid var(--border)', borderRadius: 'var(--radius)', padding: 14 }}>
            <strong>{order.id ?? order.public_id}</strong>
            <p className="muted">{order.status ?? 'Pending'} {order.created_at ? `- ${new Date(order.created_at).toLocaleString()}` : ''}</p>
          </article>
        ))}
      </div>
    </section>
  );
}
