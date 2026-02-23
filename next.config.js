/** @type {import('next').NextConfig} */
const staticOrigin = process.env.NEXT_PUBLIC_STATIC_ASSETS_ORIGIN;
const staticUrl = staticOrigin ? new URL(staticOrigin) : null;

const nextConfig = {
  reactStrictMode: true,
  images: {
    remotePatterns:
      staticUrl && staticUrl.hostname
        ? [{ protocol: staticUrl.protocol.replace(':', ''), hostname: staticUrl.hostname, pathname: '/**' }]
        : [],
  },
  async rewrites() {
    const backend = process.env.NEXT_PUBLIC_API_URL;
    if (!backend) {
      throw new Error('NEXT_PUBLIC_API_URL must be set in .env.local (e.g. http://localhost:8000)');
    }
    return [{ source: '/api/:path*', destination: `${backend}/api/:path*` }];
  },
};

module.exports = nextConfig;

