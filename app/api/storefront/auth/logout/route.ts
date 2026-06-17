import { NextResponse } from 'next/server';

export async function POST() {
  const response = NextResponse.json({ ok: true });
  response.cookies.delete('customer_token');
  response.cookies.delete('customer_id');
  return response;
}
