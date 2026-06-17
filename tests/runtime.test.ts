import { describe, expect, it } from 'vitest';
import { getAllowedImageHosts, parseImageHosts, sessionCookieOptions, validateServerEnv } from '@/lib/runtime';

describe('runtime helpers', () => {
  it('uses secure cookies in production only', () => {
    expect(sessionCookieOptions({ NODE_ENV: 'development' }).secure).toBe(false);
    expect(sessionCookieOptions({ NODE_ENV: 'production' }).secure).toBe(true);
  });

  it('validates required server env without exposing secrets', () => {
    expect(validateServerEnv({ FLEETBASE_HOST: 'https://api.example.com', STOREFRONT_KEY: 'store_test' })).toMatchObject({
      ok: true,
      missing: []
    });
    expect(validateServerEnv({ FLEETBASE_HOST: 'https://api.example.com' })).toMatchObject({
      ok: false,
      missing: ['STOREFRONT_KEY']
    });
  });

  it('parses configured image hosts and includes Fleetbase host', () => {
    expect(parseImageHosts('cdn.example.com, assets.example.com, cdn.example.com')).toEqual(['cdn.example.com', 'assets.example.com']);
    expect(
      getAllowedImageHosts({
        NODE_ENV: 'production',
        FLEETBASE_HOST: 'https://api.example.com',
        NEXT_PUBLIC_IMAGE_HOSTS: 'cdn.example.com'
      })
    ).toEqual(['cdn.example.com', 'api.example.com']);
  });
});
