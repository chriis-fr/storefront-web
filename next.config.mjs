/** @type {import('next').NextConfig} */
function imageHosts() {
  const hosts = new Set(
    (process.env.NEXT_PUBLIC_IMAGE_HOSTS ?? '')
      .split(',')
      .map((host) => host.trim())
      .filter(Boolean)
  );

  // Fleetbase mode — allow images from the Fleetbase host
  if (process.env.FLEETBASE_HOST) {
    try {
      hosts.add(new URL(process.env.FLEETBASE_HOST).hostname);
    } catch {
      hosts.add('api.fleetbase.io');
    }
  }

  // Chains mode — allow images from the chains-api host
  if (process.env.CHAINS_API_URL) {
    try {
      hosts.add(new URL(process.env.CHAINS_API_URL).hostname);
    } catch {}
  }
  // Also allow the public-facing API base URL (may differ from internal CHAINS_API_URL)
  if (process.env.NEXT_PUBLIC_API_BASE_URL) {
    try {
      hosts.add(new URL(process.env.NEXT_PUBLIC_API_BASE_URL).hostname);
    } catch {}
  }

  if (process.env.NODE_ENV !== 'production') {
    hosts.add('localhost');
    hosts.add('127.0.0.1');
  }

  return Array.from(hosts).map((hostname) => ({
    protocol: hostname === 'localhost' || hostname === '127.0.0.1' ? 'http' : 'https',
    hostname
  }));
}

const nextConfig = {
  reactStrictMode: true,
  output: 'standalone',
  eslint: {
    ignoreDuringBuilds: true
  },
  images: {
    remotePatterns: imageHosts(),
  }
};

export default nextConfig;
