'use client'

import { useState } from 'react'

/**
 * "Sign in as this member" — opens the website as the member for up to 30
 * minutes, to help a family create and share their Digital Profile. Needs no
 * password; recorded in the audit log. See lib/impersonation.ts.
 */
export function SignInAsMember({ accountId, name, disabledReason }: { accountId: string; name: string; disabledReason?: string }) {
  const [confirming, setConfirming] = useState(false)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  async function start() {
    setBusy(true)
    setError('')
    try {
      const res = await fetch(`/api/admin/members/${accountId}/impersonate`, { method: 'POST' })
      const j = await res.json().catch(() => ({}))
      if (res.ok && j.ok) { window.location.href = j.redirect; return }
      setError(j.message ?? 'Could not start. Nothing was changed.')
    } catch {
      setError('Network problem. Nothing was changed.')
    }
    setBusy(false)
  }

  const btn = 'w-full rounded-lg border px-3 py-2 text-left text-[13.5px] font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-40'
  if (disabledReason) {
    return <button type="button" disabled className={`${btn} border-[#DDD3C2] bg-white text-ink`} title={disabledReason}>Sign in as this member</button>
  }
  if (!confirming) {
    return (
      <button type="button" onClick={() => setConfirming(true)} className={`${btn} border-[#E4C572] bg-[#FFF8E7] text-[#5A0E19] hover:border-[#C99A3B]`}>
        Sign in as this member
      </button>
    )
  }
  return (
    <div className="rounded-lg border border-[#E4C572] bg-[#FFF8E7] p-3 text-[13px] text-ink">
      <p className="font-semibold">Open the website as {name}?</p>
      <ul className="mt-1.5 list-disc space-y-0.5 pl-4 text-[12.5px] text-ink-soft">
        <li>Lasts up to 30 minutes; a banner shows it, with <em>Exit</em> to return here.</li>
        <li>Anything you do is done as this member, and the start and end are in the audit log.</li>
        <li>Messages, password changes and account deletion are blocked while you are signed in as them.</li>
      </ul>
      {error && <p role="alert" className="mt-2 text-[12.5px] text-[#8A1C1C]">{error}</p>}
      <div className="mt-2.5 flex gap-2">
        <button type="button" onClick={start} disabled={busy} className="rounded-lg bg-maroon px-3.5 py-2 text-[13px] font-medium text-white disabled:opacity-60">
          {busy ? 'Opening…' : 'Sign in as member'}
        </button>
        <button type="button" onClick={() => setConfirming(false)} disabled={busy} className="rounded-lg border border-[#DDD3C2] bg-white px-3.5 py-2 text-[13px]">Cancel</button>
      </div>
    </div>
  )
}
