import type { MetadataRoute } from 'next'
import { SITE_URL } from '@/lib/constants'

const SITE = SITE_URL

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        // Keep private / authenticated areas out of the index. Public content
        // lives at /, /explore, /blogs and /help.
        //
        // NOTE: /login, /register and /forgot-password are intentionally NOT
        // disallowed here — they carry a `noindex, follow` meta (see (auth)
        // layout) so crawlers may read them, follow their links, but never
        // index them. Disallowing in robots.txt would hide that meta tag.
        disallow: [
          '/api/',
          '/admin',
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
