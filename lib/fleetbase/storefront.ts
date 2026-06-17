import type {
  Cart,
  Customer,
  NetworkStore,
  Order,
  PaymentGateway,
  ServiceQuote,
  StorefrontAbout,
  StorefrontCategory,
  StorefrontProduct
} from '@/lib/types';
import { storefrontRequest } from './server';

export async function getStorefrontAbout() {
  return storefrontRequest<StorefrontAbout>('about', { next: { revalidate: 120, tags: ['storefront-about'] } });
}

export async function getProducts(query: Record<string, unknown> = {}) {
  return storefrontRequest<StorefrontProduct[]>('products', { query, next: { revalidate: 60, tags: ['storefront-products'] } });
}

export async function getProduct(id: string) {
  return storefrontRequest<StorefrontProduct>(`products/${id}`, { next: { revalidate: 60, tags: [`storefront-product-${id}`] } });
}

export async function getCategories(query: Record<string, unknown> = {}) {
  return storefrontRequest<StorefrontCategory[]>('categories', { query, next: { revalidate: 120, tags: ['storefront-categories'] } });
}

export async function searchProducts(query: string, options: Record<string, unknown> = {}) {
  return storefrontRequest<StorefrontProduct[]>('search', { query: { query, ...options }, cache: 'no-store' });
}

export async function getNetworkStores() {
  return storefrontRequest<NetworkStore[]>('stores', { next: { revalidate: 120, tags: ['storefront-network-stores'] } });
}

export async function getGateways() {
  return storefrontRequest<PaymentGateway[]>('gateways', { cache: 'no-store' });
}

export async function getCart(cartId?: string | null) {
  return storefrontRequest<Cart>(cartId ? `carts/${cartId}` : 'carts', { cache: 'no-store' });
}

export async function addCartItem(cartId: string, productId: string, body: unknown) {
  return storefrontRequest<Cart>(`carts/${cartId}/${productId}`, { method: 'POST', body });
}

export async function updateCartItem(cartId: string, lineItemId: string, body: unknown) {
  return storefrontRequest<Cart>(`carts/${cartId}/${lineItemId}`, { method: 'PUT', body });
}

export async function removeCartItem(cartId: string, lineItemId: string) {
  return storefrontRequest<Cart>(`carts/${cartId}/${lineItemId}`, { method: 'DELETE' });
}

export async function emptyCart(cartId: string) {
  return storefrontRequest<Cart>(`carts/${cartId}/empty`, { method: 'PUT', body: {} });
}

export async function loginCustomer(body: unknown) {
  return storefrontRequest<{ token: string; customer: Customer }>('customers/login', { method: 'POST', body, customerToken: null });
}

export async function requestSmsLogin(body: unknown) {
  return storefrontRequest<{ ok: boolean }>('customers/login-with-sms', { method: 'POST', body, customerToken: null });
}

export async function verifyCustomerCode(body: unknown) {
  return storefrontRequest<{ token: string; customer: Customer }>('customers/verify-code', { method: 'POST', body, customerToken: null });
}

export async function getCustomerOrders() {
  return storefrontRequest<Order[]>('customers/orders', { cache: 'no-store' });
}

export async function getServiceQuoteFromCart(query: Record<string, unknown>) {
  return storefrontRequest<ServiceQuote>('service-quotes/from-cart', { query, cache: 'no-store' });
}

export async function beforeCheckout(query: Record<string, unknown>) {
  return storefrontRequest<Record<string, unknown>>('checkouts/before', { query, cache: 'no-store' });
}

export async function updateStripePaymentIntent(body: unknown) {
  return storefrontRequest<Record<string, unknown>>('checkouts/stripe-update-payment-intent', { method: 'PUT', body });
}

export async function captureCheckout(body: unknown) {
  return storefrontRequest<Order>('checkouts/capture', { method: 'POST', body });
}
