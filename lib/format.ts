export function formatMoney(value?: number | null, currency = 'USD') {
  const amount = Number(value ?? 0) / 100;

  return new Intl.NumberFormat(undefined, {
    style: 'currency',
    currency
  }).format(amount);
}

export function productPrice(product: { price?: number; sale_price?: number | null; currency?: string }) {
  return formatMoney(product.sale_price ?? product.price ?? 0, product.currency ?? 'USD');
}

export function compact<T>(items: Array<T | null | undefined>): T[] {
  return items.filter(Boolean) as T[];
}
