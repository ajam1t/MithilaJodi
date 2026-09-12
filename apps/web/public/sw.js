/* Mithila Jodi service worker.
 *
 * This exists for one reason: Chrome will not offer to install a site as an app
 * unless a service worker with a fetch handler is registered. Without it the
 * install banner is a button that cannot install anything.
 *
 * It is deliberately the smallest thing that satisfies that and gives a real
 * benefit, because the failure mode of an over-eager service worker is the
 * worst kind there is — a visitor pinned to a stale build with no way to clear
 * it but to dig through browser settings. So:
 *
 *   - Only same-origin GET navigations are intercepted. Everything else — every
 *     API call, image, font, script and stylesheet — is left entirely alone, so
 *     nothing here can serve a stale chunk or a stale signed URL.
 *   - Navigations are network-first and the response is never cached. The
 *     network answer is always what the reader gets; the cache is only consulted
 *     when the network has actually failed.
 *   - The only cached thing is a small offline page, precached at install.
 *   - skipWaiting + clients.claim, so a corrected worker replaces a bad one on
 *     the next visit instead of waiting for every tab to close.
 *
 * Bump CACHE_VERSION to force old caches out.
 */

const CACHE_VERSION = 'mj-v2'
const OFFLINE_URL = '/offline.html'

/* The offline page's logo. Precached alongside the page itself because a page
   served while the network is down cannot fetch its own image — without this
   the fallback renders with a broken-image icon where the brand mark should be.
   The 96px file, not the 192px one: it is a third of the size and is displayed
   at 64px. */
const OFFLINE_LOGO = '/favicon-96.png'

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches
      .open(CACHE_VERSION)
      .then((cache) => cache.addAll([OFFLINE_URL, OFFLINE_LOGO]))
      // A failed precache must not leave the site without a worker, because
      // then it is not installable either. Better to activate without the
      // offline page than not to activate at all.
      .catch(() => undefined)
      .then(() => self.skipWaiting()),
  )
})

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE_VERSION).map((k) => caches.delete(k))))
      .then(() => self.clients.claim()),
  )
})

self.addEventListener('fetch', (event) => {
  const { request } = event

  if (request.method !== 'GET') return

  const url = new URL(request.url)
  if (url.origin !== self.location.origin) return

  // The offline page's own logo, and nothing else. Scoped to a single known
  // path rather than "images" or "static assets", so there is no way for this
  // to start serving a stale chunk or an expired signed photo URL. Network
  // first, so a normal visit still gets the live file.
  if (url.pathname === OFFLINE_LOGO) {
    event.respondWith(fetch(request).catch(() => caches.match(OFFLINE_LOGO).then((c) => c ?? Response.error())))
    return
  }

  // Navigations only, from here on. Returning early — rather than calling
  // respondWith with a plain fetch — means the browser handles every other
  // request exactly as it would with no worker at all, including its own HTTP
  // cache and range requests.
  if (request.mode !== 'navigate') return

  event.respondWith(
    fetch(request).catch(() =>
      caches.match(OFFLINE_URL).then((cached) =>
        cached ??
        new Response('<h1>You are offline</h1>', {
          status: 503,
          headers: { 'Content-Type': 'text/html; charset=utf-8' },
        }),
      ),
    ),
  )
})
