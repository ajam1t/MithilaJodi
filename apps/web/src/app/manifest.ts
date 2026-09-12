import type { MetadataRoute } from 'next'

/**
 * Web app manifest — what makes Mithila Jodi installable.
 *
 * Served at /manifest.webmanifest by Next's file convention rather than a
 * static file in public/, so the name, colours and start URL are type-checked
 * and read from the same constants as the rest of the site instead of drifting
 * in a hand-edited JSON file.
 *
 * Chrome will only offer to install when this manifest is valid AND a service
 * worker with a fetch handler is registered (see public/sw.js). Both halves are
 * required; a manifest on its own produces a banner that cannot install
 * anything.
 */
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'Mithila Jodi — Maithili Matrimonial',
    // Home screens truncate hard; this is what actually sits under the icon.
    short_name: 'Mithila Jodi',
    description:
      'A matrimonial platform for the Maithil community. Search profiles by gotra, mool and native place, and create a marriage biodata in Maithili, Hindi, English or Sanskrit.',

    // Opens on the homepage. The query parameter is not decoration: it is the
    // only reliable way to tell installed launches apart from browser visits in
    // analytics later, and it is harmless to the router.
    start_url: '/?source=pwa',
    scope: '/',

    display: 'standalone',
    orientation: 'portrait',

    // Matches the themeColor already declared in the root layout, so the
    // Android status bar and the splash screen agree with the site chrome.
    theme_color: '#7A1220',
    // The paper cream the site is built on, so the splash screen does not flash
    // white before the first paint.
    background_color: '#FCF5E7',

    lang: 'en-IN',
    dir: 'ltr',
    categories: ['social', 'lifestyle'],

    icons: [
      { src: '/favicon-192.png', sizes: '192x192', type: 'image/png', purpose: 'any' },
      { src: '/favicon-512.png', sizes: '512x512', type: 'image/png', purpose: 'any' },
      // Android masks icons to the launcher's shape and only guarantees the
      // centre 80%. The "any" icons above fill their square edge to edge, so
      // used as maskable they would have the monogram's gold ring shaved off.
      // This one is the same artwork inset on the icon's own cream.
      { src: '/icon-maskable-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
    ],

    // Long-press the installed icon. Kept to the two things someone opens the
    // app to do, because Android only surfaces the first few.
    shortcuts: [
      {
        name: 'Search profiles',
        short_name: 'Search',
        url: '/search',
        icons: [{ src: '/favicon-192.png', sizes: '192x192', type: 'image/png' }],
      },
      {
        name: 'Create marriage biodata',
        short_name: 'Biodata',
        url: '/marriage-biodata',
        icons: [{ src: '/favicon-192.png', sizes: '192x192', type: 'image/png' }],
      },
    ],
  }
}
