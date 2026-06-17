import { describe, expect, it } from 'vitest';
import { getThemeCssVariables } from '@/lib/theme';

describe('theme variables', () => {
  it('returns default CSS variables for unknown themes', () => {
    expect(getThemeCssVariables('missing')).toMatchObject({
      '--primary': '#0f766e'
    });
  });
});
