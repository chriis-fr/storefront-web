import { createHmac, timingSafeEqual } from 'crypto';
import { NextResponse } from 'next/server';
import { chainsPost } from '@/lib/chains/client';

// Paystack webhook → settle the order in the POS.
//
// Paystack posts here on payment events. We verify the signature with OUR secret
// key (the keys live on the storefront), and on a successful charge we call
// chains-api's settle-external endpoint (authed by the storefront key) to mark the
// POS order paid. This is the "webhook returned to the POS".
//
// Point your Paystack dashboard webhook at: https://<storefront>/api/storefront/paystack/webhook
export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  const secret = process.env.PAYSTACK_SECRET_KEY;
  if (!secret) return NextResponse.json({ error: 'Not configured' }, { status: 501 });

  // Raw body is required for signature verification.
  const raw = await request.text();
  const signature = request.headers.get('x-paystack-signature') ?? '';
  const expected = createHmac('sha512', secret).update(raw).digest('hex');

  const sigBuf = Buffer.from(signature);
  const expBuf = Buffer.from(expected);
  if (sigBuf.length !== expBuf.length || !timingSafeEqual(sigBuf, expBuf)) {
    return NextResponse.json({ error: 'Invalid signature' }, { status: 401 });
  }

  let event: {
    event?: string;
    data?: { reference?: string; amount?: number; currency?: string; status?: string; id?: number | string };
  };
  try { event = JSON.parse(raw); } catch { return NextResponse.json({ error: 'Bad payload' }, { status: 400 }); }

  // Only a confirmed successful charge settles the order.
  if (event.event === 'charge.success' && event.data?.status === 'success') {
    const orderId = event.data.reference;          // we set reference = orderId at init
    if (orderId) {
      try {
        await chainsPost(`/pos/public/orders/${orderId}/settle-external`, {
          reference: String(event.data.id ?? event.data.reference),
          method:    'card',
          amount:    event.data.amount,             // minor units — chains-api checks it covers the total
          currency:  event.data.currency,           // and that it is the order's currency
        });
      } catch (error) {
        const status = (error as { status?: number }).status;
        console.error('[paystack] settle failed', orderId, status, error instanceof Error ? error.message : error);
        // chains-api refused it on the facts (amount short, wrong currency, unknown order):
        // a retry would get the same answer, so acknowledge it and leave it for a person.
        if (status && status >= 400 && status < 500) return NextResponse.json({ received: true, settled: false });
        // Outage or network error: a non-2xx makes Paystack retry, so a paid order doesn't
        // stay unpaid. settle-external is idempotent, so a retry after success is harmless.
        return NextResponse.json({ error: 'Settlement failed; retry' }, { status: 500 });
      }
    }
  }

  // 200 for settled charges and for events we ignore, so Paystack doesn't retry those.
  return NextResponse.json({ received: true });
}
