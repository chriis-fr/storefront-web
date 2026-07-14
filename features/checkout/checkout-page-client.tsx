'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { loadStripe } from '@stripe/stripe-js';
import type { Cart, Order, PaymentGateway } from '@/lib/types';
import { formatMoney } from '@/lib/format';
import { Slot } from '@/components/plugin-slot';
import { AuthInline } from '@/features/customer/auth-inline';
import { ConsentChecks } from '@/features/customer/consent';
import { AddressAutocomplete, type AddressValue } from '@/features/checkout/address-autocomplete';
import { cacheGet, cacheSet, cacheAgeMs, cacheClear } from '@/lib/client-cache';

type OrderStatus = { id: string; status: string; paymentStatus: string; paymentMethod?: string | null; total: number; currency: string; mpesaRef: string | null; paymentRef?: string | null; reference?: string | null; virtualAccount?: Record<string, unknown> | null };

// Persisted so a page refresh mid-payment restores the "awaiting payment" screen
// and resumes polling for THIS order — the webhook can still settle it server-side.
const PENDING_ORDER_KEY = 'pending-order';
type PendingOrder = { order: Order; gateway: string };
function savePendingOrder(order: Order, gateway: string) {
  try { localStorage.setItem(PENDING_ORDER_KEY, JSON.stringify({ order, gateway })); } catch { /* storage unavailable */ }
}
function loadPendingOrder(): PendingOrder | null {
  try { const raw = localStorage.getItem(PENDING_ORDER_KEY); return raw ? JSON.parse(raw) as PendingOrder : null; } catch { return null; }
}
function clearPendingOrder() {
  try { localStorage.removeItem(PENDING_ORDER_KEY); } catch { /* storage unavailable */ }
}

export function CheckoutPageClient() {
  const [cart, setCart]       = useState<Cart | null>(null);
  const [gateways, setGateways] = useState<PaymentGateway[]>([]);
  const [gateway, setGateway] = useState('stripe');
  const [pickup, setPickup]   = useState(true);
  const [mpesaPhone, setMpesaPhone] = useState('');
  const [email, setEmail]     = useState('');
  const [customerName, setCustomerName] = useState('');
  const [delivery, setDelivery] = useState<AddressValue>({ text: '' });
  const [notes, setNotes]     = useState('');
  const [status, setStatus]   = useState<string | null>(null);
  const [order, setOrder]     = useState<Order | null>(null);
  const [orderStatus, setOrderStatus] = useState<OrderStatus | null>(null);
  const [loading, setLoading] = useState(false);
  const [polling, setPolling] = useState(false);
  const [authed, setAuthed]   = useState<boolean | null>(null);
  const [showAuth, setShowAuth] = useState(false);
  const [age, setAge]         = useState(false);
  // Age already confirmed on the account (at sign-up) — no need to re-ask at checkout.
  const [ageOnFile, setAgeOnFile] = useState(false);

  const isMpesa = gateway === 'mpesa';
  // Delivery logistics/fees are handled outside the storefront (POS / Fleetbase).
  // Here we only capture the address; the order total is the cart subtotal.
  const total = cart?.subtotal ?? 0;

  // ── "Awaiting payment" screen, decoupled from the selector ──
  // Once an order is placed (or restored after a refresh) the awaiting screen is
  // driven by the ORDER itself, not the payment-method buttons — so it survives a
  // reload even though the cart is cleared and the selector may have reset.
  const placedMeta = order?.meta as
    | { total?: number; currency?: string; payment?: { method?: string; virtualAccount?: Record<string, unknown> | null; reference?: string; error?: string } }
    | undefined;
  const placedMethod = placedMeta?.payment?.method ?? orderStatus?.paymentMethod ?? gateway;
  const placedIsMpesa = placedMethod === 'mpesa';
  const placedTotal = orderStatus?.total ?? placedMeta?.total ?? total;
  const placedCurrency = orderStatus?.currency ?? placedMeta?.currency ?? cart?.currency;

  useEffect(() => {
    const applyMe = (cust: { email?: string; name?: string; mpesaNumber?: string; ageConfirmed?: boolean } | null | undefined) => {
      setAuthed(!!cust);
      if (cust?.email) setEmail(cust.email);
      if (cust?.name) setCustomerName(cust.name);
      // Pre-fill the STK prompt number from the customer's saved M-Pesa number.
      if (cust?.mpesaNumber) setMpesaPhone(cust.mpesaNumber);
      // Age was confirmed at sign-up — carry it forward so we never re-ask.
      if (cust?.ageConfirmed) { setAgeOnFile(true); setAge(true); }
    };
    const applyGateways = (gws: PaymentGateway[]) => {
      setGateways(gws);
      if (gws.length) setGateway(gws[0].code ?? gws[0].id);
    };

    // Restore an in-flight payment after a refresh: rebuild the awaiting screen
    // from the saved order and re-verify against the API (which the webhook keeps
    // authoritative). If it already resolved while away, we reflect that at once.
    const pending = loadPendingOrder();
    if (pending?.order?.id) {
      setOrder(pending.order);
      setGateway(pending.gateway);
      setPolling(true);
      fetch(`/api/storefront/orders/${pending.order.id}/status`)
        .then((r) => (r.ok ? r.json() : null)).catch(() => null)
        .then((data: OrderStatus | null) => {
          if (!data) return;
          setOrderStatus(data);
          if (data.paymentStatus === 'paid' || data.status === 'cancelled' || data.paymentStatus === 'failed') {
            setPolling(false);
            clearPendingOrder();
          }
        });
    }

    // Profile + gateways come from cache instantly; the cart is always fresh.
    const meCached = cacheGet<{ customer?: { email?: string; name?: string; mpesaNumber?: string; ageConfirmed?: boolean } }>('auth-me');
    if (meCached?.customer) applyMe(meCached.customer);
    const gwCached = cacheGet<PaymentGateway[]>('gateways');
    if (gwCached) applyGateways(gwCached);

    fetch('/api/storefront/cart').then((r) => r.json()).then((d) => setCart(d.cart ?? null)).catch(() => {});

    if (!gwCached || cacheAgeMs('gateways') > 30 * 60_000) {
      fetch('/api/storefront/gateways').then((r) => r.json())
        .then((d) => { const gws: PaymentGateway[] = d.gateways ?? []; applyGateways(gws); cacheSet('gateways', gws); })
        .catch(() => {});
    }
    if (!meCached?.customer || cacheAgeMs('auth-me') > 10 * 60_000) {
      fetch('/api/storefront/auth/me').then((r) => (r.ok ? r.json() : null)).catch(() => null)
        .then((meData) => { applyMe(meData?.customer); if (meData?.customer) cacheSet('auth-me', meData); });
    }
  }, []);

  // Poll order status after M-Pesa order placed
  useEffect(() => {
    if (!order?.id || !polling) return;
    const interval = setInterval(async () => {
      const res = await fetch(`/api/storefront/orders/${order.id}/status`).catch(() => null);
      if (!res?.ok) return;
      const data: OrderStatus = await res.json();
      setOrderStatus(data);
      if (data.paymentStatus === 'paid' || data.status === 'cancelled' || data.paymentStatus === 'failed') {
        setPolling(false);
        clearPendingOrder(); // resolved — no need to restore on future visits
        clearInterval(interval);
      }
    }, 3000);
    return () => clearInterval(interval);
  }, [order, polling]);

  async function placeChainsOrder() {
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
          paymentMethod: gateway,
          mpesaPhone: isMpesa ? mpesaPhone.trim() : undefined,
          email: gateway === 'bank' ? (email.trim() || undefined) : undefined,
          customerName: customerName.trim() || undefined,
          ageConfirmed: age,
          deliveryAddress: !pickup && delivery.text.trim()
            ? {
                line1: delivery.text.trim(),
                ...(delivery.lat != null && delivery.lon != null
                  ? { lat: delivery.lat, lng: delivery.lon, mapUrl: `https://maps.google.com/?q=${delivery.lat},${delivery.lon}` }
                  : {}),
              }
            : undefined,
          notes: notes.trim() || undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? 'Unable to place order.');
      setOrder(data.order);
      window.dispatchEvent(new Event('cart:updated')); // cart cleared server-side
      cacheClear('orders'); cacheClear('auth-me'); // new order + updated payment profile
      if (isMpesa) {
        setPolling(true);
        savePendingOrder(data.order, gateway); // survive a refresh while awaiting payment
        setStatus(mpesaPhone ? 'STK push sent — check your phone for the M-Pesa prompt.' : 'Order placed. Complete payment via M-Pesa using the details below.');
      } else if (gateway === 'bank') {
        setPolling(true); // wait for the bank transfer to land
        savePendingOrder(data.order, gateway); // survive a refresh while awaiting payment
        setStatus('Order placed. Complete the bank transfer using the details below.');
      } else {
        setStatus('Order placed.');
      }
    } catch (err) {
      setStatus(err instanceof Error ? err.message : 'Unable to place order.');
    } finally {
      setLoading(false);
    }
  }

  async function placeStripeOrder() {
    setLoading(true);
    setStatus(null);
    try {
      const prepareRes = await fetch('/api/storefront/checkout/prepare', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ gateway, cart: cart?.id, pickup, notes }),
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
      window.dispatchEvent(new Event('cart:updated')); // cart cleared server-side
      cacheClear('orders'); cacheClear('auth-me'); // new order + updated payment profile
      setStatus('Order placed.');
    } catch (err) {
      setStatus(err instanceof Error ? err.message : 'Unable to place order.');
    } finally {
      setLoading(false);
    }
  }

  // ── Order placed & awaiting M-Pesa payment ──
  if (order && placedIsMpesa) {
    const paid = orderStatus?.paymentStatus === 'paid';
    const failed = orderStatus?.status === 'cancelled' || orderStatus?.paymentStatus === 'failed';
    return (
      <section className="container" style={{ padding: '48px 0', maxWidth: 520 }}>
        <h1>{paid ? 'Payment received' : failed ? 'Payment failed' : 'Awaiting payment'}</h1>
        {paid ? (
          <>
            <p className="muted">Your order has been confirmed.</p>
            {orderStatus?.mpesaRef && <p style={{ fontFamily: 'monospace', marginTop: 8 }}>M-Pesa ref: <strong>{orderStatus.mpesaRef}</strong></p>}
            <Link className="button" href="/orders" style={{ display: 'inline-block', marginTop: 24 }}>View my orders</Link>
          </>
        ) : failed ? (
          <>
            <p className="muted">The payment was cancelled or failed. Your reserved stock has been released.</p>
            <Link className="button secondary" href="/checkout" style={{ display: 'inline-block', marginTop: 16 }}>Try again</Link>
          </>
        ) : (
          <>
            <p className="muted">{status ?? 'Complete the M-Pesa prompt on your phone to pay for this order.'}</p>
            <div style={{ border: '1px solid var(--border)', borderRadius: 'var(--radius)', padding: 20, margin: '24px 0' }}>
              <p style={{ marginBottom: 8 }}><strong>Order total:</strong> {formatMoney(placedTotal, placedCurrency)}</p>
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

  // ── Bank transfer — show the virtual account to pay into ──
  if (order && placedMethod === 'bank') {
    const pay = (order.meta as { payment?: { virtualAccount?: Record<string, unknown> | null; error?: string; reference?: string } } | undefined)?.payment;
    // Prefer the API (authoritative, survives a refresh) then the placed order.
    const va = ((orderStatus?.virtualAccount ?? pay?.virtualAccount) ?? null) as { bankName?: string; accountNumber?: string; expiresAt?: string } | null;
    const reference = orderStatus?.reference ?? pay?.reference ?? null;
    const paid = orderStatus?.paymentStatus === 'paid';
    const failed = orderStatus?.status === 'cancelled' || orderStatus?.paymentStatus === 'failed';
    return (
      <section className="container" style={{ padding: '48px 0', maxWidth: 560 }}>
        <h1>{paid ? 'Payment received' : failed ? 'Payment expired' : 'Complete your bank transfer'}</h1>
        {paid ? (
          <>
            <p className="muted">Your order has been confirmed and paid.</p>
            {orderStatus?.paymentRef && <p style={{ fontFamily: 'monospace', marginTop: 8 }}>Reference: <strong>{orderStatus.paymentRef}</strong></p>}
            <Link className="button" href="/orders" style={{ display: 'inline-block', marginTop: 24 }}>View my orders</Link>
          </>
        ) : failed ? (
          <>
            <p className="muted">We didn’t receive your transfer in time, so this order was cancelled and the items released. You can place it again.</p>
            <Link className="button secondary" href="/checkout" style={{ display: 'inline-block', marginTop: 16 }}>Try again</Link>
          </>
        ) : pay?.error ? (
          <>
            <p style={{ color: 'var(--error)' }}>{pay.error}</p>
            <Link className="button secondary" href="/checkout" style={{ display: 'inline-block', marginTop: 16 }}>Try again</Link>
          </>
        ) : va && (va.accountNumber || va.bankName) ? (
          <>
            <p className="muted">Send exactly <strong>{formatMoney(placedTotal, placedCurrency)}</strong> to the account below. We’ll confirm automatically once it lands.</p>
            <div style={{ border: '1px solid var(--border)', borderRadius: 'var(--radius)', padding: 20, margin: '20px 0', background: 'var(--surface)' }} className="stack">
              {va.bankName && <p style={{ display: 'flex', justifyContent: 'space-between', margin: 0 }}><span className="muted">Bank</span><strong>{va.bankName}</strong></p>}
              {va.accountNumber && <p style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', margin: 0 }}><span className="muted">Account number</span><span style={{ display: 'inline-flex', alignItems: 'center' }}><strong style={{ fontFamily: 'monospace' }}>{va.accountNumber}</strong><CopyButton value={va.accountNumber} label="account number" /></span></p>}
              <p style={{ display: 'flex', justifyContent: 'space-between', margin: 0 }}><span className="muted">Amount</span><strong>{formatMoney(placedTotal, placedCurrency)}</strong></p>
              {reference && <p style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', margin: 0 }}><span className="muted">Reference</span><span style={{ display: 'inline-flex', alignItems: 'center' }}><strong style={{ fontFamily: 'monospace' }}>{reference}</strong><CopyButton value={reference} label="reference" /></span></p>}
              {va.expiresAt && <p className="muted" style={{ margin: 0, fontSize: 12 }}>Expires {new Date(va.expiresAt).toLocaleString()}</p>}
            </div>
            <CopyAllButton
              value={[
                va.bankName ? `Bank: ${va.bankName}` : '',
                va.accountNumber ? `Account number: ${va.accountNumber}` : '',
                `Amount: ${formatMoney(placedTotal, placedCurrency)}`,
                reference ? `Reference: ${reference}` : '',
              ].filter(Boolean).join('\n')}
            />
            <p className="muted" style={{ fontSize: 13 }}>
              <span style={{ display: 'inline-block', width: 10, height: 10, borderRadius: '50%', background: 'var(--primary)', marginRight: 6, animation: 'pulse 1.5s infinite' }} />
              Waiting for your transfer…
            </p>
          </>
        ) : (
          <>
            <p className="muted">Your order is placed. {status ?? 'The store will confirm your payment shortly.'}</p>
            <Link className="button" href="/orders" style={{ display: 'inline-block', marginTop: 24 }}>View my orders</Link>
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
        <Link className="button" href="/orders" style={{ display: 'inline-block', marginTop: 16 }}>View my orders</Link>
      </section>
    );
  }

  // Chains handles mpesa/cash/bitcoin/card via the orders endpoint; only a real
  // Stripe gateway (Fleetbase mode) uses the Stripe prepare/capture path.
  const proceed = () => (gateway === 'stripe' ? placeStripeOrder() : placeChainsOrder());

  // Gate: signed-in customers place the order directly; guests get an inline
  // sign-in/up card first, then the same order continues automatically.
  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (authed === false) { setShowAuth(true); return; }
    proceed();
  }

  function handleAuthed() {
    setAuthed(true);
    setShowAuth(false);
    // An account can't exist without confirming 18+ at sign-up, so don't re-ask.
    setAgeOnFile(true);
    setAge(true);
    proceed();
  }

  return (
    <section className="container two-column" style={{ padding: '32px 0 56px' }}>
      <form className="stack" onSubmit={handleSubmit}>
        <div>
          <h1>Checkout</h1>
          <p className="muted">Review your order and complete payment.</p>
        </div>

        <label className="stack" style={{ gap: 8 }}>
          <strong>Your name</strong>
          <input className="field" value={customerName} onChange={(e) => setCustomerName(e.target.value)} placeholder="Full name" autoComplete="name" />
        </label>

        {gateways.length > 0 && (
          <div className="stack" style={{ gap: 8 }}>
            <strong>Payment method</strong>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              {gateways.map((gw) => {
                const code = gw.code ?? gw.id;
                const active = gateway === code;
                return (
                  <button
                    type="button"
                    key={gw.id}
                    onClick={() => setGateway(code)}
                    className={`button ${active ? '' : 'secondary'}`}
                    style={{ minWidth: 130 }}
                  >
                    {gw.name ?? gw.code}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        <label style={{ display: 'flex', gap: 10, alignItems: 'center', cursor: 'pointer' }}>
          <input type="checkbox" checked={pickup} onChange={(e) => setPickup(e.target.checked)} style={{ width: 16, height: 16 }} />
          <span>Pickup order (no delivery)</span>
        </label>

        {!pickup && (
          <div className="stack" style={{ gap: 8 }}>
            <strong>Delivery address</strong>
            <AddressAutocomplete value={delivery} onChange={setDelivery} />
            <span className="muted" style={{ fontSize: 12 }}>Search a place or use your location. Delivery is arranged by the store after your order.</span>
          </div>
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

        {gateway === 'bank' && (
          <p className="muted" style={{ fontSize: 13, margin: 0 }}>
            You’ll get bank transfer details right after placing the order — we confirm automatically once it lands.
          </p>
        )}

        {!isMpesa && gateway !== 'stripe' && gateway !== 'bank' && (
          <p className="muted" style={{ fontSize: 13, margin: 0 }}>
            {gateway === 'cash'
              ? 'Pay with cash when you collect your order or on delivery.'
              : gateway === 'bank'
              ? 'You’ll receive bank transfer details to complete your payment. It’s collected securely and settled to the store.'
              : gateway === 'bitcoin'
              ? 'You’ll receive Bitcoin payment details after placing the order.'
              : gateway === 'card'
              ? 'Card payment will be arranged by the store.'
              : 'The store will confirm your payment after you place the order.'}
          </p>
        )}

        <label className="stack" style={{ gap: 8 }}>
          <strong>Order notes</strong>
          <textarea className="field" style={{ minHeight: 80, paddingTop: 10 }} value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Special instructions…" />
        </label>

        <Slot name="Checkout.paymentMethods" />

        {showAuth && authed === false ? (
          <AuthInline onAuthed={handleAuthed} subtitle="Sign in or create an account to place your order. Your cart is saved." />
        ) : (
          <>
            {!ageOnFile && (
              <div style={{ borderTop: '1px solid var(--border)', paddingTop: 12 }}>
                <ConsentChecks age={age} setAge={setAge} terms setTerms={() => {}} showTerms={false} />
              </div>
            )}
            <button className="button" disabled={loading || !cart?.items?.length || !age}>
              {loading
                ? 'Placing order…'
                : authed === false
                ? 'Sign in & place order'
                : isMpesa
                ? `Pay ${formatMoney(total, cart?.currency)} via M-Pesa`
                : 'Place order'}
            </button>
          </>
        )}

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
        <p style={{ display: 'flex', justifyContent: 'space-between', borderTop: '1px solid var(--border)', paddingTop: 12 }}>
          <span>Total</span><strong>{formatMoney(total, cart?.currency)}</strong>
        </p>
        {!cart?.items?.length && <p className="muted" style={{ fontSize: 13 }}>Your cart is empty.</p>}
      </aside>
    </section>
  );
}

/** Inline "Copy" button that copies a value to the clipboard and briefly confirms. */
function CopyButton({ value, label }: { value: string; label?: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <button
      type="button"
      aria-label={`Copy ${label ?? 'value'}`}
      onClick={async () => {
        try {
          await navigator.clipboard.writeText(value);
          setCopied(true);
          setTimeout(() => setCopied(false), 1500);
        } catch { /* clipboard unavailable */ }
      }}
      style={{ background: 'none', border: 'none', cursor: 'pointer', color: copied ? 'var(--success, green)' : 'var(--primary)', fontSize: 12, fontWeight: 600, padding: '0 0 0 10px', whiteSpace: 'nowrap' }}
    >
      {copied ? 'Copied ✓' : 'Copy'}
    </button>
  );
}

/** Full-width button that copies the whole set of bank details at once. */
function CopyAllButton({ value }: { value: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <button
      type="button"
      className="button secondary"
      onClick={async () => {
        try {
          await navigator.clipboard.writeText(value);
          setCopied(true);
          setTimeout(() => setCopied(false), 1500);
        } catch { /* clipboard unavailable */ }
      }}
      style={{ width: '100%' }}
    >
      {copied ? 'Copied ✓' : 'Copy bank details'}
    </button>
  );
}
