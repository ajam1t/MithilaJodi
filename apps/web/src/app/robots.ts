import type { MetadataRoute } from 'next'
import { SITE_URL } from '@/lib/constants'

const SITE = SITE_URL

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        // Keep private / authenticated / functional areas out of the index.
        // Public content lives at /, /explore, /blogs and /help.
        disallow: [
          '/api/',
          '/admin',
          '/login',
          '/register',
          '/forgot-password',
          '/settings',
          '/profile',        // own profile + /profile/[id] (auth-gated, private)
          '/messages',
          '/interests',
          '/shortlists',
          '/membership',
          '/biodata',        // auth-gated tool + /biodata/preview/[id]
          '/legal/consent',
        ],
      },
    ],
    sitemap: `${SITE}/sitemap.xml`,
    host: SITE,
  }
}
