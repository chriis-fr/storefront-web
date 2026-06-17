import { NextResponse } from 'next/server';
import { getServiceQuoteFromCart } from '@/lib/fleetbase/storefront';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const quote = await getServiceQuoteFromCart({
      origin: body.origin,
      destination: body.destination,
      cart: body.cart,
      config: 'storefront'
    });
    return NextResponse.json({ quote });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Unable to fetch service quote.' }, { status: 500 });
  }
}
