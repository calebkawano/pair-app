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
}

module.exports = nextConfig 