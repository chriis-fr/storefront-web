'use client';

import { useRouter } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';

/** Goes back to the previous page, or to browse if there's no history. */
export function BackButton({ label = 'Back' }: { label?: string }) {
  const router = useRouter();
  return (
    <button
      type="button"
      className="button ghost"
      style={{ paddingLeft: 8, gap: 6 }}
      onClick={() => {
        if (typeof window !== 'undefined' && window.history.length > 1) router.back();
        else router.push('/search');
      }}
    >
      <ArrowLeft size={16} /> {label}
    </button>
  );
}
