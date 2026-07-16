import { NextResponse } from 'next/server';

// Initialise a Paystack card charge for an order. Paystack keys live HERE on the
// storefront (PAYSTACK_SECRET_KEY) — chains-api never sees them. Returns the
// hosted authorization_url; the customer pays there and Paystack calls our webhook
// (which settles the order back to the POS).
//
// Env required: PAYSTACK_SECRET_KEY, and (optional) NEXT_PUBLIC_SITE_URL for the
// return callback.
export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  const secret = process.env.PAYSTACK_SECRET_KEY;
  if (!secret) {
    return NextResponse.json({ error: 'Card payment is not configured for this store.' }, { status: 501 });
  }

  const body = await request.json().catch(() => ({})) as { orderId?: string; amount?: number; email?: string };
  if (!body.orderId || !body.amount || !body.email) {
    return NextResponse.json({ error: 'orderId, amount and email are required.' }, { status: 400 });
  }

  const origin = process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, '') || new URL(request.url).origin;

  const res = await fetch('https://api.paystack.co/transaction/initialize', {
    method: 'POST',
    headers: { Authorization: `Bearer ${secret}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email:        body.email,
      amount:       Math.round(body.amount),      // minor units (kobo/cents)
      reference:    body.orderId,                 // map back to the POS order in the webhook
      callback_url: `${origin}/checkout`,         // customer returns here; status polling takes over
      metadata:     { orderId: body.orderId },
    }),
  }).catch(() => null);

  const data = await res?.json().catch(() => null);
  if (!res?.ok || !data?.status) {
    return NextResponse.json({ error: data?.message ?? 'Could not start card payment.' }, { status: 502 });
  }

  return NextResponse.json({
    authorization_url: data.data.authorization_url,
    reference:         data.data.reference,
  });
}
