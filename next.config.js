/** @type {import('next').NextConfig} */
const nextConfig = {
  env: {
    NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
    NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'placehold.co',
      },
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
      },
      {
        protocol: 'https',
        hostname: 'spoonacular.com',
      },
    ],
  },
  // Configure development server
  async rewrites() {
    return process.env.NODE_ENV === 'development'
      ? [
          {
            source: '/:path*',
            destination: '/:path*',
            has: [
              {
                type: 'host',
                value: '(192\\.168\\.1\\.6|localhost|127\\.0\\.0\\.1)(:\\d+)?',
              },
            ],
          },
        ]
      : [];
  },

  // Disable source maps for production
  productionBrowserSourceMaps: false,

  // During local development we skip type-checking and ESLint
  // to keep iteration fast, but in production builds we want
  // the safety nets enabled so future issues are caught early.
  typescript: {
    ignoreBuildErrors: process.env.NODE_ENV === 'development'
  },
  eslint: {
    ignoreDuringBuilds: process.env.NODE_ENV === 'development'
  }
}

export default nextConfig 