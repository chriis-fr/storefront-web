'use client';

import { useState, useEffect } from 'react';

type Customer = { id: string; name?: string | null; email?: string | null; phone?: string | null };
type Tab = 'login' | 'register';

export function AccountPageClient() {
  const [tab, setTab] = useState<Tab>('login');
  const [identity, setIdentity] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [status, setStatus] = useState<{ ok: boolean; message: string } | null>(null);
  const [loading, setLoading] = useState(false);
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    fetch('/api/storefront/auth/me')
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => { if (data?.customer) setCustomer(data.customer); })
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
      setStatus({ ok: true, message: `Welcome back${data.customer?.name ? ', ' + data.customer.name : ''}!` });
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
    setLoading(true);
    setStatus(null);
    try {
      const isEmail = identity.includes('@');
      const res = await fetch('/api/storefront/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(isEmail ? { email: identity, password } : { phone: identity, password }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? 'Unable to create account.');
      setCustomer(data.customer);
      setStatus({ ok: true, message: 'Account created! You\'re now signed in.' });
    } catch (err) {
      setStatus({ ok: false, message: err instanceof Error ? err.message : 'Registration failed.' });
    } finally {
      setLoading(false);
    }
  }

  async function handleSignOut() {
    await fetch('/api/storefront/auth/logout', { method: 'POST' });
    setCustomer(null);
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
    return (
      <section className="container" style={{ padding: '48px 0', maxWidth: 480 }}>
        <h1>My account</h1>
        <div style={{ border: '1px solid var(--border)', borderRadius: 'var(--radius)', padding: 20, marginTop: 16 }}>
          <p><strong>{customer.name ?? 'Customer'}</strong></p>
          {customer.email && <p className="muted" style={{ fontSize: 14 }}>{customer.email}</p>}
          {customer.phone && <p className="muted" style={{ fontSize: 14 }}>{customer.phone}</p>}
        </div>
        <a href="/orders" className="button secondary" style={{ display: 'inline-block', marginTop: 16, marginRight: 8 }}>
          My orders
        </a>
        <button className="button secondary" onClick={handleSignOut} style={{ marginTop: 16 }}>
          Sign out
        </button>
        {status && (
          <p className="muted" role="status" style={{ marginTop: 12, color: status.ok ? 'var(--success, green)' : 'var(--error, red)' }}>
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
          <button className="button" disabled={loading}>
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
