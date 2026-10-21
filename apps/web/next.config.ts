import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  images: {
    // Served as-is, never through Vercel's image optimiser. Member photos are
    // signed URLs that change every hour, so each one counted as a new source
    // image; the plan's optimisation quota ran out and the optimiser answered
    // 402 (OPTIMIZED_IMAGE_REQUEST_PAYMENT_REQUIRED), leaving broken photos
    // across the site. Photos are already sized when uploaded, and the static
    // images are small, so nothing here needs resizing on the fly.
    unoptimized: true,
    formats: ['image/avif', 'image/webp'],
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '*.supabase.co',
        pathname: '/storage/v1/**',
      },
    ],
  },
  async redirects() {
    // Short sign-up link for WhatsApp posts and ads. Temporary (307), so it
    // can be pointed elsewhere later without browsers having cached it.
    return [{ source: '/join', destination: '/register?start=1', permanent: false }]
  },
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          { key: 'X-Frame-Options', value: 'DENY' },
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          {
            key: 'Permissions-Policy',
            value: 'camera=(), microphone=(), geolocation=()',
          },
        ],
      },
    ]
  },
}

export default nextConfig
