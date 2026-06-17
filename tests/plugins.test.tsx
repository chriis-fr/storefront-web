import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it, vi } from 'vitest';
import { Slot } from '@/components/plugin-slot';
import { runAfterOrderPlacedHooks, runBeforeCheckoutCaptureHooks } from '@/plugins/registry';

describe('plugin registry', () => {
  it('renders registered slot components', () => {
    const html = renderToStaticMarkup(<Slot name="Checkout.paymentMethods" />);

    expect(html).toContain('Secure card payments');
  });

  it('runs checkout hooks in registration order', async () => {
    const info = vi.spyOn(console, 'info').mockImplementation(() => undefined);
    const payload = { token: 'checkout_test' };

    await expect(runBeforeCheckoutCaptureHooks(payload)).resolves.toBe(payload);
    await runAfterOrderPlacedHooks({ id: 'order_test' });

    expect(info).toHaveBeenCalledWith('[storefront-web] order placed', { id: 'order_test' });
    info.mockRestore();
  });
});
