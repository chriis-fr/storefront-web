import { NextResponse } from 'next/server';
import { registerCustomer } from '@/lib/provider';
import { sessionCookieOptions } from '@/lib/runtime';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const result = await registerCustomer(body);
    const response = NextResponse.json({ customer: result.customer });
    if (result.token) {
      response.cookies.set('customer_token', result.token, sessionCookieOptions());
    }
    if (result.customer?.id) {
      response.cookies.set('customer_id', result.customer.id, sessionCookieOptions());
    }
    return response;
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unable to create account.' },
      { status: 400 }
    );
  }
}
