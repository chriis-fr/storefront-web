/** @type {import('next').NextConfig} */
function imageHosts() {
  const hosts = new Set(
    (process.env.NEXT_PUBLIC_IMAGE_HOSTS ?? '')
      .split(',')
      .map((host) => host.trim())
      .filter(Boolean)
  );

  try {
    hosts.add(new URL(process.env.FLEETBASE_HOST ?? 'https://api.fleetbase.io').hostname);
  } catch {
    hosts.add('api.fleetbase.io');
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
    remotePatterns: imageHosts()
  }
};

export default nextConfig;
