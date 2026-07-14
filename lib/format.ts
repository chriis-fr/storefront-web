// ─── Money formatting — the ONE place amounts are scaled + given a currency ───
//
// chains-api returns amounts in WHOLE currency units (e.g. 250 = KES 250), and
// charges M-Pesa that same whole amount. The legacy Fleetbase backend returned
// MINOR units (cents). So the scaling divisor is backend-dependent:
//   • chains (default)      → divide by 1   (no scaling)
//   • Fleetbase/minor units → set NEXT_PUBLIC_MONEY_MINOR_UNITS=true → divide by 100
const MINOR_UNITS = process.env.NEXT_PUBLIC_MONEY_MINOR_UNITS === 'true' ? 100 : 1;

// Fallback only. The store's real currency is stamped onto products/cart/order
// by the provider and passed in explicitly at each call site; this is the floor
// used when a caller genuinely has none.
const FALLBACK_CURRENCY = process.env.NEXT_PUBLIC_STORE_CURRENCY || 'KES';

export function formatMoney(value?: number | null, currency?: string | null) {
  const amount = Number(value ?? 0) / MINOR_UNITS;
  return new Intl.NumberFormat(undefined, {
    style: 'currency',
    currency: currency || FALLBACK_CURRENCY,
  }).format(amount);
}

export function productPrice(product: { price?: number; sale_price?: number | null; currency?: string }) {
  return formatMoney(product.sale_price ?? product.price ?? 0, product.currency);
}

export function compact<T>(items: Array<T | null | undefined>): T[] {
  return items.filter(Boolean) as T[];
}
