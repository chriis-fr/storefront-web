import { NextResponse } from 'next/server';
import { loginCustomer } from '@/lib/fleetbase/storefront';
import { sessionCookieOptions } from '@/lib/runtime';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const result = await loginCustomer(body);
    const response = NextResponse.json({ customer: result.customer });
    response.cookies.set('customer_token', result.token, sessionCookieOptions());
    if (result.customer?.id) {
      response.cookies.set('customer_id', result.customer.id, sessionCookieOptions());
    }
    return response;
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Unable to sign in.' }, { status: 401 });
  }
}
