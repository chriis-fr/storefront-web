import { NextResponse } from 'next/server';
import { getOrderStatus } from '@/lib/provider';

export const dynamic = 'force-dynamic';

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const status = await getOrderStatus(id);
  if (!status) return NextResponse.json({ error: 'Order not found' }, { status: 404 });
  return NextResponse.json(status);
}
