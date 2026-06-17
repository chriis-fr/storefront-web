import { NextResponse } from 'next/server';
import { getCustomerOrders } from '@/lib/fleetbase/storefront';

export async function GET() {
  try {
    const orders = await getCustomerOrders();
    return NextResponse.json({ orders });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Sign in to view orders.' }, { status: 401 });
  }
}
