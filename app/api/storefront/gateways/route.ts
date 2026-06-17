import { NextResponse } from 'next/server';
import { getGateways } from '@/lib/fleetbase/storefront';

export async function GET() {
  try {
    const gateways = await getGateways();
    return NextResponse.json({ gateways });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Unable to load gateways.' }, { status: 500 });
  }
}
