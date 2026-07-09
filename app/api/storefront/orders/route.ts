import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import { getCustomerOrders, placeOrder } from '@/lib/provider';

async function getCustomerToken(): Promise<string | null> {
  const jar = await cookies();
  return jar.get('customer_token')?.value ?? null;
}

export async function GET() {
  try {
    const token = await getCustomerToken();
    const orders = await getCustomerOrders(token ?? undefined);
    return NextResponse.json({ orders });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Sign in to view orders.' }, { status: 401 });
  }
}

export async function POST(request: Request) {
  try {
    const token = await getCustomerToken();
    if (!token) return NextResponse.json({ error: 'Sign in to place an order.' }, { status: 401 });

    const body = await request.json() as {
      cartId: string;
      isPickup?: boolean;
      mpesaPhone?: string;
      deliveryAddress?: Record<string, unknown>;
      notes?: string;
    };

    if (!body.cartId) return NextResponse.json({ error: 'cartId required' }, { status: 400 });

    const order = await placeOrder(body.cartId, body, token);
    const response = NextResponse.json({ order });
    response.cookies.delete('cart_id');
    return response;
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unable to place order.' },
      { status: 400 }
    );
  }
}
