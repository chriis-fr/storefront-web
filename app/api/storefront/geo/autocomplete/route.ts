import { NextResponse } from 'next/server';

// Address autocomplete, proxied server-side.
//   • If GEOAPIFY_KEY is set → Geoapify (better limits/coverage).
//   • Otherwise → Photon (komoot), a free OSM geocoder that needs NO key —
//     so search works out of the box with zero setup.
// Optional NEXT_PUBLIC_GEO_COUNTRY biases Geoapify results (e.g. "ke").
type Suggestion = { label: string; lat: number; lon: number };

async function fromGeoapify(text: string, key: string): Promise<Suggestion[]> {
  const params = new URLSearchParams({ text, apiKey: key, limit: '6', format: 'json' });
  const country = process.env.NEXT_PUBLIC_GEO_COUNTRY?.trim();
  if (country) params.set('filter', `countrycode:${country}`);
  const res = await fetch(`https://api.geoapify.com/v1/geocode/autocomplete?${params}`, { cache: 'no-store' });
  const data = (await res.json()) as { results?: Array<{ formatted?: string; lat?: number; lon?: number }> };
  return (data.results ?? [])
    .filter((r) => r.formatted && r.lat != null && r.lon != null)
    .map((r) => ({ label: r.formatted as string, lat: r.lat as number, lon: r.lon as number }));
}

type PhotonFeature = {
  properties?: Record<string, string | undefined>;
  geometry?: { coordinates?: number[] };
};

function photonLabel(p: Record<string, string | undefined>): string {
  const line1 = p.name || [p.housenumber, p.street].filter(Boolean).join(' ');
  return [line1, p.district, p.city || p.town || p.village, p.state, p.country]
    .filter(Boolean)
    .filter((v, i, a) => a.indexOf(v) === i)
    .join(', ');
}

async function fromPhoton(text: string): Promise<Suggestion[]> {
  const params = new URLSearchParams({ q: text, limit: '6' });
  const country = process.env.NEXT_PUBLIC_GEO_COUNTRY?.trim();
  if (country) params.set('lang', 'en');
  const res = await fetch(`https://photon.komoot.io/api/?${params}`, { cache: 'no-store' });
  const data = (await res.json()) as { features?: PhotonFeature[] };
  return (data.features ?? [])
    .filter((f) => f.geometry?.coordinates?.length === 2 && f.properties)
    .map((f) => ({
      label: photonLabel(f.properties as Record<string, string | undefined>),
      lat: (f.geometry!.coordinates as number[])[1],
      lon: (f.geometry!.coordinates as number[])[0],
    }))
    .filter((s) => s.label);
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const text = (searchParams.get('text') ?? '').trim();
  if (text.length < 3) return NextResponse.json({ suggestions: [] });

  const key = process.env.GEOAPIFY_KEY;
  try {
    const suggestions = key ? await fromGeoapify(text, key) : await fromPhoton(text);
    return NextResponse.json({ suggestions });
  } catch {
    return NextResponse.json({ suggestions: [] });
  }
}
