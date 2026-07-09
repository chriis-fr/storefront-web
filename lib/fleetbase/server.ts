import { cookies, headers } from 'next/headers';
import { requireEnv } from '@/lib/config';
import { parseJsonResponse } from '@/lib/http';
import { FLEETBASE_ENABLED } from '@/lib/runtime';

type FleetbaseRequestOptions = {
  method?: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
  query?: Record<string, unknown>;
  body?: unknown;
  customerToken?: string | null;
  cache?: RequestCache;
  next?: NextFetchRequestConfig;
};

function endpoint(path: string, query?: Record<string, unknown>) {
  const host = process.env.FLEETBASE_HOST ?? 'https://api.fleetbase.io';
  const url = new URL(`/storefront/v1/${path.replace(/^\//, '')}`, host);

  Object.entries(query ?? {}).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') {
      url.searchParams.set(key, String(value));
    }
  });

  return url.toString();
}

export async function getCustomerTokenFromCookies() {
  return (await cookies()).get('customer_token')?.value ?? null;
}

async function getLocale() {
  return (await headers()).get('accept-language')?.split(',')[0] ?? process.env.NEXT_PUBLIC_DEFAULT_LOCALE ?? 'en';
}

export async function storefrontRequest<T>(path: string, options: FleetbaseRequestOptions = {}): Promise<T> {
  if (!FLEETBASE_ENABLED) {
    throw new Error('Fleetbase is not enabled on this instance (FLEETBASE_ENABLED=false)');
  }
  const method = options.method ?? 'GET';
  const customerToken = options.customerToken === undefined ? await getCustomerTokenFromCookies() : options.customerToken;
  const requestHeaders: Record<string, string> = {
    Authorization: `Bearer ${requireEnv('STOREFRONT_KEY')}`,
    'Accept-Language': await getLocale(),
    Accept: 'application/json'
  };

  if (customerToken) {
    requestHeaders['Customer-Token'] = customerToken;
  }

  if (options.body !== undefined) {
    requestHeaders['Content-Type'] = 'application/json';
  }

  const response = await fetch(endpoint(path, options.query), {
    method,
    headers: requestHeaders,
    body: options.body === undefined ? undefined : JSON.stringify(options.body),
    cache: options.cache ?? (method === 'GET' ? 'no-store' : 'no-store'),
    next: options.next
  });

  return parseJsonResponse<T>(response);
}
