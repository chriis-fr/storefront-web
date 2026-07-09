import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import { getCart } from '@/lib/provider';
import { sessionCookieOptions } from '@/lib/runtime';

export async function GET() {
  try {
    const cookieStore = await cookies();
    const cartId = cookieStore.get('cart_id')?.value;
    const cart = await getCart(cartId);
    const response = NextResponse.json({ cart });
    if (cart?.id) {
      response.cookies.set('cart_id', cart.id, sessionCookieOptions());
    }
    return response;
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Unable to load cart.' }, { status: 500 });
  }
}
