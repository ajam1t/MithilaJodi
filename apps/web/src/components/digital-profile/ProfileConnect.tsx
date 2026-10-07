'use client'

import { useState } from 'react'
import Link from 'next/link'

/**
 * What a signed-in member can do on someone else's Digital Profile, from the
 * same interests table and API the rest of the site uses — no second system.
 */
export type ConnectState = 'none' | 'sent' | 'received' | 'match' | 'unavailable'

export function ProfileConnect({
  profileId, firstName, initial, conversationId,
}: {
  profileId: string
  firstName: string
  initial: ConnectState
  conversationId: string | null
}) {
  const [state, setState] = useState<ConnectState>(initial)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  async function send() {
    setBusy(true)
    setError('')
    try {
      const res = await fetch('/api/interests', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ to_profile_id: profileId }),
      })
      const json = await res.json().catch(() => ({}))
      if (res.ok && json.ok) setState('sent')
      else if (res.status === 409) setState('sent')
      else setError(json.message ?? 'Could not send interest. Please try again.')
    } finally {
      setBusy(false)
    }
  }

  const btn = 'inline-flex min-h-[46px] flex-1 items-center justify-center gap-2 rounded-full px-5 text-[15px] font-semibold transition-colors'

  return (
    <section className="rounded-mj border border-maroon/25 bg-cream px-4 py-4 text-center shadow-mj-xs" aria-label="Connect">
      <p className="text-[13px] text-ink-soft">You&rsquo;re signed in to Mithila Jodi.</p>
      <div className="mt-3 flex flex-col gap-2 sm:flex-row">
        {state === 'match' ? (
          <>
            <span className={`${btn} border border-gold bg-gold/15 text-maroon`}>It&rsquo;s a Match! <span aria-hidden="true">❤️</span></span>
            {conversationId && <Link href={`/messages/${conversationId}`} className={`${btn} bg-maroon-gradient text-cream`}>Message {firstName}</Link>}
          </>
        ) : state === 'sent' ? (
          <span className={`${btn} border border-green/30 bg-green/[0.07] text-green`}>Interest Sent <span aria-hidden="true">✓</span></span>
        ) : state === 'received' ? (
          <Link href="/inbox?tab=interests" className={`${btn} bg-maroon-gradient text-cream`}>{firstName} sent you an interest — Respond</Link>
        ) : state === 'none' ? (
          <button type="button" disabled={busy} onClick={send} className={`${btn} bg-maroon-gradient text-cream disabled:opacity-60`}>
            {busy ? 'Sending…' : <>Send Interest <span aria-hidden="true">❤️</span></>}
          </button>
        ) : null}
        <Link href={`/profile/${profileId}`} className={`${btn} border border-maroon/30 bg-cream text-maroon hover:bg-maroon/5`}>View full profile</Link>
      </div>
      {error && <p className="mt-2 text-[13px] text-error-fg">{error}</p>}
    </section>
  )
}
