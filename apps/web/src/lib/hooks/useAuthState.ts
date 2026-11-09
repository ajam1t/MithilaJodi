'use client'

import { useEffect, useSyncExternalStore } from 'react'

/**
 * Shared client-side auth state.
 *
 * MithilaHeader and MobileBottomNav both render on every public page and each
 * used to call /api/auth/me independently — two identical requests per page
 * load. This de-duplicates them: the first caller starts the request, any
 * concurrent caller awaits the same promise, and the result is cached for the
 * lifetime of the page.
 *
 * Not a replacement for server-side auth: this only drives which nav links are
 * shown. Every protected route still verifies the session server-side.
 */

export type AuthState = { loggedIn: false } | { loggedIn: true; mobile: string }

type Resolved = { auth: AuthState; loaded: true }

let cache: Resolved | null = null
let inflight: Promise<Resolved> | null = null
const subscribers = new Set<(r: Resolved) => void>()

function fetchAuth(): Promise<Resolved> {
  if (cache) return Promise.resolve(cache)
  if (inflight) return inflight

  inflight = fetch('/api/auth/me', { credentials: 'include' })
    .then((r) => (r.ok ? r.json() : null))
    .then((data: { ok: boolean; account?: { mobile: string } } | null) => {
      const auth: AuthState =
        data?.ok && data.account ? { loggedIn: true, mobile: data.account.mobile } : { loggedIn: false }
      const resolved: Resolved = { auth, loaded: true }
      cache = resolved
      subscribers.forEach((fn) => fn(resolved))
      return resolved
    })
    .catch(() => {
      const resolved: Resolved = { auth: { loggedIn: false }, loaded: true }
      cache = resolved
      subscribers.forEach((fn) => fn(resolved))
      return resolved
    })
    .finally(() => { inflight = null })

  return inflight
}

/** Clear the cache — call after login/logout so nav reflects the new state. */
export function resetAuthState() {
  cache = null
  inflight = null
}

const subscribe = (onChange: () => void) => {
  const fn = () => onChange()
  subscribers.add(fn)
  return () => { subscribers.delete(fn) }
}
const getSnapshot = () => cache
// The server never knows who is signed in, and the HTML it sent says so. While
// React is hydrating it must see the same thing — reading `cache` here made the
// homepage header hydrate with the "Login / Join Free" buttons the server HTML
// did not have whenever another component had already resolved the session
// (React error #418, and the whole page rendered a second time in the browser).
const getServerSnapshot = (): Resolved | null => null

export function useAuthState(): { auth: AuthState; authLoaded: boolean } {
  // After hydration this returns the cached answer straight away, so moving
  // between pages does not flash the signed-out header.
  const state = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot)

  useEffect(() => { if (!cache) void fetchAuth() }, [])

  return { auth: state?.auth ?? { loggedIn: false }, authLoaded: state?.loaded ?? false }
}
