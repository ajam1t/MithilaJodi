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
          '/search',         // auth-gated member search
          '/profile',        // own profile + /profile/[id] (auth-gated, private)
          '/messages',
          '/interests',
          '/shortlists',
          // Note: this does NOT cover /marriage-biodata, the public no-login
          // biodata maker, which is meant to be indexed. Keep them on separate
          // paths — a `/biodata/...` URL for the public tool would be hidden here.
          '/biodata',        // auth-gated tool + /biodata/preview/[id]
          // Shared profile links. The page also carries `noindex, nofollow` —
          // robots.txt only asks a crawler not to fetch, and a URL pasted into a
          // public group can still be indexed without the meta tag.
          '/p/',
          '/legal/consent',
        ],
      },
    ],
    sitemap: `${SITE}/sitemap.xml`,
    host: SITE,
  }
}
