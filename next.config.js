/** @type {import('next').NextConfig} */
const nextConfig = {
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
    ],
  },
  // Allow access from local network during development
  allowedDevOrigins: ['192.168.1.6', 'localhost', '127.0.0.1'],
  
  // Reduce 404 errors from source maps
  webpack: (config, { dev, isServer }) => {
    if (dev && !isServer) {
      config.devtool = 'eval-source-map';
    }
    return config;
  },
  
  // Disable source maps for production
  productionBrowserSourceMaps: false,
}

module.exports = nextConfig 