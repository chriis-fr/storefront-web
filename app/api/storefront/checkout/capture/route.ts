import { NextResponse } from 'next/server';
import { captureCheckout } from '@/lib/fleetbase/storefront';
import { runAfterOrderPlacedHooks, runBeforeCheckoutCaptureHooks } from '@/plugins/registry';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const payload = { token: body.token, notes: body.notes, transactionDetails: body.transactionDetails };
    const finalPayload = await runBeforeCheckoutCaptureHooks(payload);
    const order = await captureCheckout(finalPayload);
    await runAfterOrderPlacedHooks(order);
    const response = NextResponse.json({ order });
    response.cookies.delete('cart_id');
    return response;
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Unable to capture checkout.' }, { status: 500 });
  }
}
