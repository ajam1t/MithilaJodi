'use client'

import { useEffect } from 'react'

/**
 * Tell the server this link was opened by a person — once per tab session.
 *
 * The visitor id is random, made by this browser, kept per link (so opens of
 * two different profiles cannot be tied together), and never leaves except to
 * count "a different browser opened this". Storage that is blocked or
 * unavailable simply means the open is counted without it.
 */
export function OpenBeacon({ token }: { token: string }) {
  useEffect(() => {
    const seenKey = `mjdp-open:${token}`
    try {
      if (sessionStorage.getItem(seenKey)) return
      sessionStorage.setItem(seenKey, '1')
    } catch { /* private mode: still count */ }

    let visitor: string | null = null
    try {
      const k = `mjdp-v:${token}`
      visitor = localStorage.getItem(k)
      if (!visitor && typeof crypto?.randomUUID === 'function') {
        visitor = crypto.randomUUID()
        localStorage.setItem(k, visitor)
      }
    } catch { visitor = null }

    void fetch(`/api/p/${encodeURIComponent(token)}/open`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ visitor }),
      keepalive: true,
    }).catch(() => {})
  }, [token])
  return null
}
