import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { beforeCheckout } from '@/lib/provider';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const customerId = body.customer ?? (await cookies()).get('customer_id')?.value;
    const checkout = await beforeCheckout({
      gateway: body.gateway,
      customer: customerId,
      cart: body.cart,
      service_quote: body.service_quote,
      pickup: body.pickup,
      tip: body.tip,
      delivery_tip: body.delivery_tip,
      cash: body.cash
    });
    return NextResponse.json(checkout);
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Unable to prepare checkout.' }, { status: 500 });
  }
}
