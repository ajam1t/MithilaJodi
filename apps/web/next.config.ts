import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  // Do not advertise the framework in every response.
  poweredByHeader: false,
  images: {
    // Served as-is, never through Vercel's image optimiser. Member photos are
    // signed URLs that change every hour, so each one counted as a new source
    // image; the plan's optimisation quota ran out and the optimiser answered
    // 402 (OPTIMIZED_IMAGE_REQUEST_PAYMENT_REQUIRED), leaving broken photos
    // across the site. Photos are resized when uploaded (lib/photoWeb — pages
    // load a 720px WebP copy), and the static images are pre-sized WebP files,
    // so nothing here needs resizing on the fly.
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
    return [
      { source: '/join', destination: '/register?start=1', permanent: false },
      // The Tandilya gotra page was first published at its profile value,
      // 'tandi'; the slug now matches the name the page shows.
      { source: '/gotra/tandi', destination: '/gotra/tandilya', permanent: true },
    ]
  },
  async headers() {
    return [
      {
        // Images, icons and video in /public. Their names are not
        // content-hashed, so a day fresh then a week of serve-while-checking:
        // repeat visits load them from the browser cache instead of asking
        // again for every logo on every page (the default is max-age=0), and a
        // replaced file still shows within a day.
        source: '/:path((?!_next/|api/).*\\.(?:webp|png|jpg|jpeg|svg|ico|mp4|webm))',
        headers: [{ key: 'Cache-Control', value: 'public, max-age=86400, stale-while-revalidate=604800' }],
      },
      {
        source: '/(.*)',
        headers: [
          { key: 'X-Frame-Options', value: 'DENY' },
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          // Vercel adds HSTS on the production domain; set here too so it holds on any host.
          { key: 'Strict-Transport-Security', value: 'max-age=63072000; includeSubDomains' },
          // A deliberately narrow policy: nothing here limits scripts, styles or
          // images (the pages use inline JSON-LD and styles), so it cannot break
          // rendering. It stops the site being framed, plugins being embedded, a
          // <base> tag being injected, and forms posting to another site.
          { key: 'Content-Security-Policy', value: "frame-ancestors 'none'; base-uri 'self'; object-src 'none'; form-action 'self'" },
          { key: 'Cross-Origin-Opener-Policy', value: 'same-origin-allow-popups' },
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
