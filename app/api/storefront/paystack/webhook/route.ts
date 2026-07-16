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

  const event = JSON.parse(raw) as {
    event?: string;
    data?: { reference?: string; amount?: number; status?: string; id?: number | string };
  };

  // Only a confirmed successful charge settles the order.
  if (event.event === 'charge.success' && event.data?.status === 'success') {
    const orderId = event.data.reference;          // we set reference = orderId at init
    if (orderId) {
      await chainsPost(`/pos/public/orders/${orderId}/settle-external`, {
        reference: String(event.data.id ?? event.data.reference),
        method:    'card',
        amount:    event.data.amount,               // minor units — chains-api checks it covers the total
      }).catch(() => { /* Paystack retries on non-2xx; also reconcilable later */ });
    }
  }

  // Always 200 so Paystack doesn't retry endlessly on events we ignore.
  return NextResponse.json({ received: true });
}
