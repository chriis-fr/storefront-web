import React from 'react';
import type { StorefrontPlugin } from './types';

function PromoBanner() {
  const message = process.env.NEXT_PUBLIC_PROMO_BANNER;

  if (!message) {
    return null;
  }

  return (
    <div style={{ background: 'var(--primary)', color: 'var(--primary-contrast)', padding: '10px 16px', textAlign: 'center', fontWeight: 700 }}>
      {message}
    </div>
  );
}

export const promoBannerPlugin: StorefrontPlugin = {
  id: 'promo-banner',
  name: 'Promotional Banner',
  slots: {
    'Header.before': [PromoBanner]
  }
};
