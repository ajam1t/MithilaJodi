'use client'

import { isUntracked, normalizePath, type Device, type EventName } from '@/lib/analytics'

/*
 * Browser half of the first-party analytics (see lib/analytics.ts for what is
 * and is not recorded). One beacon per event, sent with sendBeacon so it never
 * delays navigation. Nothing is sent when the browser asks not to be tracked
 * (Do Not Track or Global Privacy Control), or on admin pages.
 */

const VISITOR_KEY = 'mj_vid'
const SESSION_KEY = 'mj_visit'

function optedOut(): boolean {
  if (typeof navigator === 'undefined') return true
  const nav = navigator as Navigator & { globalPrivacyControl?: boolean; msDoNotTrack?: string }
  return nav.doNotTrack === '1' || nav.msDoNotTrack === '1' || nav.globalPrivacyControl === true || nav.webdriver === true
}

/** The browser's random id, and whether it was created just now. */
function visitor(): { id: string; isNew: boolean } | null {
  try {
    let id = localStorage.getItem(VISITOR_KEY)
    if (id && /^[0-9a-f-]{36}$/i.test(id)) return { id, isNew: false }
    id = crypto.randomUUID()
    localStorage.setItem(VISITOR_KEY, id)
    return { id, isNew: true }
  } catch {
    return null // storage blocked: count nothing rather than guess
  }
}

function device(): Device {
  const w = window.innerWidth
  return w < 640 ? 'mobile' : w < 1024 ? 'tablet' : 'desktop'
}

let newThisLoad: boolean | null = null

export function track(name: EventName, opts: { k?: string; v?: number; path?: string } = {}): void {
  if (typeof window === 'undefined' || optedOut()) return
  const path = normalizePath(opts.path ?? window.location.pathname)
  if (isUntracked(path)) return
  const vis = visitor()
  if (!vis) return
  // "New" holds for every event of the page load that created the id.
  if (newThisLoad === null) newThisLoad = vis.isNew

  let landing = false
  let ref: string | undefined
  if (name === 'page_view') {
    try {
      if (!sessionStorage.getItem(SESSION_KEY)) {
        sessionStorage.setItem(SESSION_KEY, '1')
        landing = true
        const host = document.referrer ? new URL(document.referrer).hostname : ''
        if (host && host !== window.location.hostname) ref = host.replace(/^www\./, '')
      }
    } catch { /* sessionStorage blocked */ }
  }

  const body = JSON.stringify({
    n: name, p: path, vid: vis.id, nv: newThisLoad, l: landing, d: device(), r: ref,
    k: opts.k?.slice(0, 120), v: typeof opts.v === 'number' && Number.isFinite(opts.v) ? opts.v : undefined,
  })
  try {
    if (navigator.sendBeacon?.(`/api/t`, new Blob([body], { type: 'application/json' }))) return
  } catch { /* fall through */ }
  fetch('/api/t', { method: 'POST', body, headers: { 'Content-Type': 'application/json' }, keepalive: true }).catch(() => {})
}
