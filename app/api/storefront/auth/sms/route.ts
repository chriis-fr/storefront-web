import { NextResponse } from 'next/server';
import { requestSmsLogin, verifyCustomerCode } from '@/lib/fleetbase/storefront';
import { sessionCookieOptions } from '@/lib/runtime';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    if (body.code) {
      const result = await verifyCustomerCode(body);
      const response = NextResponse.json({ customer: result.customer });
      response.cookies.set('customer_token', result.token, sessionCookieOptions());
      if (result.customer?.id) {
        response.cookies.set('customer_id', result.customer.id, sessionCookieOptions());
      }
      return response;
    }
    const result = await requestSmsLogin(body);
    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Unable to process SMS auth.' }, { status: 400 });
  }
}
