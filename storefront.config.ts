import type { StorefrontWebConfig } from './lib/config';
import { analyticsPlugin } from './plugins/analytics';
import { promoBannerPlugin } from './plugins/promo-banner';
import { stripePlugin } from './plugins/stripe';

const config: StorefrontWebConfig = {
  name: 'Chains-ERP Storefront Web',
  defaultLocale: process.env.NEXT_PUBLIC_DEFAULT_LOCALE ?? 'en',
  defaultTheme: process.env.NEXT_PUBLIC_DEFAULT_THEME ?? 'default',
  routes: {
    home: '/',
    cart: '/cart',
    checkout: '/checkout',
    account: '/account',
    orders: '/orders'
  },
  features: {
    search: true,
    customerAccounts: true,
    pickup: true,
    delivery: true,
    tips: true,
    orderHistory: true,
    marketplace: true,
  },
  paymentMethods: {
    mpesa:   true,
    bank:    false,
    card:    false,
    cash:    false,
    bitcoin: false,
  },
  plugins: [stripePlugin, promoBannerPlugin, analyticsPlugin]
};

export default config;
