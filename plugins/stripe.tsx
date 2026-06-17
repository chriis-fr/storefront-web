import React from 'react';
import type { StorefrontPlugin } from './types';

function StripePaymentHint() {
  return <p className="muted">Secure card payments are processed by Stripe when this gateway is enabled.</p>;
}

export const stripePlugin: StorefrontPlugin = {
  id: 'stripe',
  name: 'Stripe Payments',
  slots: {
    'Checkout.paymentMethods': [StripePaymentHint]
  }
};
