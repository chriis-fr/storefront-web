import { describe, expect, it } from 'vitest';
import { formatMoney } from '@/lib/format';

describe('formatMoney', () => {
  it('formats minor units as currency', () => {
    expect(formatMoney(1299, 'USD')).toContain('12.99');
  });
});
