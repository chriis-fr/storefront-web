import { NextResponse } from 'next/server';

// Reverse geocode (lat/lon → address), proxied server-side.
//   • GEOAPIFY_KEY set → Geoapify.
//   • Otherwise → Photon (no key).
// Falls back to raw coordinates as the label if both are unavailable — the pin
// is still usable for delivery either way.
async function geoapifyLabel(lat: number, lon: number, key: string): Promise<string | null> {
  const res = await fetch(
    `https://api.geoapify.com/v1/geocode/reverse?lat=${lat}&lon=${lon}&apiKey=${key}&format=json&limit=1`,
    { cache: 'no-store' },
  );
  const data = (await res.json()) as { results?: Array<{ formatted?: string }> };
  return data.results?.[0]?.formatted ?? null;
}

async function photonLabelFor(lat: number, lon: number): Promise<string | null> {
  const res = await fetch(`https://photon.komoot.io/reverse?lat=${lat}&lon=${lon}`, { cache: 'no-store' });
  const data = (await res.json()) as { features?: Array<{ properties?: Record<string, string | undefined> }> };
  const p = data.features?.[0]?.properties;
  if (!p) return null;
  const line1 = p.name || [p.housenumber, p.street].filter(Boolean).join(' ');
  return [line1, p.city || p.town || p.village, p.state, p.country].filter(Boolean).join(', ') || null;
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const lat = Number(searchParams.get('lat'));
  const lon = Number(searchParams.get('lon'));
  if (!Number.isFinite(lat) || !Number.isFinite(lon)) {
    return NextResponse.json({ error: 'lat and lon required' }, { status: 400 });
  }

  const coordsLabel = `${lat.toFixed(5)}, ${lon.toFixed(5)}`;
  const key = process.env.GEOAPIFY_KEY;
  try {
    const label = key ? await geoapifyLabel(lat, lon, key) : await photonLabelFor(lat, lon);
    return NextResponse.json({ label: label ?? coordsLabel, lat, lon });
  } catch {
    return NextResponse.json({ label: coordsLabel, lat, lon });
  }
}
