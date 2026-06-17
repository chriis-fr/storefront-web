'use client';

import { useEffect, useMemo, useState } from 'react';
import { loadStripe } from '@stripe/stripe-js';
import type { Cart, Order, PaymentGateway, ServiceQuote } from '@/lib/types';
import { formatMoney } from '@/lib/format';
import { Slot } from '@/components/plugin-slot';

export function CheckoutPageClient() {
  const [cart, setCart] = useState<Cart | null>(null);
  const [gateways, setGateways] = useState<PaymentGateway[]>([]);
  const [gateway, setGateway] = useState('stripe');
  const [pickup, setPickup] = useState(false);
  const [origin, setOrigin] = useState('');
  const [destination, setDestination] = useState('');
  const [notes, setNotes] = useState('');
  const [quote, setQuote] = useState<ServiceQuote | null>(null);
  const [status, setStatus] = useState<string | null>(null);
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(false);

  const total = useMemo(() => (cart?.subtotal ?? 0) + (pickup ? 0 : quote?.amount ?? 0), [cart, pickup, quote]);

  useEffect(() => {
    Promise.all([fetch('/api/storefront/cart').then((response) => response.json()), fetch('/api/storefront/gateways').then((response) => response.json())]).then(([cartPayload, gatewaysPayload]) => {
      setCart(cartPayload.cart ?? null);
      setGateways(gatewaysPayload.gateways ?? []);
    });
  }, []);

  async function fetchQuote() {
    if (!cart?.id || pickup || !origin || !destination) {
      return;
    }

    const response = await fetch('/api/storefront/service-quote', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ cart: cart.id, origin, destination })
    });
    const payload = await response.json();
    setQuote(payload.quote ?? null);
    setStatus(payload.error ?? null);
  }

  async function placeOrder(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setStatus(null);

    try {
      const prepareResponse = await fetch('/api/storefront/checkout/prepare', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          gateway,
          cart: cart?.id,
          service_quote: pickup ? undefined : quote?.id,
          pickup,
          notes
        })
      });
      const prepared = await prepareResponse.json();

      if (!prepareResponse.ok) {
        throw new Error(prepared.error ?? 'Unable to prepare checkout.');
      }

      if (gateway === 'stripe' && prepared.clientSecret) {
        const stripe = await loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY ?? '');
        if (!stripe) {
          throw new Error('Stripe is not configured.');
        }
        const confirmation = await stripe.confirmPayment({
          clientSecret: prepared.clientSecret,
          redirect: 'if_required',
          confirmParams: {
            return_url: `${window.location.origin}/checkout`
          }
        });
        if (confirmation.error) {
          throw new Error(confirmation.error.message);
        }
      }

      const captureResponse = await fetch('/api/storefront/checkout/capture', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token: prepared.token, notes })
      });
      const captured = await captureResponse.json();

      if (!captureResponse.ok) {
        throw new Error(captured.error ?? 'Unable to place order.');
      }

      setOrder(captured.order);
      setStatus('Order placed.');
    } catch (error) {
      setStatus(error instanceof Error ? error.message : 'Unable to place order.');
    } finally {
      setLoading(false);
    }
  }

  if (order) {
    return (
      <section className="container" style={{ padding: '36px 0 56px' }}>
        <h1>Order placed</h1>
        <p className="muted">Your order was created successfully.</p>
        <p><strong>Order:</strong> {order.id ?? order.public_id}</p>
      </section>
    );
  }

  return (
    <section className="container two-column" style={{ padding: '32px 0 56px' }}>
      <form className="stack" onSubmit={placeOrder}>
        <div>
          <h1>Checkout</h1>
          <p className="muted">Choose delivery or pickup and place your order.</p>
        </div>
        <label style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <input type="checkbox" checked={pickup} onChange={(event) => setPickup(event.target.checked)} />
          Pickup order
        </label>
        {!pickup && (
          <>
            <label className="stack" style={{ gap: 8 }}>
              <strong>Origin store location</strong>
              <input className="field" value={origin} onChange={(event) => setOrigin(event.target.value)} placeholder="Store location public id" onBlur={fetchQuote} />
            </label>
            <label className="stack" style={{ gap: 8 }}>
              <strong>Delivery destination</strong>
              <input className="field" value={destination} onChange={(event) => setDestination(event.target.value)} placeholder="Place ID or address payload" onBlur={fetchQuote} />
            </label>
          </>
        )}
        <label className="stack" style={{ gap: 8 }}>
          <strong>Payment method</strong>
          <select className="field" value={gateway} onChange={(event) => setGateway(event.target.value)}>
            {(gateways.length ? gateways : [{ id: 'stripe', code: 'stripe', name: 'Stripe' }]).map((paymentGateway) => (
              <option key={paymentGateway.id} value={paymentGateway.code ?? paymentGateway.id}>{paymentGateway.name ?? paymentGateway.code}</option>
            ))}
          </select>
        </label>
        <Slot name="Checkout.paymentMethods" />
        <label className="stack" style={{ gap: 8 }}>
          <strong>Order notes</strong>
          <textarea className="field" style={{ minHeight: 100, paddingTop: 10 }} value={notes} onChange={(event) => setNotes(event.target.value)} />
        </label>
        <button className="button" disabled={loading || !cart?.items?.length}>
          {loading ? 'Placing order...' : 'Place order'}
        </button>
        {status && <p className="muted" role="status">{status}</p>}
      </form>
      <aside className="stack" style={{ border: '1px solid var(--border)', borderRadius: 'var(--radius)', padding: 16, height: 'max-content' }}>
        <strong>Order summary</strong>
        <p style={{ display: 'flex', justifyContent: 'space-between' }}><span>Subtotal</span><strong>{formatMoney(cart?.subtotal, cart?.currency)}</strong></p>
        {!pickup && <p style={{ display: 'flex', justifyContent: 'space-between' }}><span>Delivery</span><strong>{quote ? formatMoney(quote.amount, quote.currency ?? cart?.currency) : 'Quote required'}</strong></p>}
        <p style={{ display: 'flex', justifyContent: 'space-between', borderTop: '1px solid var(--border)', paddingTop: 12 }}><span>Total</span><strong>{formatMoney(total, cart?.currency)}</strong></p>
      </aside>
    </section>
  );
}
