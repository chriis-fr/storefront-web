// Chains-api adapter.
//
// Returns data shaped to match the existing Fleetbase types so all existing
// components (Header, ProductGrid, CategoryPills, StoreHero, etc.) work
// unchanged in chains mode.

import type {
  StorefrontAbout,
  StorefrontCategory,
  StorefrontProduct,
  NetworkStore,
  Cart,
  Order,
  PaymentGateway,
  ServiceQuote,
  Customer,
} from '@/lib/types';
import type { ChainsMenuItem, ChainsStoreInfo } from '@/lib/storefront-provider';
import { chainsGet, chainsPost, chainsPut, chainsDelete, chainsPatch } from './client';

// ─── Image URL helper ─────────────────────────────────────────────────────────

function resolveImageUrl(raw: string | null | undefined): string | undefined {
  if (!raw) return undefined;
  if (raw.startsWith('http')) return raw;
  const base = (process.env.NEXT_PUBLIC_API_BASE_URL ?? process.env.CHAINS_API_URL ?? '').replace(/\/$/, '');
  const path = raw.startsWith('/') ? raw : `/api/files/${raw}`;
  return `${base}${path}`;
}

// ─── Store info (→ StorefrontAbout) ──────────────────────────────────────────

export async function getChainsAbout(): Promise<StorefrontAbout> {
  const data = await chainsGet<ChainsStoreInfo>('/pos/public/store', {
    revalidate: 300,
    tags:       ['chains-store-info'],
  });
  return {
    id:           data.organizationId,
    name:         data.name,
    slug:         data.slug ?? undefined,
    logo_url:     resolveImageUrl(data.logoUrl),
    backdrop_url: undefined,
    currency:     data.currency,
    online:       data.isOpen,
    is_store:     true,
    is_network:   false,
    options: {
      paymentModes:    data.paymentModes,
      taxRate:         data.taxRate,
      mpesa:           data.mpesa,
      bitcoin:         data.bitcoin,
      deliveryEnabled: data.deliveryEnabled,
      pickupEnabled:   data.pickupEnabled,
      brandColor:      data.brandColor,
    },
  };
}

// ─── Menu items (→ StorefrontProduct[]) ──────────────────────────────────────

export async function getChainsProducts(
  _query: Record<string, unknown> = {}
): Promise<StorefrontProduct[]> {
  const items = await chainsGet<ChainsMenuItem[]>('/pos/public/menu', {
    revalidate: 120,
    tags:       ['chains-menu'],
  });
  return items.map((item) => ({
    id:                item.id,
    name:              item.name,
    description:       item.description ?? undefined,
    price:             item.price,
    sale_price:        null,
    currency:          undefined,
    is_available:      item.isActive && (item.stock == null || item.stock > 0),
    is_on_sale:        false,
    is_recommended:    false,
    is_service:        false,
    is_bookable:       false,
    primary_image_url: resolveImageUrl(item.imageUrl),
    slug:              item.id,
    meta: {
      categoryId:   item.categoryId,
      categoryName: item.categoryName,
      stock:        item.stock,
    },
  }));
}

// ─── Categories (derived from menu items) ────────────────────────────────────

export async function getChainsCategories(
  _query: Record<string, unknown> = {}
): Promise<StorefrontCategory[]> {
  const items = await chainsGet<ChainsMenuItem[]>('/pos/public/menu', {
    revalidate: 120,
    tags:       ['chains-menu'],
  });
  const seen = new Map<string, StorefrontCategory>();
  for (const item of items) {
    if (item.categoryId && !seen.has(item.categoryId)) {
      seen.set(item.categoryId, { id: item.categoryId, name: item.categoryName ?? 'Other' });
    }
  }
  return [...seen.values()];
}

export async function getChainsProduct(id: string): Promise<StorefrontProduct | null> {
  const items = await getChainsProducts();
  return items.find((p) => p.id === id) ?? null;
}

export async function getChainsSearchProducts(query: string): Promise<StorefrontProduct[]> {
  const items = await getChainsProducts();
  const q = query.toLowerCase();
  return items.filter(
    (p) => p.name.toLowerCase().includes(q) || (p.description ?? '').toLowerCase().includes(q)
  );
}

export async function getChainsNetworkStores(): Promise<NetworkStore[]> { return []; }

// ─── Gateways — return M-Pesa so checkout shows M-Pesa flow ──────────────────

export async function getChainsGateways(): Promise<PaymentGateway[]> {
  try {
    const data = await chainsGet<ChainsStoreInfo>('/pos/public/store', { revalidate: 300 });
    if (data.mpesa?.enabled) {
      return [{ id: 'mpesa', code: 'mpesa', name: 'M-Pesa' }];
    }
  } catch { /* fall through */ }
  return [];
}

// ─── Cart ─────────────────────────────────────────────────────────────────────

export async function getChainsCart(cartId?: string | null): Promise<Cart | null> {
  const path = cartId ? `/pos/public/cart?cartId=${encodeURIComponent(cartId)}` : '/pos/public/cart';
  return chainsGet<Cart>(path, { revalidate: 0 }).catch(() => null);
}

export async function getChainsAddCartItem(
  cartId: string,
  productId: string,
  body: { quantity?: number }
): Promise<Cart | null> {
  return chainsPost<Cart>('/pos/public/cart/items', { cartId, productId, quantity: body.quantity ?? 1 }).catch(() => null);
}

export async function getChainsUpdateCartItem(
  cartId: string,
  lineItemId: string,
  body: { quantity?: number }
): Promise<Cart | null> {
  return chainsPut<Cart>('/pos/public/cart/items', { cartId, lineItemId, quantity: body.quantity }).catch(() => null);
}

export async function getChainsRemoveCartItem(
  cartId: string,
  lineItemId: string
): Promise<Cart | null> {
  return chainsDelete<Cart>('/pos/public/cart/items', { cartId, lineItemId }).catch(() => null);
}

export async function getChainsEmptyCart(cartId: string): Promise<Cart | null> {
  return chainsDelete<Cart>('/pos/public/cart', { cartId }).catch(() => null);
}

// ─── Customer auth ────────────────────────────────────────────────────────────

export async function getChainsRegisterCustomer(body: {
  phone?: string;
  email?: string;
  password: string;
}): Promise<{ token: string; customer: Customer | null }> {
  const res = await chainsPost<{ token: string; customer: Customer }>('/pos/public/auth/register', body);
  return { token: res.token, customer: res.customer };
}

export async function getChainsLoginCustomer(body: {
  identity?: string;
  phone?: string;
  email?: string;
  password: string;
}): Promise<{ token: string; customer: Customer | null }> {
  const res = await chainsPost<{ token: string; customer: Customer }>('/pos/public/auth/login', body);
  return { token: res.token, customer: res.customer };
}

export async function getChainsCustomerProfile(customerToken: string): Promise<Customer | null> {
  return chainsGet<Customer>('/pos/public/auth/me', { revalidate: 0, customerToken }).catch(() => null);
}

export async function getChainsUpdateCustomer(
  customerToken: string,
  body: { name?: string; address?: Record<string, unknown> }
): Promise<Customer | null> {
  return chainsPatch<Customer>('/pos/public/auth/me', body, { customerToken }).catch(() => null);
}

// ─── Orders ───────────────────────────────────────────────────────────────────

type ChainsOrderResult = {
  orderId: string;
  status: string;
  paymentStatus: string;
  total: number;
  currency: string;
};

export async function getChainsPlaceOrder(
  cartId: string,
  body: {
    isPickup?: boolean;
    mpesaPhone?: string;
    deliveryAddress?: Record<string, unknown>;
    notes?: string;
  },
  customerToken: string
): Promise<Order | null> {
  const res = await chainsPost<ChainsOrderResult>(
    '/pos/public/orders',
    { cartId, ...body },
    { customerToken }
  );
  return {
    id:      res.orderId,
    status:  res.paymentStatus === 'paid' ? 'paid' : 'pending',
    meta: {
      paymentStatus: res.paymentStatus,
      orderStatus:   res.status,
      total:         res.total,
      currency:      res.currency,
    },
  };
}

type ChainsOrderStatus = {
  id: string;
  status: string;
  paymentStatus: string;
  total: number;
  currency: string;
  items: unknown[];
  mpesaRef: string | null;
  updatedAt: string;
};

export async function getChainsOrderStatus(orderId: string): Promise<ChainsOrderStatus | null> {
  return chainsGet<ChainsOrderStatus>(`/pos/public/orders/${orderId}/status`, { revalidate: 0 }).catch(() => null);
}

export async function getChainsCustomerOrders(customerToken: string): Promise<Order[]> {
  const res = await chainsGet<Array<{ id: string; status: string; paymentStatus: string; total: number; currency: string; createdAt: string }>>(
    '/pos/public/orders',
    { revalidate: 0, customerToken }
  ).catch(() => []);
  return res.map((o) => ({
    id:         o.id,
    status:     o.paymentStatus === 'paid' ? 'paid' : o.status,
    created_at: o.createdAt,
    meta: { paymentStatus: o.paymentStatus, orderStatus: o.status, total: o.total, currency: o.currency },
  }));
}

// ─── Stubs for Fleetbase-only features not applicable in chains mode ──────────

export async function getChainsRequestSmsLogin(
  _body: unknown
): Promise<{ ok: boolean }> { return { ok: false }; }

export async function getChainsVerifyCustomerCode(
  _body: unknown
): Promise<{ token: string; customer: Customer | null }> { return { token: '', customer: null }; }

export async function getChainsServiceQuote(
  _query: Record<string, unknown>
): Promise<ServiceQuote | null> { return null; }

export async function getChainsBeforeCheckout(
  _query: Record<string, unknown>
): Promise<Record<string, unknown>> { return {}; }

export async function getChainsUpdateStripeIntent(
  _body: unknown
): Promise<Record<string, unknown>> { return {}; }
