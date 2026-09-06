'use client'

import { useEffect, useState } from 'react'

/**
 * Counts of interests and WhatsApp requests waiting on the member.
 *
 * Deduped and cached for the page like useAuthState, because both the desktop
 * header and the mobile bottom nav want the same numbers and both render on
 * every member page.
 *
 * `refreshPendingCounts()` clears the cache and re-fetches, so a page that acts
 * on one of these (approving a WhatsApp request, accepting an interest) can
 * drop the badge immediately instead of leaving a count that is visibly wrong
 * until the next full page load.
 */

export type PendingCounts = { interests: number; whatsapp: number }

const ZERO: PendingCounts = { interests: 0, whatsapp: 0 }

let cache: PendingCounts | null = null
let inflight: Promise<PendingCounts> | null = null
const subscribers = new Set<(c: PendingCounts) => void>()

function fetchCounts(): Promise<PendingCounts> {
  if (cache) return Promise.resolve(cache)
  if (inflight) return inflight

  inflight = fetch('/api/pending', { credentials: 'include', cache: 'no-store' })
    .then((r) => (r.ok ? r.json() : null))
    .then((data: { ok?: boolean; interests?: number; whatsapp?: number } | null) => {
      const counts: PendingCounts = data?.ok
        ? { interests: data.interests ?? 0, whatsapp: data.whatsapp ?? 0 }
        : ZERO
      cache = counts
      subscribers.forEach((fn) => fn(counts))
      return counts
    })
    .catch(() => {
      // A failed count must never blank the nav — just show no badge.
      cache = ZERO
      subscribers.forEach((fn) => fn(ZERO))
      return ZERO
    })
    .finally(() => { inflight = null })

  return inflight
}

export function refreshPendingCounts(): void {
  cache = null
  inflight = null
  void fetchCounts()
}

export function usePendingCounts(): PendingCounts {
  const [counts, setCounts] = useState<PendingCounts>(cache ?? ZERO)

  useEffect(() => {
    let active = true
    const onUpdate = (c: PendingCounts) => { if (active) setCounts(c) }
    subscribers.add(onUpdate)
    void fetchCounts().then(onUpdate)
    return () => { active = false; subscribers.delete(onUpdate) }
  }, [])

  return counts
}
