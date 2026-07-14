'use client';

import Link from 'next/link';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { formatMoney } from '@/lib/format';
import { AddressAutocomplete, type AddressValue } from '@/features/checkout/address-autocomplete';
import { ConsentChecks } from '@/features/customer/consent';
import { cacheGet, cacheSet, cacheClear, cacheAgeMs } from '@/lib/client-cache';

const ME_KEY = 'auth-me';
const ORDERS_KEY = 'orders';
const ME_TTL = 10 * 60_000;

type Customer = {
  id: string; name?: string | null; email?: string | null; phone?: string | null;
  addresses?: Array<Record<string, unknown>>;
  mpesaNumber?: string | null;
  lastPaymentMethod?: string | null; lastPaymentPhone?: string | null;
  lastDeliveryAddress?: Record<string, unknown> | null;
  createdAt?: string | null;
};
type OrderRow = {
  id: string; status: string; created_at?: string;
  meta?: { paymentStatus?: string; paymentMethod?: string | null; total?: number; currency?: string; isPickup?: boolean };
};
type Tab = 'login' | 'register';
type AccTab = 'details' | 'orders' | 'payment';

const addrText = (a: Record<string, unknown>) =>
  String(a.line1 ?? a.address ?? a.text ?? (Object.keys(a).length ? JSON.stringify(a) : ''));

// Where to send the customer after signing in — a ?next= target, else browse.
function nextTarget(): string {
  if (typeof window === 'undefined') return '/search';
  const n = new URLSearchParams(window.location.search).get('next');
  return n && n.startsWith('/') ? n : '/search';
}

export function AccountPageClient() {
  const router = useRouter();
  const [tab, setTab] = useState<Tab>('login');
  const [name, setName] = useState('');
  const [identity, setIdentity] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [age, setAge] = useState(false);
  const [terms, setTerms] = useState(false);
  const [status, setStatus] = useState<{ ok: boolean; message: string } | null>(null);
  const [loading, setLoading] = useState(false);
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [checking, setChecking] = useState(true);
  const [editingName, setEditingName] = useState(false);
  const [nameInput, setNameInput] = useState('');
  const [savingName, setSavingName] = useState(false);
  const [accTab, setAccTab] = useState<AccTab>('details');
  const [orders, setOrders] = useState<OrderRow[]>([]);
  const [ordersLoading, setOrdersLoading] = useState(false);
  const [mpesaInput, setMpesaInput] = useState('');
  const [savingMpesa, setSavingMpesa] = useState(false);
  const [newAddr, setNewAddr] = useState<AddressValue>({ text: '' });
  const [savingAddr, setSavingAddr] = useState(false);

  // Update state + cache together so a reload / other page reuses it (no refetch).
  const persistCustomer = (next: Customer | null) => {
    setCustomer(next);
    if (next) cacheSet(ME_KEY, { customer: next }); else cacheClear(ME_KEY);
  };

  // Add / remove a saved delivery address via the profile PATCH.
  async function patchAddresses(patch: Record<string, unknown>, okMsg: string) {
    const res = await fetch('/api/storefront/auth/me', {
      method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(patch),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error ?? 'Could not save.');
    if (data.customer && customer) persistCustomer({ ...customer, addresses: data.customer.addresses ?? [] });
    setStatus({ ok: true, message: okMsg });
  }

  async function saveAddress() {
    if (!newAddr.text.trim()) return;
    setSavingAddr(true);
    try {
      const address: Record<string, unknown> = { line1: newAddr.text.trim() };
      if (newAddr.lat != null && newAddr.lon != null) { address.lat = newAddr.lat; address.lng = newAddr.lon; }
      await patchAddresses({ address }, 'Address saved.');
      setNewAddr({ text: '' });
    } catch (err) {
      setStatus({ ok: false, message: err instanceof Error ? err.message : 'Could not save address.' });
    } finally {
      setSavingAddr(false);
    }
  }

  async function removeAddress(id: string) {
    try {
      await patchAddresses({ removeAddressId: id }, 'Address removed.');
    } catch (err) {
      setStatus({ ok: false, message: err instanceof Error ? err.message : 'Could not remove address.' });
    }
  }

  async function saveMpesaNumber(value: string | null) {
    setSavingMpesa(true);
    try {
      const res = await fetch('/api/storefront/auth/me', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mpesaNumber: value }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? 'Could not save.');
      const saved = (data.customer?.mpesaNumber ?? null) as string | null;
      if (customer) persistCustomer({ ...customer, mpesaNumber: saved });
      setMpesaInput(saved ?? '');
      setStatus({ ok: true, message: value ? 'M-Pesa number saved.' : 'M-Pesa number removed.' });
    } catch (err) {
      setStatus({ ok: false, message: err instanceof Error ? err.message : 'Could not save number.' });
    } finally {
      setSavingMpesa(false);
    }
  }

  // Load order history once we know who's signed in — cached (short TTL).
  useEffect(() => {
    if (!customer?.id) return;
    const cached = cacheGet<OrderRow[]>(ORDERS_KEY);
    if (cached) { setOrders(cached); setOrdersLoading(false); }
    if (cacheAgeMs(ORDERS_KEY) <= 60_000) { setOrdersLoading(false); return; }
    setOrdersLoading(!cached);
    fetch('/api/storefront/orders')
      .then((r) => (r.ok ? r.json() : { orders: [] }))
      .then((d) => { const list: OrderRow[] = Array.isArray(d.orders) ? d.orders : []; setOrders(list); cacheSet(ORDERS_KEY, list); })
      .catch(() => {})
      .finally(() => setOrdersLoading(false));
  }, [customer?.id]);

  async function saveName() {
    setSavingName(true);
    try {
      const res = await fetch('/api/storefront/auth/me', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: nameInput.trim() }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? 'Could not save.');
      setCustomer((cur) => (cur ? { ...cur, name: nameInput.trim() } : cur));
      setEditingName(false);
      setStatus({ ok: true, message: 'Name saved.' });
    } catch (err) {
      setStatus({ ok: false, message: err instanceof Error ? err.message : 'Could not save name.' });
    } finally {
      setSavingName(false);
    }
  }

  useEffect(() => {
    // Show the cached profile instantly; only hit the network if it's stale.
    const cached = cacheGet<{ customer: Customer }>(ME_KEY);
    if (cached?.customer) {
      setCustomer(cached.customer);
      setMpesaInput(cached.customer.mpesaNumber ?? '');
      setChecking(false);
      if (cacheAgeMs(ME_KEY) <= ME_TTL) return; // fresh — no refetch
    }
    fetch('/api/storefront/auth/me')
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (data?.customer) { setCustomer(data.customer); setMpesaInput(data.customer.mpesaNumber ?? ''); cacheSet(ME_KEY, data); }
        else { cacheClear(ME_KEY); }
      })
      .catch(() => {})
      .finally(() => setChecking(false));
  }, []);

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setStatus(null);
    try {
      const res = await fetch('/api/storefront/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ identity, password }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? 'Unable to sign in.');
      setCustomer(data.customer);
      // Drop any stale cache so the next visit fetches the full, current profile.
      cacheClear(ME_KEY); cacheClear(ORDERS_KEY);
      setStatus({ ok: true, message: `Welcome back${data.customer?.name ? ', ' + data.customer.name : ''}!` });
      router.push(nextTarget());
    } catch (err) {
      setStatus({ ok: false, message: err instanceof Error ? err.message : 'Sign in failed.' });
    } finally {
      setLoading(false);
    }
  }

  async function handleRegister(e: React.FormEvent) {
    e.preventDefault();
    if (password !== confirmPassword) {
      setStatus({ ok: false, message: 'Passwords do not match.' });
      return;
    }
    if (!age || !terms) {
      setStatus({ ok: false, message: 'Please confirm you are 18+ and accept the terms.' });
      return;
    }
    setLoading(true);
    setStatus(null);
    try {
      const isEmail = identity.includes('@');
      const res = await fetch('/api/storefront/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...(isEmail ? { email: identity } : { phone: identity }), password, name: name.trim() || undefined, ageConfirmed: age, acceptedTerms: terms }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? 'Unable to create account.');
      setCustomer(data.customer);
      cacheClear(ME_KEY); cacheClear(ORDERS_KEY);
      setStatus({ ok: true, message: 'Account created! Taking you to browse…' });
      router.push(nextTarget());
    } catch (err) {
      setStatus({ ok: false, message: err instanceof Error ? err.message : 'Registration failed.' });
    } finally {
      setLoading(false);
    }
  }

  async function handleSignOut() {
    await fetch('/api/storefront/auth/logout', { method: 'POST' });
    persistCustomer(null);           // clears the cached profile
    cacheClear(ORDERS_KEY);
    setStatus({ ok: true, message: 'Signed out.' });
  }

  if (checking) {
    return (
      <section className="container" style={{ padding: '48px 0' }}>
        <p className="muted">Loading…</p>
      </section>
    );
  }

  if (customer) {
    const tabBtn = (active: boolean): React.CSSProperties => ({
      padding: '8px 16px', border: 'none', background: 'transparent', cursor: 'pointer',
      fontWeight: active ? 700 : 400, borderBottom: active ? '2px solid var(--primary)' : '2px solid transparent',
      marginBottom: -1, fontSize: 15, color: 'inherit',
    });
    const row = { display: 'flex', justifyContent: 'space-between', gap: 12, margin: 0 } as React.CSSProperties;
    const methodsUsed = Array.from(new Set(orders.map((o) => o.meta?.paymentMethod).filter(Boolean))) as string[];

    return (
      <section className="container" style={{ padding: '40px 0 56px', maxWidth: 640 }}>
        <div className="section-title">
          <div>
            <h1>My account</h1>
            <p className="muted">{customer.name || customer.email || customer.phone}</p>
          </div>
          <button className="button secondary" onClick={handleSignOut}>Sign out</button>
        </div>

        {/* Tabs */}
        <div style={{ display: 'flex', gap: 4, borderBottom: '1px solid var(--border)', marginBottom: 20 }}>
          {(['details', 'orders', 'payment'] as const).map((t) => (
            <button key={t} type="button" style={tabBtn(accTab === t)} onClick={() => setAccTab(t)}>
              {t === 'details' ? 'Details' : t === 'orders' ? 'Orders' : 'Payment'}
            </button>
          ))}
        </div>

        {/* ── Details ── */}
        {accTab === 'details' && (
          <div className="stack" style={{ gap: 16 }}>
            <div style={{ border: '1px solid var(--border)', borderRadius: 'var(--radius)', padding: 18 }} className="stack">
              {editingName ? (
                <div className="stack" style={{ gap: 8 }}>
                  <strong style={{ fontSize: 14 }}>Your name</strong>
                  <input className="field" value={nameInput} onChange={(e) => setNameInput(e.target.value)} placeholder="Full name" autoFocus />
                  <div style={{ display: 'flex', gap: 8 }}>
                    <button className="button" onClick={saveName} disabled={savingName}>{savingName ? 'Saving…' : 'Save'}</button>
                    <button className="button secondary" type="button" onClick={() => setEditingName(false)} disabled={savingName}>Cancel</button>
                  </div>
                </div>
              ) : (
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
                  <div>
                    <strong>{customer.name || 'No name set'}</strong>
                    {customer.email && <p className="muted" style={{ margin: '2px 0 0', fontSize: 14 }}>{customer.email}</p>}
                    {customer.phone && <p className="muted" style={{ margin: '2px 0 0', fontSize: 14 }}>{customer.phone}</p>}
                    {customer.createdAt && <p className="muted" style={{ margin: '6px 0 0', fontSize: 12 }}>Member since {new Date(customer.createdAt).toLocaleDateString()}</p>}
                  </div>
                  <button type="button" className="button ghost" style={{ minHeight: 34, padding: '0 10px' }}
                    onClick={() => { setNameInput(customer.name ?? ''); setEditingName(true); }}>
                    {customer.name ? 'Edit name' : 'Add your name'}
                  </button>
                </div>
              )}
            </div>

            <div>
              <p className="muted" style={{ margin: '0 0 8px', fontSize: 12, textTransform: 'uppercase', letterSpacing: 0.5 }}>Saved addresses</p>
              <div className="stack" style={{ gap: 8 }}>
                {(customer.addresses ?? []).map((a, i) => {
                  const id = typeof a._id === 'string' ? a._id : null;
                  return (
                    <div key={id ?? i} style={{ border: '1px solid var(--border)', borderRadius: 'var(--radius)', padding: '10px 14px', fontSize: 14, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10 }}>
                      <span>{addrText(a)}</span>
                      {id && (
                        <button type="button" className="button ghost" style={{ minHeight: 30, padding: '0 8px', fontSize: 13, color: 'var(--error)' }} onClick={() => removeAddress(id)}>Remove</button>
                      )}
                    </div>
                  );
                })}
                {(customer.addresses?.length ?? 0) === 0 && <p className="muted" style={{ margin: 0, fontSize: 14 }}>No saved addresses yet.</p>}

                {/* Add a new address */}
                <div className="stack" style={{ gap: 8, borderTop: '1px solid var(--border)', paddingTop: 12, marginTop: 4 }}>
                  <strong style={{ fontSize: 14 }}>Add an address</strong>
                  <AddressAutocomplete value={newAddr} onChange={setNewAddr} placeholder="Search a place or use your location" />
                  <button type="button" className="button" style={{ width: 'max-content' }} onClick={saveAddress} disabled={savingAddr || !newAddr.text.trim()}>
                    {savingAddr ? 'Saving…' : 'Save address'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ── Orders ── */}
        {accTab === 'orders' && (
          <div className="stack" style={{ gap: 10 }}>
            {ordersLoading ? (
              <p className="muted">Loading orders…</p>
            ) : orders.length === 0 ? (
              <div style={{ border: '1px solid var(--border)', borderRadius: 'var(--radius)', padding: 24, textAlign: 'center' }} className="stack">
                <p className="muted" style={{ margin: 0 }}>You haven’t placed any orders yet.</p>
                <Link className="button" href="/search" style={{ justifySelf: 'center' }}>Start shopping</Link>
              </div>
            ) : (
              orders.map((o) => {
                const paid = o.meta?.paymentStatus === 'paid';
                const cancelled = o.status === 'cancelled' || o.meta?.paymentStatus === 'failed';
                return (
                  <Link key={o.id} href={`/orders/${o.id}`} style={{ border: '1px solid var(--border)', borderRadius: 'var(--radius)', padding: 14, display: 'block' }}>
                    <div style={row}>
                      <strong>{formatMoney(o.meta?.total ?? 0, o.meta?.currency)}</strong>
                      <span style={{ fontSize: 12, fontWeight: 700, textTransform: 'capitalize', color: paid ? 'var(--success)' : cancelled ? 'var(--error)' : 'var(--warning)' }}>
                        {paid ? 'Paid' : cancelled ? 'Cancelled' : 'Pending'}
                      </span>
                    </div>
                    <div className="muted" style={{ marginTop: 4, fontSize: 13, display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                      {o.created_at && <span>{new Date(o.created_at).toLocaleString()}</span>}
                      {o.meta?.paymentMethod && <span style={{ textTransform: 'capitalize' }}>· {o.meta.paymentMethod}</span>}
                      <span>· {o.meta?.isPickup === false ? 'Delivery' : 'Pickup'}</span>
                    </div>
                  </Link>
                );
              })
            )}
          </div>
        )}

        {/* ── Payment ── */}
        {accTab === 'payment' && (
          <div className="stack" style={{ gap: 16 }}>
            {/* Saved M-Pesa number — pre-fills the STK prompt at checkout */}
            <div style={{ border: '1px solid var(--border)', borderRadius: 'var(--radius)', padding: 18 }} className="stack">
              <div>
                <strong>M-Pesa number</strong>
                <p className="muted" style={{ margin: '2px 0 0', fontSize: 13 }}>Save the number that should receive the payment prompt — we’ll pre-fill it at checkout.</p>
              </div>
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
                <input
                  className="field"
                  type="tel"
                  value={mpesaInput}
                  onChange={(e) => setMpesaInput(e.target.value)}
                  placeholder="07XXXXXXXX or 2547XXXXXXXX"
                  style={{ flex: 1, minWidth: 200 }}
                />
                <button className="button" onClick={() => saveMpesaNumber(mpesaInput.trim())} disabled={savingMpesa || mpesaInput.replace(/\D/g, '').length < 9}>
                  {savingMpesa ? 'Saving…' : customer.mpesaNumber ? 'Update' : 'Save'}
                </button>
                {customer.mpesaNumber && (
                  <button className="button ghost" type="button" onClick={() => saveMpesaNumber(null)} disabled={savingMpesa}>Remove</button>
                )}
              </div>
              {customer.mpesaNumber && <p className="muted" style={{ margin: 0, fontSize: 13 }}>Prompts go to <strong>{customer.mpesaNumber}</strong>.</p>}
            </div>

            <div style={{ border: '1px solid var(--border)', borderRadius: 'var(--radius)', padding: 18 }} className="stack">
              <strong>Last used</strong>
              {customer.lastPaymentMethod ? (
                <>
                  <p style={row}><span className="muted">Method</span><span style={{ fontWeight: 600, textTransform: 'capitalize' }}>{customer.lastPaymentMethod}</span></p>
                  {customer.lastPaymentPhone && <p style={row}><span className="muted">M-Pesa phone</span><span style={{ fontWeight: 600 }}>{customer.lastPaymentPhone}</span></p>}
                  {customer.lastDeliveryAddress && <p style={row}><span className="muted">Last delivery</span><span style={{ fontWeight: 600, textAlign: 'right' }}>{addrText(customer.lastDeliveryAddress)}</span></p>}
                </>
              ) : (
                <p className="muted" style={{ margin: 0 }}>No payments yet.</p>
              )}
            </div>

            {methodsUsed.length > 0 && (
              <div>
                <p className="muted" style={{ margin: '0 0 8px', fontSize: 12, textTransform: 'uppercase', letterSpacing: 0.5 }}>Methods you’ve used</p>
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                  {methodsUsed.map((m) => (
                    <span key={m} className="button secondary" style={{ textTransform: 'capitalize', minHeight: 34, cursor: 'default' }}>{m}</span>
                  ))}
                </div>
              </div>
            )}

            <p className="muted" style={{ margin: 0, fontSize: 13 }}>
              We don’t store card or M-Pesa PINs. You confirm each payment (M-Pesa STK, bank transfer) at checkout.
            </p>
          </div>
        )}

        {status && (
          <p role="status" style={{ marginTop: 16, color: status.ok ? 'var(--success)' : 'var(--error)', fontSize: 14 }}>
            {status.message}
          </p>
        )}
      </section>
    );
  }

  return (
    <section className="container" style={{ padding: '48px 0', maxWidth: 440 }}>
      <h1>Account</h1>
      <p className="muted" style={{ marginBottom: 24 }}>
        Sign in or create an account to track your orders.
      </p>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: 0, borderBottom: '2px solid var(--border)', marginBottom: 24 }}>
        {(['login', 'register'] as Tab[]).map((t) => (
          <button
            key={t}
            type="button"
            onClick={() => { setTab(t); setStatus(null); }}
            style={{
              padding: '8px 20px',
              border: 'none',
              background: 'transparent',
              cursor: 'pointer',
              fontWeight: tab === t ? 700 : 400,
              borderBottom: tab === t ? '2px solid currentColor' : '2px solid transparent',
              marginBottom: -2,
              fontSize: 15,
            }}
          >
            {t === 'login' ? 'Sign in' : 'Create account'}
          </button>
        ))}
      </div>

      {tab === 'login' ? (
        <form onSubmit={handleLogin} className="stack" style={{ gap: 16 }}>
          <label className="stack" style={{ gap: 6 }}>
            <strong style={{ fontSize: 14 }}>Email or phone number</strong>
            <input
              className="field"
              type="text"
              value={identity}
              onChange={(e) => setIdentity(e.target.value)}
              placeholder="email@example.com or 0712345678"
              required
              autoComplete="username"
            />
          </label>
          <label className="stack" style={{ gap: 6 }}>
            <strong style={{ fontSize: 14 }}>Password</strong>
            <input
              className="field"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              autoComplete="current-password"
            />
          </label>
          <button className="button" disabled={loading}>
            {loading ? 'Signing in…' : 'Sign in'}
          </button>
          <p className="muted" style={{ fontSize: 13, textAlign: 'center' }}>
            No account?{' '}
            <button type="button" onClick={() => { setTab('register'); setStatus(null); }} style={{ background: 'none', border: 'none', cursor: 'pointer', textDecoration: 'underline', fontSize: 13 }}>
              Create one
            </button>
          </p>
        </form>
      ) : (
        <form onSubmit={handleRegister} className="stack" style={{ gap: 16 }}>
          <label className="stack" style={{ gap: 6 }}>
            <strong style={{ fontSize: 14 }}>Your name</strong>
            <input
              className="field"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Full name"
              autoComplete="name"
            />
          </label>
          <label className="stack" style={{ gap: 6 }}>
            <strong style={{ fontSize: 14 }}>Email or phone number</strong>
            <input
              className="field"
              type="text"
              value={identity}
              onChange={(e) => setIdentity(e.target.value)}
              placeholder="email@example.com or 0712345678"
              required
              autoComplete="username"
            />
          </label>
          <label className="stack" style={{ gap: 6 }}>
            <strong style={{ fontSize: 14 }}>Password</strong>
            <input
              className="field"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              minLength={6}
              required
              autoComplete="new-password"
            />
          </label>
          <label className="stack" style={{ gap: 6 }}>
            <strong style={{ fontSize: 14 }}>Confirm password</strong>
            <input
              className="field"
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              minLength={6}
              required
              autoComplete="new-password"
            />
          </label>
          <p className="muted" style={{ fontSize: 12 }}>
            We only need your phone or email and a password. Address can be added when you order.
          </p>
          <ConsentChecks age={age} setAge={setAge} terms={terms} setTerms={setTerms} />
          <button className="button" disabled={loading || !age || !terms}>
            {loading ? 'Creating account…' : 'Create account'}
          </button>
          <p className="muted" style={{ fontSize: 13, textAlign: 'center' }}>
            Already have an account?{' '}
            <button type="button" onClick={() => { setTab('login'); setStatus(null); }} style={{ background: 'none', border: 'none', cursor: 'pointer', textDecoration: 'underline', fontSize: 13 }}>
              Sign in
            </button>
          </p>
        </form>
      )}

      {status && (
        <p role="status" style={{ marginTop: 16, color: status.ok ? 'var(--success, green)' : 'var(--error, red)', fontSize: 14 }}>
          {status.message}
        </p>
      )}
    </section>
  );
}
