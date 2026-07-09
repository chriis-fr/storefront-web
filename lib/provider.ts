// Single import point for all storefront data.
//
// Backend selection (checked once at module load):
//   CHAINS_API_URL + CHAINS_STOREFRONT_KEY  →  chains-api adapter
//   FLEETBASE_HOST + STOREFRONT_KEY          →  Fleetbase adapter
//
// Every page imports from here. No UI changes needed to switch backends.

import type {
  Cart,
  Customer,
  NetworkStore,
  Order,
  PaymentGateway,
  ServiceQuote,
  StorefrontAbout,
  StorefrontCategory,
  StorefrontProduct,
} from '@/lib/types';

import * as fleetbase from './fleetbase/storefront';
import * as chains    from './chains/index';
import { FLEETBASE_ENABLED } from './runtime';

const USE_CHAINS           = !!(process.env.CHAINS_API_URL && process.env.CHAINS_STOREFRONT_KEY);
const USE_FLEETBASE_DELIVERY = USE_CHAINS && FLEETBASE_ENABLED;

// ─── Store info ───────────────────────────────────────────────────────────────

export async function getStorefrontAbout(): Promise<StorefrontAbout> {
  return USE_CHAINS ? chains.getChainsAbout() : fleetbase.getStorefrontAbout();
}

// ─── Catalog ──────────────────────────────────────────────────────────────────

export async function getProducts(query: Record<string, unknown> = {}): Promise<StorefrontProduct[]> {
  return USE_CHAINS ? chains.getChainsProducts(query) : fleetbase.getProducts(query);
}

export async function getProduct(id: string): Promise<StorefrontProduct | null> {
  if (USE_CHAINS) return chains.getChainsProduct(id);
  return (fleetbase.getProduct(id) as Promise<StorefrontProduct>).catch(() => null);
}

export async function getCategories(query: Record<string, unknown> = {}): Promise<StorefrontCategory[]> {
  return USE_CHAINS ? chains.getChainsCategories(query) : fleetbase.getCategories(query);
}

export async function searchProducts(query: string, _options: Record<string, unknown> = {}): Promise<StorefrontProduct[]> {
  if (USE_CHAINS) return chains.getChainsSearchProducts(query);
  return fleetbase.searchProducts(query, _options);
}

export async function getNetworkStores(): Promise<NetworkStore[]> {
  return USE_CHAINS ? chains.getChainsNetworkStores() : fleetbase.getNetworkStores();
}

// ─── Gateways & cart ─────────────────────────────────────────────────────────

export async function getGateways(): Promise<PaymentGateway[]> {
  return USE_CHAINS ? chains.getChainsGateways() : fleetbase.getGateways();
}

export async function getCart(cartId?: string | null): Promise<Cart | null> {
  if (USE_CHAINS) return chains.getChainsCart(cartId);
  return (fleetbase.getCart(cartId) as Promise<Cart>).catch(() => null);
}

export async function addCartItem(cartId: string, productId: string, body: { quantity?: number }): Promise<Cart | null> {
  if (USE_CHAINS) return chains.getChainsAddCartItem(cartId, productId, body);
  return (fleetbase.addCartItem(cartId, productId, body) as Promise<Cart>).catch(() => null);
}

export async function updateCartItem(cartId: string, lineItemId: string, body: { quantity?: number }): Promise<Cart | null> {
  if (USE_CHAINS) return chains.getChainsUpdateCartItem(cartId, lineItemId, body);
  return (fleetbase.updateCartItem(cartId, lineItemId, body) as Promise<Cart>).catch(() => null);
}

export async function removeCartItem(cartId: string, lineItemId: string): Promise<Cart | null> {
  if (USE_CHAINS) return chains.getChainsRemoveCartItem(cartId, lineItemId);
  return (fleetbase.removeCartItem(cartId, lineItemId) as Promise<Cart>).catch(() => null);
}

export async function emptyCart(cartId: string): Promise<Cart | null> {
  if (USE_CHAINS) return chains.getChainsEmptyCart(cartId);
  return (fleetbase.emptyCart(cartId) as Promise<Cart>).catch(() => null);
}

// ─── Customer auth ────────────────────────────────────────────────────────────

export async function registerCustomer(body: {
  phone?: string;
  email?: string;
  password: string;
}): Promise<{ token: string; customer: Customer | null }> {
  if (USE_CHAINS) return chains.getChainsRegisterCustomer(body);
  return { token: '', customer: null };
}

export async function loginCustomer(body: {
  identity?: string;
  phone?: string;
  email?: string;
  password: string;
}): Promise<{ token: string; customer: Customer | null }> {
  if (USE_CHAINS) return chains.getChainsLoginCustomer(body);
  return fleetbase.loginCustomer(body) as Promise<{ token: string; customer: Customer | null }>;
}

export async function getCustomerProfile(customerToken: string): Promise<Customer | null> {
  if (USE_CHAINS) return chains.getChainsCustomerProfile(customerToken);
  return null;
}

export async function updateCustomer(
  customerToken: string,
  body: { name?: string; address?: Record<string, unknown> }
): Promise<Customer | null> {
  if (USE_CHAINS) return chains.getChainsUpdateCustomer(customerToken, body);
  return null;
}

export async function requestSmsLogin(body: unknown): Promise<{ ok: boolean }> {
  if (USE_CHAINS) return { ok: false };
  return fleetbase.requestSmsLogin(body);
}

export async function verifyCustomerCode(body: unknown): Promise<{ token: string; customer: Customer | null }> {
  if (USE_CHAINS) return { token: '', customer: null };
  return fleetbase.verifyCustomerCode(body) as Promise<{ token: string; customer: Customer | null }>;
}

export async function getCustomerOrders(customerToken?: string): Promise<Order[]> {
  if (USE_CHAINS) return chains.getChainsCustomerOrders(customerToken ?? '');
  return fleetbase.getCustomerOrders();
}

// ─── Checkout ─────────────────────────────────────────────────────────────────

export async function getServiceQuoteFromCart(query: Record<string, unknown>): Promise<ServiceQuote | null> {
  if (USE_FLEETBASE_DELIVERY) return (fleetbase.getServiceQuoteFromCart(query) as Promise<ServiceQuote>).catch(() => null);
  if (USE_CHAINS) return null;
  return (fleetbase.getServiceQuoteFromCart(query) as Promise<ServiceQuote>).catch(() => null);
}

export async function beforeCheckout(query: Record<string, unknown>): Promise<Record<string, unknown>> {
  if (USE_CHAINS) return {};
  if (USE_FLEETBASE_DELIVERY) return fleetbase.beforeCheckout(query);
  return fleetbase.beforeCheckout(query);
}

export async function updateStripePaymentIntent(body: unknown): Promise<Record<string, unknown>> {
  if (USE_CHAINS) return {};
  return fleetbase.updateStripePaymentIntent(body);
}

export async function placeOrder(
  cartId: string,
  body: {
    isPickup?: boolean;
    mpesaPhone?: string;
    deliveryAddress?: Record<string, unknown>;
    notes?: string;
  },
  customerToken: string
): Promise<Order | null> {
  if (USE_CHAINS) return chains.getChainsPlaceOrder(cartId, body, customerToken);
  return null;
}

export async function getOrderStatus(orderId: string): Promise<{
  id: string;
  status: string;
  paymentStatus: string;
  total: number;
  currency: string;
  items: unknown[];
  mpesaRef: string | null;
  updatedAt: string;
} | null> {
  if (USE_CHAINS) return chains.getChainsOrderStatus(orderId);
  return null;
}

export async function captureCheckout(body: unknown): Promise<Order | null> {
  if (USE_FLEETBASE_DELIVERY) return (fleetbase.captureCheckout(body) as Promise<Order>).catch(() => null);
  if (USE_CHAINS) return null;
  return (fleetbase.captureCheckout(body) as Promise<Order>).catch(() => null);
}
