'use client';

import Link from 'next/link';
import { useMemo, useState } from 'react';
import { ShoppingCart, Minus, Plus, Check } from 'lucide-react';
import type { ProductAddon, ProductVariantOption, StorefrontProduct } from '@/lib/types';
import { formatMoney } from '@/lib/format';

type SelectionState = Record<string, string | string[]>;

export function AddToCartForm({ product }: { product: StorefrontProduct }) {
  const [quantity, setQuantity] = useState(1);
  const [variants, setVariants] = useState<SelectionState>({});
  const [addons, setAddons] = useState<SelectionState>({});
  const [error, setError] = useState<string | null>(null);
  const [added, setAdded] = useState(false);
  const [loading, setLoading] = useState(false);

  const optionTotal = useMemo(() => {
    let total = product.sale_price ?? product.price ?? 0;
    const selectedVariantIds = new Set(Object.values(variants).flat());
    const selectedAddonIds = new Set(Object.values(addons).flat());

    product.variants?.forEach((variant) => {
      variant.options?.forEach((option) => {
        if (selectedVariantIds.has(option.id)) {
          total += option.price ?? 0;
        }
      });
    });

    product.addon_categories?.forEach((category) => {
      category.addons?.forEach((addon) => {
        if (selectedAddonIds.has(addon.id)) {
          total += addon.price ?? 0;
        }
      });
    });

    return total * quantity;
  }, [addons, product, quantity, variants]);

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/storefront/cart/items', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          productId: product.id,
          quantity,
          variants: serializeSelections(product.variants?.flatMap((variant) => variant.options ?? []) ?? [], variants),
          addons: serializeSelections(product.addon_categories?.flatMap((category) => category.addons ?? []) ?? [], addons)
        })
      });
      const payload = await response.json();

      if (!response.ok) {
        throw new Error(payload.error ?? 'Unable to add this product to cart.');
      }

      setAdded(true);
      // Tell the header cart badge to refresh immediately.
      window.dispatchEvent(new Event('cart:updated'));
    } catch (error) {
      setAdded(false);
      setError(error instanceof Error ? error.message : 'Unable to add this product to cart.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={submit} className="stack" style={{ border: '1px solid var(--border)', borderRadius: 'var(--radius)', padding: 16, background: 'var(--surface)' }}>
      {product.variants?.map((variant) => (
        <label key={variant.id} className="stack" style={{ gap: 8 }}>
          <strong>{variant.name}</strong>
          <select className="field" required={variant.required} value={(variants[variant.id] as string) ?? ''} onChange={(event) => setVariants((current) => ({ ...current, [variant.id]: event.target.value }))}>
            <option value="">Choose an option</option>
            {variant.options?.map((option) => (
              <option key={option.id} value={option.id}>
                {option.name} {option.price ? `+ ${formatMoney(option.price, product.currency)}` : ''}
              </option>
            ))}
          </select>
        </label>
      ))}
      {product.addon_categories?.map((category) => (
        <fieldset key={category.id} style={{ border: 0, padding: 0, margin: 0 }}>
          <legend style={{ fontWeight: 700, marginBottom: 8 }}>{category.name}</legend>
          <div className="stack" style={{ gap: 8 }}>
            {category.addons?.map((addon) => (
              <label key={addon.id} style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                <input
                  type={category.multi_select === false ? 'radio' : 'checkbox'}
                  name={category.id}
                  value={addon.id}
                  onChange={(event) => updateAddonSelection(event, category.id, addon.id, category.multi_select !== false, setAddons)}
                />
                <span>{addon.name}</span>
                {addon.price ? <span className="muted">+ {formatMoney(addon.price, product.currency)}</span> : null}
              </label>
            ))}
          </div>
        </fieldset>
      ))}
      <div className="stack" style={{ gap: 8 }}>
        <strong>Quantity</strong>
        <div style={{ display: 'inline-flex', alignItems: 'center', border: '1px solid var(--border)', borderRadius: 'var(--radius)', width: 'max-content', overflow: 'hidden', background: 'var(--background)' }}>
          <button type="button" aria-label="Decrease quantity" onClick={() => setQuantity((q) => Math.max(1, q - 1))}
            style={{ minWidth: 44, height: 42, border: 'none', background: 'transparent', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', color: 'inherit' }}>
            <Minus size={16} />
          </button>
          <span style={{ minWidth: 44, textAlign: 'center', fontWeight: 700, fontVariantNumeric: 'tabular-nums' }}>{quantity}</span>
          <button type="button" aria-label="Increase quantity" onClick={() => setQuantity((q) => q + 1)}
            style={{ minWidth: 44, height: 42, border: 'none', background: 'transparent', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', color: 'inherit' }}>
            <Plus size={16} />
          </button>
        </div>
      </div>

      <button className="button" disabled={loading || product.is_available === false} style={{ height: 48, fontSize: '1rem' }}>
        <ShoppingCart size={18} />
        {product.is_available === false ? 'Out of stock' : loading ? 'Adding…' : `Add to cart · ${formatMoney(optionTotal, product.currency)}`}
      </button>

      {added && (
        <p role="status" style={{ margin: 0, display: 'flex', alignItems: 'center', gap: 8, color: 'var(--success)', fontWeight: 600 }}>
          <Check size={16} /> Added to cart
          <Link href="/cart" style={{ color: 'var(--primary)', marginLeft: 'auto' }}>View cart →</Link>
        </p>
      )}
      {error && <p role="status" style={{ margin: 0, color: 'var(--error)' }}>{error}</p>}
    </form>
  );
}

function serializeSelections<T extends ProductVariantOption | ProductAddon>(options: T[], selections: SelectionState) {
  const selectedIds = new Set(Object.values(selections).flat());
  return options.filter((option) => selectedIds.has(option.id));
}

function updateAddonSelection(
  event: React.ChangeEvent<HTMLInputElement>,
  categoryId: string,
  addonId: string,
  multi: boolean,
  setAddons: React.Dispatch<React.SetStateAction<SelectionState>>
) {
  setAddons((current) => {
    if (!multi) {
      return { ...current, [categoryId]: addonId };
    }

    const existing = Array.isArray(current[categoryId]) ? current[categoryId] as string[] : [];
    const next = event.target.checked ? [...existing, addonId] : existing.filter((id) => id !== addonId);
    return { ...current, [categoryId]: next };
  });
}
