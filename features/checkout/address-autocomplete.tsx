'use client';

import { useEffect, useRef, useState } from 'react';
import { MapPin, LocateFixed, Loader2, Check } from 'lucide-react';

type Suggestion = { label: string; lat: number; lon: number };
export type AddressValue = { text: string; lat?: number; lon?: number };

/**
 * Address field with place-search autocomplete (Geoapify, proxied server-side)
 * plus a one-tap "use my current location" button (browser Geolocation →
 * reverse geocode). Emits the chosen text and, when available, coordinates so
 * the order can carry a real, traceable pin.
 */
export function AddressAutocomplete({
  value,
  onChange,
  placeholder,
}: {
  value: AddressValue;
  onChange: (v: AddressValue) => void;
  placeholder?: string;
}) {
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [locating, setLocating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const ref = useRef<HTMLDivElement>(null);
  const debounce = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const onDoc = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false); };
    document.addEventListener('mousedown', onDoc);
    return () => document.removeEventListener('mousedown', onDoc);
  }, []);

  function handleType(text: string) {
    onChange({ text }); // typing clears the pin until a place/location is chosen
    setError(null);
    if (debounce.current) clearTimeout(debounce.current);
    if (text.trim().length < 3) { setSuggestions([]); setOpen(false); return; }
    debounce.current = setTimeout(async () => {
      setLoading(true);
      try {
        const res = await fetch(`/api/storefront/geo/autocomplete?text=${encodeURIComponent(text)}`);
        const data = await res.json();
        const next: Suggestion[] = data.suggestions ?? [];
        setSuggestions(next);
        setOpen(next.length > 0);
      } catch {
        setSuggestions([]);
      } finally {
        setLoading(false);
      }
    }, 300);
  }

  function choose(s: Suggestion) {
    onChange({ text: s.label, lat: s.lat, lon: s.lon });
    setSuggestions([]);
    setOpen(false);
  }

  function useMyLocation() {
    if (typeof navigator === 'undefined' || !navigator.geolocation) {
      setError('Location is not supported on this device.');
      return;
    }
    setLocating(true);
    setError(null);
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const { latitude, longitude } = pos.coords;
        try {
          const res = await fetch(`/api/storefront/geo/reverse?lat=${latitude}&lon=${longitude}`);
          const data = await res.json();
          onChange({ text: data.label ?? `${latitude.toFixed(5)}, ${longitude.toFixed(5)}`, lat: latitude, lon: longitude });
        } catch {
          onChange({ text: `${latitude.toFixed(5)}, ${longitude.toFixed(5)}`, lat: latitude, lon: longitude });
        } finally {
          setLocating(false);
          setOpen(false);
        }
      },
      (err) => {
        setLocating(false);
        setError(err.code === err.PERMISSION_DENIED ? 'Location permission denied.' : 'Could not get your location.');
      },
      { enableHighAccuracy: true, timeout: 10000 },
    );
  }

  const pinned = value.lat != null && value.lon != null;

  return (
    <div ref={ref} style={{ position: 'relative' }}>
      <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
        <MapPin size={16} style={{ position: 'absolute', left: 10, opacity: 0.5, pointerEvents: 'none' }} />
        <input
          className="field"
          value={value.text}
          placeholder={placeholder ?? 'Search your address or a nearby place'}
          style={{ paddingLeft: 32, paddingRight: 34 }}
          autoComplete="off"
          onChange={(e) => handleType(e.target.value)}
          onFocus={() => suggestions.length > 0 && setOpen(true)}
        />
        {loading
          ? <Loader2 size={16} style={{ position: 'absolute', right: 10, opacity: 0.6, animation: 'spin 1s linear infinite' }} />
          : pinned
          ? <Check size={16} style={{ position: 'absolute', right: 10, color: 'var(--success)' }} />
          : null}
      </div>

      <button type="button" onClick={useMyLocation} disabled={locating} className="button secondary" style={{ marginTop: 8, height: 38 }}>
        <LocateFixed size={16} /> {locating ? 'Locating…' : 'Use my current location'}
      </button>

      {error && <p style={{ margin: '6px 0 0', color: 'var(--error)', fontSize: 13 }}>{error}</p>}
      {!error && pinned && <p className="muted" style={{ margin: '6px 0 0', fontSize: 12 }}>Location pinned — the store can find you exactly.</p>}

      {open && suggestions.length > 0 && (
        <div
          role="listbox"
          style={{
            position: 'absolute', top: 46, left: 0, right: 0, zIndex: 50, background: 'var(--background)',
            border: '1px solid var(--border)', borderRadius: 'var(--radius)', boxShadow: 'var(--shadow)',
            padding: 6, maxHeight: 260, overflowY: 'auto',
          }}
        >
          {suggestions.map((s, i) => (
            <button
              type="button"
              key={`${s.lat},${s.lon},${i}`}
              onClick={() => choose(s)}
              className="button ghost"
              style={{ width: '100%', justifyContent: 'flex-start', gap: 10, textAlign: 'left', height: 'auto', minHeight: 40, padding: '8px 10px' }}
            >
              <MapPin size={15} style={{ flexShrink: 0, opacity: 0.6, marginTop: 2 }} />
              <span style={{ whiteSpace: 'normal', lineHeight: 1.3 }}>{s.label}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
