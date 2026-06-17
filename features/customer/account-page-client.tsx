'use client';

import { useState } from 'react';

export function AccountPageClient() {
  const [identity, setIdentity] = useState('');
  const [password, setPassword] = useState('');
  const [phone, setPhone] = useState('');
  const [code, setCode] = useState('');
  const [status, setStatus] = useState<string | null>(null);
  const [smsRequested, setSmsRequested] = useState(false);

  async function login(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const response = await fetch('/api/storefront/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ identity, password })
    });
    const payload = await response.json();
    setStatus(response.ok ? `Signed in as ${payload.customer?.name ?? payload.customer?.email ?? identity}` : payload.error);
  }

  async function requestSms(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const response = await fetch('/api/storefront/auth/sms', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ phone })
    });
    const payload = await response.json();
    setSmsRequested(response.ok);
    setStatus(response.ok ? 'Verification code sent.' : payload.error);
  }

  async function verifySms(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const response = await fetch('/api/storefront/auth/sms', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ phone, code })
    });
    const payload = await response.json();
    setStatus(response.ok ? `Signed in as ${payload.customer?.name ?? payload.customer?.phone ?? phone}` : payload.error);
  }

  async function logout() {
    const response = await fetch('/api/storefront/auth/logout', { method: 'POST' });
    setStatus(response.ok ? 'Signed out.' : 'Unable to sign out.');
  }

  return (
    <section className="container two-column" style={{ padding: '32px 0 56px' }}>
      <div className="stack">
        <div>
          <h1>Account</h1>
          <p className="muted">Sign in to view order history and saved checkout details.</p>
        </div>
        <form onSubmit={login} className="stack" style={{ border: '1px solid var(--border)', borderRadius: 'var(--radius)', padding: 16 }}>
          <h2 style={{ margin: 0 }}>Password sign in</h2>
          <label className="stack" style={{ gap: 8 }}>
            <strong>Email or phone</strong>
            <input className="field" value={identity} onChange={(event) => setIdentity(event.target.value)} />
          </label>
          <label className="stack" style={{ gap: 8 }}>
            <strong>Password</strong>
            <input className="field" type="password" value={password} onChange={(event) => setPassword(event.target.value)} />
          </label>
          <button className="button">Sign in</button>
        </form>
      </div>
      <aside className="stack">
        <form onSubmit={smsRequested ? verifySms : requestSms} className="stack" style={{ border: '1px solid var(--border)', borderRadius: 'var(--radius)', padding: 16 }}>
          <h2 style={{ margin: 0 }}>SMS sign in</h2>
          <label className="stack" style={{ gap: 8 }}>
            <strong>Phone number</strong>
            <input className="field" value={phone} onChange={(event) => setPhone(event.target.value)} />
          </label>
          {smsRequested && (
            <label className="stack" style={{ gap: 8 }}>
              <strong>Verification code</strong>
              <input className="field" value={code} onChange={(event) => setCode(event.target.value)} />
            </label>
          )}
          <button className="button">{smsRequested ? 'Verify code' : 'Send code'}</button>
        </form>
        <button className="button secondary" onClick={logout}>Sign out</button>
        {status && <p className="muted" role="status">{status}</p>}
      </aside>
    </section>
  );
}
