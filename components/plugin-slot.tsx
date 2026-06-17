import React from 'react';
import type { SlotName } from '@/plugins/types';
import { getSlotComponents } from '@/plugins/registry';

export function Slot({ name, props = {} }: { name: SlotName; props?: Record<string, unknown> }) {
  const components = getSlotComponents(name);

  return (
    <>
      {components.map((Component, index) => (
        <Component key={`${name}-${index}`} {...props} />
      ))}
    </>
  );
}
