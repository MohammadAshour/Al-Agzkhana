/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    serverComponentsExternalPackages: [],
  },
  // Prevent static generation errors for API routes
  output: 'standalone',
};

export default nextConfig;