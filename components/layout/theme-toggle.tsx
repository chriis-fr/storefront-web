'use client';

import { useEffect, useState } from 'react';
import { Sun, Moon } from 'lucide-react';

/** Light/dark switch. Persists the choice and toggles the `dark` class that
 *  globals.css keys its dark tokens off. Pre-paint is handled by ThemeScript. */
export function ThemeToggle() {
  const [dark, setDark] = useState<boolean | null>(null);

  useEffect(() => {
    setDark(document.documentElement.classList.contains('dark'));
  }, []);

  function toggle() {
    const next = !document.documentElement.classList.contains('dark');
    document.documentElement.classList.toggle('dark', next);
    try { localStorage.setItem('storefront.mode', next ? 'dark' : 'light'); } catch { /* ignore */ }
    setDark(next);
  }

  return (
    <button
      type="button"
      onClick={toggle}
      className="button ghost"
      aria-label={dark ? 'Switch to light mode' : 'Switch to dark mode'}
      style={{ minHeight: 40, padding: '0 10px' }}
    >
      {dark ? <Sun size={18} /> : <Moon size={18} />}
    </button>
  );
}
