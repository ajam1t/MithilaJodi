'use client'

import { useEffect, useState } from 'react'

const ACTING_AS_COOKIE = 'mj-acting-as'

/**
 * Shown on every page while an admin is signed in as a member, with a way
 * back. Display only: the cookie it reads carries a name, never a permission
 * (see lib/impersonation.ts). Read after mount, so static pages stay static.
 */
export function ImpersonationBanner() {
  const [name, setName] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    const m = document.cookie.match(new RegExp(`(?:^|; )${ACTING_AS_COOKIE}=([^;]*)`))
    if (m) {
      try { setName(decodeURIComponent(decodeURIComponent(m[1]))) } catch { setName('a member') }
    }
  }, [])

  if (!name) return null

  async function exit() {
    setBusy(true)
    try {
      const r = await fetch('/api/admin/impersonation/exit', { method: 'POST' })
      const j = await r.json().catch(() => ({}))
      window.location.href = j.redirect ?? '/admin/login'
    } catch {
      setBusy(false)
    }
  }

  return (
    <div
      role="status"
      className="fixed inset-x-3 bottom-[calc(5rem+env(safe-area-inset-bottom))] z-[200] mx-auto flex max-w-xl items-center gap-3 rounded-full border-2 border-[#E4C572] bg-[#5A0E19] py-2 pl-4 pr-2 text-[13px] text-[#FFF4DC] shadow-lg lg:bottom-4"
    >
      <span className="min-w-0 flex-1 leading-snug">
        <strong className="font-semibold">Admin view</strong> — signed in as <strong className="font-semibold">{name}</strong>
        <span className="hidden sm:inline text-[#F1D58A]"> · ends after 30 minutes</span>
      </span>
      <button type="button" onClick={exit} disabled={busy}
        className="shrink-0 rounded-full bg-[#F1D58A] px-4 py-1.5 font-semibold text-[#5A0E19] hover:bg-white disabled:opacity-60">
        {busy ? 'Exiting…' : 'Exit'}
      </button>
    </div>
  )
}
