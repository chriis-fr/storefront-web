'use client';

import config from '@/storefront.config';

export function PluginProvider({ children }: { children: React.ReactNode }) {
  return config.plugins.reduceRight((tree, plugin) => {
    const providers = plugin.clientProviders ?? [];
    return providers.reduceRight((innerTree, Provider) => <Provider>{innerTree}</Provider>, tree);
  }, children);
}
