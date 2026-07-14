'use client';

import { useState } from 'react';
import { ConsentChecks } from '@/features/customer/consent';

/**
 * Compact sign-in / sign-up card used inline (e.g. at checkout). On success the
 * auth cookies are set by the API routes and `onAuthed` fires so the caller can
 * continue whatever the customer was doing — no navigation away.
 */
export function AuthInline({
  onAuthed,
  title = 'Sign in to continue',
  subtitle = 'Sign in or create an account to place your order.',
}: {
  onAuthed: () => void;
  title?: string;
  subtitle?: string;
}) {
  const [mode, setMode] = useState<'signin' | 'signup'>('signin');
  const [name, setName] = useState('');
  const [identity, setIdentity] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [age, setAge] = useState(false);
  const [terms, setTerms] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit() {
    setError(null);
    if (mode === 'signup' && password !== confirm) {
      setError('Passwords do not match.');
      return;
    }
    if (mode === 'signup' && (!age || !terms)) {
      setError('Please confirm you are 18+ and accept the terms.');
      return;
    }
    setLoading(true);
    try {
      const isEmail = identity.includes('@');
      const url = mode === 'signin' ? '/api/storefront/auth/login' : '/api/storefront/auth/register';
      const body =
        mode === 'signin'
          ? { identity, password }
          : { ...(isEmail ? { email: identity } : { phone: identity }), password, name: name.trim() || undefined, ageConfirmed: age, acceptedTerms: terms };
      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? 'Authentication failed.');
      onAuthed();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Authentication failed.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{ border: '1px solid var(--border)', borderRadius: 'var(--radius)', padding: 20 }} className="stack">
      <div>
        <h2 style={{ margin: 0, fontSize: '1.25rem' }}>{title}</h2>
        <p className="muted" style={{ margin: '4px 0 0' }}>{subtitle}</p>
      </div>

      <div style={{ display: 'flex', gap: 8 }}>
        <button type="button" className={`button ${mode === 'signin' ? '' : 'secondary'}`} onClick={() => setMode('signin')}>
          Sign in
        </button>
        <button type="button" className={`button ${mode === 'signup' ? '' : 'secondary'}`} onClick={() => setMode('signup')}>
          Create account
        </button>
      </div>

      {/* Not a <form> — this renders inside the checkout <form>, and nested forms
          are invalid HTML. Submit on button click / Enter instead. */}
      <div className="stack" onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); submit(); } }}>
        {mode === 'signup' && (
          <label className="stack" style={{ gap: 6 }}>
            <strong>Your name</strong>
            <input className="field" value={name} onChange={(e) => setName(e.target.value)} placeholder="Full name" />
          </label>
        )}
        <label className="stack" style={{ gap: 6 }}>
          <strong>Email or phone</strong>
          <input className="field" value={identity} onChange={(e) => setIdentity(e.target.value)} placeholder="you@example.com or 07XXXXXXXX" />
        </label>
        <label className="stack" style={{ gap: 6 }}>
          <strong>Password</strong>
          <input className="field" type="password" value={password} onChange={(e) => setPassword(e.target.value)} />
        </label>
        {mode === 'signup' && (
          <label className="stack" style={{ gap: 6 }}>
            <strong>Confirm password</strong>
            <input className="field" type="password" value={confirm} onChange={(e) => setConfirm(e.target.value)} />
          </label>
        )}
        {mode === 'signup' && <ConsentChecks age={age} setAge={setAge} terms={terms} setTerms={setTerms} />}
        {error && <p style={{ color: 'var(--error)', margin: 0 }}>{error}</p>}
        <button type="button" className="button" onClick={submit} disabled={loading || (mode === 'signup' && (!age || !terms))}>
          {loading ? 'Please wait…' : mode === 'signin' ? 'Sign in & continue' : 'Create account & continue'}
        </button>
      </div>
    </div>
  );
}
