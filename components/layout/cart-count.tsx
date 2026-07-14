'use client';

import { useCallback, useEffect, useState } from 'react';

/**
 * Badge on the header cart button showing the number of DISTINCT products in the
 * cart — not total quantity. Two different products → 2; one product added five
 * times → 1. Refreshes on load and whenever a `cart:updated` event fires.
 */
export function CartCount() {
  const [count, setCount] = useState<number | null>(null);

  const load = useCallback(() => {
    fetch('/api/storefront/cart')
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        const cart = data?.cart;
        setCount(cart ? (cart.total_unique_items ?? cart.items?.length ?? 0) : 0);
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    load();
    const onUpdate = () => load();
    window.addEventListener('cart:updated', onUpdate);
    return () => window.removeEventListener('cart:updated', onUpdate);
  }, [load]);

  if (!count) return null;
  return (
    <span
      aria-label={`${count} product${count === 1 ? '' : 's'} in cart`}
      style={{
        minWidth: 18, height: 18, padding: '0 5px', borderRadius: 9, background: 'var(--primary)',
        color: 'var(--primary-contrast)', fontSize: 11, fontWeight: 700, display: 'inline-flex', alignItems: 'center',
        justifyContent: 'center', lineHeight: 1,
      }}
    >
      {count}
    </span>
  );
}
