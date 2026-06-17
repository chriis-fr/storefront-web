export const ONE_MONTH_SECONDS = 60 * 60 * 24 * 30;

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

export function getRequiredServerEnv(env: RuntimeEnv = process.env) {
  return {
    FLEETBASE_HOST: env.FLEETBASE_HOST ?? 'https://api.fleetbase.io',
    STOREFRONT_KEY: env.STOREFRONT_KEY
  };
}

export function validateServerEnv(env: RuntimeEnv = process.env) {
  const values = getRequiredServerEnv(env);
  const missing = Object.entries(values)
    .filter(([, value]) => !value)
    .map(([key]) => key);

  return {
    ok: missing.length === 0,
    missing,
    values
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
