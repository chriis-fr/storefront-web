import type { StorefrontPlugin } from '@/plugins/types';
import { validateServerEnv } from '@/lib/runtime';

export type StorefrontWebConfig = {
  name: string;
  defaultLocale: string;
  defaultTheme: string;
  routes: {
    home: string;
    cart: string;
    checkout: string;
    account: string;
    orders: string;
  };
  features: {
    search: boolean;
    customerAccounts: boolean;
    pickup: boolean;
    delivery: boolean;
    tips: boolean;
    orderHistory: boolean;
    marketplace: boolean;
  };
  plugins: StorefrontPlugin[];
};

export function requireEnv(name: string): string {
  const value = process.env[name];

  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }

  return value;
}

export { validateServerEnv };
