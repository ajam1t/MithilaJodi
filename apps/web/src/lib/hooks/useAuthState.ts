'use client'

import { useEffect, useState } from 'react'

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

export function useAuthState(): { auth: AuthState; authLoaded: boolean } {
  const [state, setState] = useState<Resolved | null>(cache)

  useEffect(() => {
    if (cache) { setState(cache); return }

    let alive = true
    const onResolved = (r: Resolved) => { if (alive) setState(r) }
    subscribers.add(onResolved)
    void fetchAuth()

    return () => { alive = false; subscribers.delete(onResolved) }
  }, [])

  return { auth: state?.auth ?? { loggedIn: false }, authLoaded: state?.loaded ?? false }
}
