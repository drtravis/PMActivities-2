/** @type {import('next').NextConfig} */
const nextConfig = {
  env: {
    NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL || 'https://activity-tracker-backend.mangoground-80e673e8.canadacentral.azurecontainerapps.io',
  },
  reactStrictMode: false,
  swcMinify: true,
  compiler: {
    removeConsole: process.env.NODE_ENV === 'production',
  },
  output: 'standalone',
  images: {
    unoptimized: true
  },
  // Force fresh deployment
  generateBuildId: () => 'build-' + Date.now(),
  experimental: {
    esmExternals: false
  }
}

module.exports = nextConfig
