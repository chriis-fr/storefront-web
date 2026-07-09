export const ONE_MONTH_SECONDS = 60 * 60 * 24 * 30;

// Read once at module load — never re-checked per request.
// Set FLEETBASE_ENABLED=true on a storefront deployment to activate
// Fleetbase delivery dispatch on top of the chains-api data layer.
// Default: false — runs purely on chains-api with no Fleetbase dependency.
export const FLEETBASE_ENABLED = process.env.FLEETBASE_ENABLED === 'true';

export type RuntimeEnv = Record<string, string | undefined>;

export type CookieOptions = {
  httpOnly: true;
  sameSite: 'lax';
  path: '/';
  maxAge: number;
  secure: boolean;
};

export function isProduction(env: RuntimeEnv = process.env) {
  return env.NODE_ENV === 'production';
}

export function sessionCookieOptions(env: RuntimeEnv = process.env): CookieOptions {
  return {
    httpOnly: true,
    sameSite: 'lax',
    path: '/',
    maxAge: ONE_MONTH_SECONDS,
    secure: isProduction(env)
  };
}

// Modes:
//   'chains'          — chains-api only (no Fleetbase)
//   'chains+fleetbase'— chains-api for data, Fleetbase for delivery dispatch
//   'fleetbase'       — legacy Fleetbase-only mode
//   'unconfigured'    — nothing set
export type BackendMode = 'chains' | 'chains+fleetbase' | 'fleetbase' | 'unconfigured';

export function detectBackend(env: RuntimeEnv = process.env): BackendMode {
  const hasChains    = !!(env.CHAINS_API_URL && env.CHAINS_STOREFRONT_KEY);
  const hasFleetbase = !!(env.FLEETBASE_HOST && env.STOREFRONT_KEY);
  const fleetbaseOn  = env.FLEETBASE_ENABLED === 'true';

  if (hasChains && fleetbaseOn && hasFleetbase) return 'chains+fleetbase';
  if (hasChains)    return 'chains';
  if (hasFleetbase) return 'fleetbase';
  return 'unconfigured';
}

export function getRequiredServerEnv(env: RuntimeEnv = process.env) {
  return {
    FLEETBASE_HOST: env.FLEETBASE_HOST ?? 'https://api.fleetbase.io',
    STOREFRONT_KEY: env.STOREFRONT_KEY,
  };
}

export function validateServerEnv(env: RuntimeEnv = process.env) {
  const mode = detectBackend(env);

  if (mode === 'chains' || mode === 'chains+fleetbase') {
    return {
      ok:      true,
      missing: [] as string[],
      mode,
      values: {
        CHAINS_API_URL:         env.CHAINS_API_URL,
        CHAINS_STOREFRONT_KEY:  '***',
        FLEETBASE_ENABLED:      mode === 'chains+fleetbase' ? 'true' : 'false',
        FLEETBASE_HOST:         mode === 'chains+fleetbase' ? env.FLEETBASE_HOST : undefined,
        STOREFRONT_KEY:         mode === 'chains+fleetbase' ? '***' : undefined,
      },
    };
  }

  if (mode === 'fleetbase') {
    return {
      ok:      true,
      missing: [] as string[],
      mode,
      values: {
        FLEETBASE_HOST:         env.FLEETBASE_HOST ?? 'https://api.fleetbase.io',
        STOREFRONT_KEY:         '***',
        CHAINS_API_URL:         undefined as string | undefined,
        CHAINS_STOREFRONT_KEY:  undefined as string | undefined,
      },
    };
  }

  return {
    ok:      false,
    missing: [
      'Set CHAINS_API_URL + CHAINS_STOREFRONT_KEY (chains mode)',
      'or FLEETBASE_HOST + STOREFRONT_KEY (fleetbase mode)',
    ],
    mode,
    values: {
      FLEETBASE_HOST:        env.FLEETBASE_HOST,
      STOREFRONT_KEY:        env.STOREFRONT_KEY ? '***' : undefined,
      CHAINS_API_URL:        env.CHAINS_API_URL,
      CHAINS_STOREFRONT_KEY: env.CHAINS_STOREFRONT_KEY ? '***' : undefined,
    },
  };
}

export function parseImageHosts(value?: string) {
  return Array.from(
    new Set(
      (value ?? '')
        .split(',')
        .map((host) => host.trim())
        .filter(Boolean)
    )
  );
}

export function getAllowedImageHosts(env: RuntimeEnv = process.env) {
  const configured = parseImageHosts(env.NEXT_PUBLIC_IMAGE_HOSTS);
  const hosts = new Set(configured);

  try {
    hosts.add(new URL(env.FLEETBASE_HOST ?? 'https://api.fleetbase.io').hostname);
  } catch {
    hosts.add('api.fleetbase.io');
  }

  if (!isProduction(env)) {
    hosts.add('localhost');
    hosts.add('127.0.0.1');
  }

  return Array.from(hosts).filter(Boolean);
}
