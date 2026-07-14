import { cookies } from 'next/headers';

// Streams the order's PDF receipt from chains-api, forwarding the customer token
// so only the owner can download it. The key stays server-side.
export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const jar = await cookies();
  const token = jar.get('customer_token')?.value;
  if (!token) return new Response('Sign in to download your receipt.', { status: 401 });

  const API = (process.env.CHAINS_API_URL ?? '').replace(/\/$/, '');
  const KEY = process.env.CHAINS_STOREFRONT_KEY ?? '';
  if (!API || !KEY) return new Response('Storefront not configured.', { status: 500 });

  const res = await fetch(`${API}/api/pos/public/orders/${encodeURIComponent(id)}/receipt`, {
    headers: { 'X-Storefront-Key': KEY, Authorization: `Bearer ${token}` },
    cache: 'no-store',
  }).catch(() => null);

  if (!res || !res.ok) {
    const msg = res ? await res.text().catch(() => 'Receipt unavailable.') : 'Receipt unavailable.';
    return new Response(msg, { status: res?.status ?? 502 });
  }

  const buf = await res.arrayBuffer();
  return new Response(buf, {
    status: 200,
    headers: {
      'Content-Type': 'application/pdf',
      'Content-Disposition': res.headers.get('content-disposition') ?? `attachment; filename="receipt-${id}.pdf"`,
    },
  });
}
