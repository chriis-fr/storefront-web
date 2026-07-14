// Category-aware placeholder for products with no image.
//
// A storefront should never show an empty grey box — so when a product has no
// photo we render an emoji + soft tint that matches its category, so it still
// reads at a glance and search-by-category still surfaces it. Keyword-matched
// (not an exact category list) so it works for any store's naming.

export type CategoryVisual = { emoji: string; bg: string };

const RULES: Array<{ test: RegExp; emoji: string; bg: string }> = [
  { test: /coffee|tea|cafe|espresso|latte/,                     emoji: '☕', bg: '#efe6dd' },
  { test: /beer|wine|spirit|whisky|vodka|liquor|bar\b/,         emoji: '🍺', bg: '#f3e9cf' },
  { test: /drink|soda|juice|water|beverage|smoothie/,           emoji: '🥤', bg: '#e0f0f5' },
  { test: /dessert|cake|sweet|ice.?cream|pastry|donut/,         emoji: '🍰', bg: '#f7e3ea' },
  { test: /snack|burger|fries|pizza|fast|chips/,                emoji: '🍔', bg: '#f6ead9' },
  { test: /fruit|veg|grocer|fresh|produce/,                     emoji: '🥦', bg: '#e6f2e2' },
  { test: /meat|chicken|fish|grill|bbq|seafood/,                emoji: '🍗', bg: '#f4e5df' },
  { test: /food|meal|kitchen|lunch|dinner|rice|dish/,           emoji: '🍽️', bg: '#eef0f2' },
  { test: /fashion|cloth|wear|shoe|apparel|shirt/,              emoji: '👕', bg: '#e9eaf3' },
  { test: /electro|phone|gadget|tech|device|laptop/,            emoji: '📱', bg: '#e6eaf0' },
  { test: /beauty|cosmetic|makeup|skin|hair/,                   emoji: '💄', bg: '#f6e6ee' },
  { test: /pharma|health|medic|drug|clinic/,                    emoji: '💊', bg: '#e4eef0' },
];

const DEFAULT: CategoryVisual = { emoji: '🛍️', bg: '#eeeeee' };

/** Emoji + tint for a category (or product) name — falls back to a shopping bag. */
export function categoryVisual(name?: string | null): CategoryVisual {
  const n = (name ?? '').toLowerCase();
  for (const r of RULES) if (r.test.test(n)) return { emoji: r.emoji, bg: r.bg };
  return DEFAULT;
}
