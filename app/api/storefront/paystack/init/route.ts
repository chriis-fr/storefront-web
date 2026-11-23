import { NextResponse } from 'next/server';
import { orderPayable } from '@/lib/provider';

// Initialise a Paystack card charge for an order. Paystack keys live HERE on the
// storefront (PAYSTACK_SECRET_KEY) — chains-api never sees them. Returns the
// hosted authorization_url; the customer pays there and Paystack calls our webhook
// (which settles the order back to the POS).
//
// The amount and currency come from the order in chains-api, never from the browser,
// so a shopper can't start a cheaper charge for the same order.
//
// Env required: PAYSTACK_SECRET_KEY, and (optional) NEXT_PUBLIC_SITE_URL for the
// return callback.
export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  const secret = process.env.PAYSTACK_SECRET_KEY;
  if (!secret) {
    return NextResponse.json({ error: 'Card payment is not configured for this store.' }, { status: 501 });
  }

  const body = await request.json().catch(() => ({})) as { orderId?: string; email?: string };
  const orderId = typeof body.orderId === 'string' && /^[0-9a-f]{24}$/i.test(body.orderId) ? body.orderId : '';
  const email = typeof body.email === 'string' && body.email.includes('@') && body.email.length <= 254 ? body.email.trim() : '';
  if (!orderId || !email) {
    return NextResponse.json({ error: 'orderId and email are required.' }, { status: 400 });
  }

  const due = await orderPayable(orderId);
  if (!due) return NextResponse.json({ error: 'Order not found.' }, { status: 404 });
  if (!due.payable) return NextResponse.json({ error: 'This order is already paid or was cancelled.' }, { status: 409 });

  const origin = process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, '') || new URL(request.url).origin;

  const res = await fetch('https://api.paystack.co/transaction/initialize', {
    method: 'POST',
    headers: { Authorization: `Bearer ${secret}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email,
      amount:       due.amountMinor,               // minor units (kobo/cents), from the order
      currency:     due.currency,
      reference:    orderId,                       // map back to the POS order in the webhook
      callback_url: `${origin}/checkout`,          // customer returns here; status polling takes over
      metadata:     { orderId },
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
