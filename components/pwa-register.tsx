'use client';

import { useEffect } from 'react';

/** Registers the service worker so the storefront is installable + offline-capable.
 *  Only on secure contexts (https / localhost). Safe no-op where unsupported. */
export function PwaRegister() {
  useEffect(() => {
    if (typeof navigator === 'undefined' || !('serviceWorker' in navigator)) return;
    const isSecure = window.isSecureContext || location.hostname === 'localhost' || location.hostname === '127.0.0.1';
    if (!isSecure) return;
    const register = () => navigator.serviceWorker.register('/sw.js').catch(() => { /* ignore */ });
    if (document.readyState === 'complete') register();
    else window.addEventListener('load', register, { once: true });
  }, []);

  return null;
}
