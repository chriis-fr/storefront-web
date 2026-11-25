import { NextResponse } from 'next/server';
import { chainsPost } from '@/lib/chains/client';

// Chains checks that this site really is the store it claims to be before it saves the
// store's address (the "Storefront" link a business sees in FleetOps).
//
// Chains calls GET /api/chains/verify-address?code=… with a one-time code. This route
// passes the code back to chains-api with this store's key and the address the store is
// configured for (NEXT_PUBLIC_SITE_URL). chains-api accepts the address only when the key
// belongs to that workspace and the address matches the one being checked, so a site that
// merely forwards the code here cannot claim to be this store.
//
// Nothing is revealed to the caller: the key stays on the server, and the answer is only
// whether chains-api accepted the proof.

export const dynamic = 'force-dynamic';

const CODE = /^[a-f0-9]{48}$/;

export async function GET(request: Request) {
  const code = new URL(request.url).searchParams.get('code') ?? '';
  if (!CODE.test(code)) return NextResponse.json({ ok: false }, { status: 400 });

  const siteUrl = (process.env.NEXT_PUBLIC_SITE_URL ?? '').trim();
  try {
    await chainsPost<{ ok: boolean }>('/logistics/store-address/prove', { code, siteUrl });
    return NextResponse.json({ ok: true }, { headers: { 'Cache-Control': 'no-store' } });
  } catch {
    // Refused (wrong workspace, unknown or expired code, another address) or unreachable.
    return NextResponse.json({ ok: false }, { status: 409, headers: { 'Cache-Control': 'no-store' } });
  }
}
