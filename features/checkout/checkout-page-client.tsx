'use client';

import { useEffect, useMemo, useState } from 'react';
import { loadStripe } from '@stripe/stripe-js';
import type { Cart, Order, PaymentGateway, ServiceQuote } from '@/lib/types';
import { formatMoney } from '@/lib/format';
import { Slot } from '@/components/plugin-slot';

type OrderStatus = { id: string; status: string; paymentStatus: string; total: number; currency: string; mpesaRef: string | null };

export function CheckoutPageClient() {
  const [cart, setCart]       = useState<Cart | null>(null);
  const [gateways, setGateways] = useState<PaymentGateway[]>([]);
  const [gateway, setGateway] = useState('stripe');
  const [pickup, setPickup]   = useState(true);
  const [mpesaPhone, setMpesaPhone] = useState('');
  const [deliveryAddress, setDeliveryAddress] = useState('');
  const [notes, setNotes]     = useState('');
  const [quote, setQuote]     = useState<ServiceQuote | null>(null);
  const [status, setStatus]   = useState<string | null>(null);
  const [order, setOrder]     = useState<Order | null>(null);
  const [orderStatus, setOrderStatus] = useState<OrderStatus | null>(null);
  const [loading, setLoading] = useState(false);
  const [polling, setPolling] = useState(false);

  const isMpesa = gateway === 'mpesa';
  const total = useMemo(() => (cart?.subtotal ?? 0) + (pickup ? 0 : quote?.amount ?? 0), [cart, pickup, quote]);

  useEffect(() => {
    Promise.all([
      fetch('/api/storefront/cart').then((r) => r.json()),
      fetch('/api/storefront/gateways').then((r) => r.json()),
    ]).then(([cartData, gatewayData]) => {
      const c = cartData.cart ?? null;
      const gws: PaymentGateway[] = gatewayData.gateways ?? [];
      setCart(c);
      setGateways(gws);
      // Default to first available gateway
      if (gws.length) setGateway(gws[0].code ?? gws[0].id);
    });
  }, []);

  // Poll order status after M-Pesa order placed
  useEffect(() => {
    if (!order?.id || !polling) return;
    const interval = setInterval(async () => {
      const res = await fetch(`/api/storefront/orders/${order.id}/status`).catch(() => null);
      if (!res?.ok) return;
      const data: OrderStatus = await res.json();
      setOrderStatus(data);
      if (data.paymentStatus === 'paid' || data.status === 'cancelled') {
        setPolling(false);
        clearInterval(interval);
      }
    }, 3000);
    return () => clearInterval(interval);
  }, [order, polling]);

  async function fetchQuote() {
    if (!cart?.id || pickup || !deliveryAddress) return;
    const res = await fetch('/api/storefront/service-quote', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ cart: cart.id, origin: '', destination: deliveryAddress }),
    });
    const data = await res.json();
    setQuote(data.quote ?? null);
  }

  async function placeMpesaOrder(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setStatus(null);
    try {
      if (!cart?.id) throw new Error('Cart not found. Please add items before checking out.');
      const res = await fetch('/api/storefront/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          cartId: cart.id,
          isPickup: pickup,
          mpesaPhone: mpesaPhone.trim(),
          deliveryAddress: !pickup && deliveryAddress ? { line1: deliveryAddress } : undefined,
          notes: notes.trim() || undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? 'Unable to place order.');
      setOrder(data.order);
      setPolling(true);
      setStatus(mpesaPhone ? 'STK push sent — check your phone for the M-Pesa prompt.' : 'Order placed. Complete payment via M-Pesa using the details below.');
    } catch (err) {
      setStatus(err instanceof Error ? err.message : 'Unable to place order.');
    } finally {
      setLoading(false);
    }
  }

  async function placeStripeOrder(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setStatus(null);
    try {
      const prepareRes = await fetch('/api/storefront/checkout/prepare', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ gateway, cart: cart?.id, service_quote: pickup ? undefined : quote?.id, pickup, notes }),
      });
      const prepared = await prepareRes.json();
      if (!prepareRes.ok) throw new Error(prepared.error ?? 'Unable to prepare checkout.');

      if (prepared.clientSecret) {
        const stripe = await loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY ?? '');
        if (!stripe) throw new Error('Stripe is not configured.');
        const conf = await stripe.confirmPayment({
          clientSecret: prepared.clientSecret,
          redirect: 'if_required',
          confirmParams: { return_url: `${window.location.origin}/checkout` },
        });
        if (conf.error) throw new Error(conf.error.message);
      }

      const captureRes = await fetch('/api/storefront/checkout/capture', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token: prepared.token, notes }),
      });
      const captured = await captureRes.json();
      if (!captureRes.ok) throw new Error(captured.error ?? 'Unable to place order.');
      setOrder(captured.order);
      setStatus('Order placed.');
    } catch (err) {
      setStatus(err instanceof Error ? err.message : 'Unable to place order.');
    } finally {
      setLoading(false);
    }
  }

  // ── Order placed & awaiting M-Pesa payment ──
  if (order && isMpesa) {
    const paid = orderStatus?.paymentStatus === 'paid';
    const failed = orderStatus?.status === 'cancelled';
    return (
      <section className="container" style={{ padding: '48px 0', maxWidth: 520 }}>
        <h1>{paid ? 'Payment received' : failed ? 'Payment failed' : 'Awaiting payment'}</h1>
        {paid ? (
          <>
            <p className="muted">Your order has been confirmed.</p>
            {orderStatus?.mpesaRef && <p style={{ fontFamily: 'monospace', marginTop: 8 }}>M-Pesa ref: <strong>{orderStatus.mpesaRef}</strong></p>}
            <a className="button" href="/orders" style={{ display: 'inline-block', marginTop: 24 }}>View my orders</a>
          </>
        ) : failed ? (
          <>
            <p className="muted">The payment was cancelled or failed. Your reserved stock has been released.</p>
            <a className="button secondary" href="/checkout" style={{ display: 'inline-block', marginTop: 16 }}>Try again</a>
          </>
        ) : (
          <>
            <p className="muted">{status}</p>
            <div style={{ border: '1px solid var(--border)', borderRadius: 'var(--radius)', padding: 20, margin: '24px 0' }}>
              <p style={{ marginBottom: 8 }}><strong>Order total:</strong> {formatMoney(total, cart?.currency)}</p>
              <p style={{ marginBottom: 8 }}><strong>Reference:</strong> <span style={{ fontFamily: 'monospace' }}>{order.id}</span></p>
              {mpesaPhone && <p className="muted" style={{ fontSize: 14 }}>STK push sent to {mpesaPhone}. Approve on your phone.</p>}
            </div>
            <p className="muted" style={{ fontSize: 13 }}>
              <span style={{ display: 'inline-block', width: 10, height: 10, borderRadius: '50%', background: 'var(--primary, #4CAF50)', marginRight: 6, animation: 'pulse 1.5s infinite' }} />
              Waiting for payment confirmation…
            </p>
          </>
        )}
      </section>
    );
  }

  // ── Stripe/other order confirmed ──
  if (order && !isMpesa) {
    return (
      <section className="container" style={{ padding: '48px 0' }}>
        <h1>Order placed</h1>
        <p className="muted">Your order was created successfully.</p>
        <p><strong>Order:</strong> {order.id ?? order.public_id}</p>
        <a className="button" href="/orders" style={{ display: 'inline-block', marginTop: 16 }}>View my orders</a>
      </section>
    );
  }

  const onSubmit = isMpesa ? placeMpesaOrder : placeStripeOrder;

  return (
    <section className="container two-column" style={{ padding: '32px 0 56px' }}>
      <form className="stack" onSubmit={onSubmit}>
        <div>
          <h1>Checkout</h1>
          <p className="muted">Review your order and complete payment.</p>
        </div>

        {gateways.length > 1 && (
          <label className="stack" style={{ gap: 8 }}>
            <strong>Payment method</strong>
            <select className="field" value={gateway} onChange={(e) => setGateway(e.target.value)}>
              {gateways.map((gw) => (
                <option key={gw.id} value={gw.code ?? gw.id}>{gw.name ?? gw.code}</option>
              ))}
            </select>
          </label>
        )}

        <label style={{ display: 'flex', gap: 10, alignItems: 'center', cursor: 'pointer' }}>
          <input type="checkbox" checked={pickup} onChange={(e) => setPickup(e.target.checked)} style={{ width: 16, height: 16 }} />
          <span>Pickup order (no delivery)</span>
        </label>

        {!pickup && (
          <label className="stack" style={{ gap: 8 }}>
            <strong>Delivery address</strong>
            <input
              className="field"
              value={deliveryAddress}
              onChange={(e) => setDeliveryAddress(e.target.value)}
              placeholder="Street, area, city"
              onBlur={fetchQuote}
            />
          </label>
        )}

        {isMpesa && (
          <label className="stack" style={{ gap: 8 }}>
            <strong>M-Pesa phone number</strong>
            <input
              className="field"
              type="tel"
              value={mpesaPhone}
              onChange={(e) => setMpesaPhone(e.target.value)}
              placeholder="07XXXXXXXX or 254XXXXXXXXX"
            />
            <span className="muted" style={{ fontSize: 12 }}>We'll send an STK push to this number. Leave blank to pay manually.</span>
          </label>
        )}

        <label className="stack" style={{ gap: 8 }}>
          <strong>Order notes</strong>
          <textarea className="field" style={{ minHeight: 80, paddingTop: 10 }} value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Special instructions…" />
        </label>

        <Slot name="Checkout.paymentMethods" />

        <button className="button" disabled={loading || !cart?.items?.length}>
          {loading ? 'Placing order…' : isMpesa ? `Pay ${formatMoney(total, cart?.currency)} via M-Pesa` : 'Place order'}
        </button>

        {status && <p className="muted" role="status">{status}</p>}
      </form>

      <aside className="stack" style={{ border: '1px solid var(--border)', borderRadius: 'var(--radius)', padding: 16, height: 'max-content' }}>
        <strong>Order summary</strong>
        {cart?.items?.map((item) => (
          <p key={item.id} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 14 }}>
            <span>{item.name} × {item.quantity}</span>
            <span>{formatMoney(item.subtotal, cart.currency)}</span>
          </p>
        ))}
        <p style={{ display: 'flex', justifyContent: 'space-between' }}>
          <span>Subtotal</span><strong>{formatMoney(cart?.subtotal, cart?.currency)}</strong>
        </p>
        {!pickup && quote && (
          <p style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span>Delivery</span><strong>{formatMoney(quote.amount, quote.currency ?? cart?.currency)}</strong>
          </p>
        )}
        <p style={{ display: 'flex', justifyContent: 'space-between', borderTop: '1px solid var(--border)', paddingTop: 12 }}>
          <span>Total</span><strong>{formatMoney(total, cart?.currency)}</strong>
        </p>
        {!cart?.items?.length && <p className="muted" style={{ fontSize: 13 }}>Your cart is empty.</p>}
      </aside>
    </section>
  );
}
