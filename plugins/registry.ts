import config from '@/storefront.config';
import type { SlotName, StorefrontPlugin } from './types';

export function getPlugins(): StorefrontPlugin[] {
  return config.plugins;
}

export function getSlotComponents(slot: SlotName) {
  return getPlugins().flatMap((plugin) => plugin.slots?.[slot] ?? []);
}

export async function runBeforeCheckoutCaptureHooks(payload: unknown) {
  let finalPayload = payload;

  for (const plugin of getPlugins()) {
    if (plugin.serverHooks?.beforeCheckoutCapture) {
      finalPayload = await plugin.serverHooks.beforeCheckoutCapture(finalPayload);
    }
  }

  return finalPayload;
}

export async function runAfterOrderPlacedHooks(order: unknown) {
  for (const plugin of getPlugins()) {
    await plugin.serverHooks?.afterOrderPlaced?.(order);
  }
}
