import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import { getCustomerProfile, updateCustomer } from '@/lib/provider';

async function getCustomerToken(): Promise<string | null> {
  const jar = await cookies();
  return jar.get('customer_token')?.value ?? null;
}

export async function GET() {
  const token = await getCustomerToken();
  if (!token) return NextResponse.json({ error: 'Not signed in.' }, { status: 401 });
  const customer = await getCustomerProfile(token);
  if (!customer) return NextResponse.json({ error: 'Session expired. Please sign in again.' }, { status: 401 });
  return NextResponse.json({ customer });
}

export async function PATCH(request: Request) {
  const token = await getCustomerToken();
  if (!token) return NextResponse.json({ error: 'Not signed in.' }, { status: 401 });
  try {
    const body = await request.json();
    const customer = await updateCustomer(token, body);
    return NextResponse.json({ customer });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Unable to update profile.' }, { status: 400 });
  }
}
