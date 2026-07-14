import { describe, expect, it } from 'vitest';
import { formatMoney } from '@/lib/format';

describe('formatMoney', () => {
  it('formats whole currency units (chains-api default — no cents scaling)', () => {
    // 250 whole units → "KES 250", not "2.50"
    expect(formatMoney(250, 'KES')).toContain('250');
    expect(formatMoney(1299, 'USD')).toContain('1,299');
  });

  it('uses the passed currency, falling back when absent', () => {
    expect(formatMoney(100, 'USD')).toContain('$');
    // No currency → falls back to the store currency (KES → "Ksh"), never USD
    const fallback = formatMoney(100);
    expect(fallback).toContain('100');
    expect(fallback).not.toContain('$');
  });
});
