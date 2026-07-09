// HTTP client for chains-api public endpoints.
//
// Sends the storefront API key as `X-Storefront-Key` on every request.
// The key is read from CHAINS_STOREFRONT_KEY (server-side only — never
// exposed to the browser). The API resolves it to the org server-side,
// so the customer never sees which org or slug is behind the key.

const API = (process.env.CHAINS_API_URL ?? '').replace(/\/$/, '');
const KEY = process.env.CHAINS_STOREFRONT_KEY ?? '';

function baseHeaders(customerToken?: string | null): Record<string, string> {
  const h: Record<string, string> = {
    Accept:             'application/json',
    'X-Storefront-Key': KEY,
  };
  if (customerToken) h['Authorization'] = `Bearer ${customerToken}`;
  return h;
}

export type ChainsGetOptions = {
  revalidate?: number | false;
  tags?: string[];
  customerToken?: string | null;
};

type NextOpts = { revalidate?: number | false; tags?: string[] };

export async function chainsGet<T>(path: string, opts: ChainsGetOptions = {}): Promise<T> {
  if (!API) throw new Error('CHAINS_API_URL is not configured');
  if (!KEY) throw new Error('CHAINS_STOREFRONT_KEY is not configured');

  const nextOpts: NextOpts = {};
  if (opts.tags?.length)             nextOpts.tags       = opts.tags;
  if (opts.revalidate !== undefined) nextOpts.revalidate = opts.revalidate;

  const res = await fetch(`${API}/api${path}`, {
    headers: baseHeaders(opts.customerToken),
    next:    Object.keys(nextOpts).length ? nextOpts : undefined,
    cache:   opts.revalidate === 0 ? 'no-store' : undefined,
  });

  const body = await res.json().catch(() => null);
  if (!res.ok) throw new Error(body?.error ?? body?.message ?? `chains-api ${res.status}`);
  return body as T;
}

export async function chainsPost<T>(
  path: string,
  data: unknown,
  opts: { customerToken?: string | null } = {}
): Promise<T> {
  if (!API) throw new Error('CHAINS_API_URL is not configured');
  if (!KEY) throw new Error('CHAINS_STOREFRONT_KEY is not configured');

  const res = await fetch(`${API}/api${path}`, {
    method:  'POST',
    headers: { ...baseHeaders(opts.customerToken), 'Content-Type': 'application/json' },
    body:    JSON.stringify(data),
    cache:   'no-store',
  });

  const body = await res.json().catch(() => null);
  if (!res.ok) throw new Error(body?.error ?? body?.message ?? `chains-api ${res.status}`);
  return body as T;
}

export async function chainsPut<T>(
  path: string,
  data: unknown,
  opts: { customerToken?: string | null } = {}
): Promise<T> {
  if (!API) throw new Error('CHAINS_API_URL is not configured');
  if (!KEY) throw new Error('CHAINS_STOREFRONT_KEY is not configured');

  const res = await fetch(`${API}/api${path}`, {
    method:  'PUT',
    headers: { ...baseHeaders(opts.customerToken), 'Content-Type': 'application/json' },
    body:    JSON.stringify(data),
    cache:   'no-store',
  });

  const body = await res.json().catch(() => null);
  if (!res.ok) throw new Error(body?.error ?? body?.message ?? `chains-api ${res.status}`);
  return body as T;
}

export async function chainsDelete<T>(
  path: string,
  data?: unknown,
  opts: { customerToken?: string | null } = {}
): Promise<T> {
  if (!API) throw new Error('CHAINS_API_URL is not configured');
  if (!KEY) throw new Error('CHAINS_STOREFRONT_KEY is not configured');

  const res = await fetch(`${API}/api${path}`, {
    method:  'DELETE',
    headers: { ...baseHeaders(opts.customerToken), 'Content-Type': 'application/json' },
    body:    data ? JSON.stringify(data) : undefined,
    cache:   'no-store',
  });

  const body = await res.json().catch(() => null);
  if (!res.ok) throw new Error(body?.error ?? body?.message ?? `chains-api ${res.status}`);
  return body as T;
}

export async function chainsPatch<T>(
  path: string,
  data: unknown,
  opts: { customerToken?: string | null } = {}
): Promise<T> {
  if (!API) throw new Error('CHAINS_API_URL is not configured');
  if (!KEY) throw new Error('CHAINS_STOREFRONT_KEY is not configured');

  const res = await fetch(`${API}/api${path}`, {
    method:  'PATCH',
    headers: { ...baseHeaders(opts.customerToken), 'Content-Type': 'application/json' },
    body:    JSON.stringify(data),
    cache:   'no-store',
  });

  const body = await res.json().catch(() => null);
  if (!res.ok) throw new Error(body?.error ?? body?.message ?? `chains-api ${res.status}`);
  return body as T;
}

export function isConfigured(): boolean {
  return !!(API && KEY);
}
