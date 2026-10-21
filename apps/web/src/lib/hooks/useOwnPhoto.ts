'use client'

import { useEffect, useState } from 'react'

/**
 * The signed-in member's own primary photo, for the bottom nav's Profile tab.
 *
 * Read through /api/biodata/me/photo, which streams the member's OWN photo from
 * their session — no storage URL reaches the browser, and nobody else's photo
 * can be asked for. Fetched once per page session and kept as an object URL,
 * so moving between pages does not download it again. null while loading, or
 * when there is no approved photo yet (the tab then shows its usual icon).
 */
let cached: string | null | undefined
let inflight: Promise<string | null> | null = null

function load(): Promise<string | null> {
  if (cached !== undefined) return Promise.resolve(cached)
  if (inflight) return inflight
  inflight = fetch('/api/biodata/me/photo', { credentials: 'include' })
    .then(r => (r.ok ? r.blob() : null))
    .then(b => (cached = b && b.type.startsWith('image/') ? URL.createObjectURL(b) : null))
    .catch(() => (cached = null))
    .finally(() => { inflight = null })
  return inflight
}

export function useOwnPhoto(enabled = true): string | null {
  const [url, setUrl] = useState<string | null>(cached ?? null)
  useEffect(() => {
    if (!enabled) return
    let alive = true
    load().then(u => { if (alive) setUrl(u) })
    return () => { alive = false }
  }, [enabled])
  return enabled ? url : null
}
