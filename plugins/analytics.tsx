import type { StorefrontPlugin } from './types';

export const analyticsPlugin: StorefrontPlugin = {
  id: 'analytics',
  name: 'Analytics Hooks',
  serverHooks: {
    afterOrderPlaced(order) {
      console.info('[storefront-web] order placed', order);
    }
  }
};
