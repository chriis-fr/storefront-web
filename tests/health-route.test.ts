import { describe, expect, it } from 'vitest';
import { GET } from '@/app/api/health/route';

describe('health route', () => {
  it('reports configured service health', async () => {
    const previousKey = process.env.STOREFRONT_KEY;
    const previousHost = process.env.FLEETBASE_HOST;
    process.env.STOREFRONT_KEY = 'store_test';
    process.env.FLEETBASE_HOST = 'https://api.example.com';

    const response = await GET();
    const payload = await response.json();

    expect(response.status).toBe(200);
    expect(payload).toMatchObject({
      ok: true,
      service: 'storefront-web',
      fleetbaseHost: 'https://api.example.com'
    });

    process.env.STOREFRONT_KEY = previousKey;
    process.env.FLEETBASE_HOST = previousHost;
  });
});
