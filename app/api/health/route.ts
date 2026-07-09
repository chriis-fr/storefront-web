import { NextResponse } from 'next/server';
import { validateServerEnv } from '@/lib/config';

export async function GET() {
  const env = validateServerEnv();

  return NextResponse.json(
    {
      ok:      env.ok,
      service: 'storefront-web',
      mode:    env.mode,
      missing: env.missing,
    },
    { status: env.ok ? 200 : 503 }
  );
}
