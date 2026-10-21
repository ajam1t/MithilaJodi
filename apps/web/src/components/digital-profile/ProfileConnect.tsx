'use client'

import { useCallback, useState } from 'react'
import Link from 'next/link'
import { InterestNoteSheet } from '@/components/interests/InterestNoteSheet'
import { sendInterest } from '@/lib/interestNotes'

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
  const [noteOpen, setNoteOpen] = useState(false)
  const [convId, setConvId] = useState(conversationId)
  const closeNote = useCallback(() => setNoteOpen(false), [])

  async function send(note: string): Promise<boolean | string> {
    const r = await sendInterest(profileId, note)
    if (r.ok) {
      // Their interest was still waiting, so this one made it a match.
      if (r.matched) { setState('match'); setConvId(r.conversationId) }
      else setState('sent')
      return true
    }
    if (r.status === 409) { setState('sent'); return true }
    return r.message
  }

  const btn = 'inline-flex min-h-[46px] flex-1 items-center justify-center gap-2 rounded-full px-5 text-[15px] font-semibold transition-colors'

  return (
    <section className="rounded-mj border border-line bg-cream px-4 py-4 text-center shadow-mj-xs" aria-label="Connect">
      <p className="text-[13px] text-ink-soft">You&rsquo;re signed in to Mithila Jodi.</p>
      <div className="mt-3 flex flex-col gap-2 sm:flex-row">
        {state === 'match' ? (
          <>
            <span className={`${btn} border border-gold bg-gold/15 text-maroon`}>It&rsquo;s a Match! <span aria-hidden="true">❤️</span></span>
            {convId && <Link href={`/messages/${convId}`} className={`${btn} bg-maroon-gradient text-cream`}>Message {firstName}</Link>}
          </>
        ) : state === 'sent' ? (
          <span className={`${btn} border border-green/30 bg-green/[0.07] text-green`}>Interest Sent <span aria-hidden="true">✓</span></span>
        ) : state === 'received' ? (
          <Link href="/inbox?tab=interests" className={`${btn} bg-maroon-gradient text-cream`}>{firstName} sent you an interest — Respond</Link>
        ) : state === 'none' ? (
          <button type="button" onClick={() => setNoteOpen(true)} className={`${btn} bg-maroon-gradient text-cream`}>
            Send Interest <span aria-hidden="true">❤️</span>
          </button>
        ) : null}
        <Link href={`/profile/${profileId}`} className={`${btn} border border-maroon/30 bg-cream text-maroon hover:bg-maroon/5`}>View full profile</Link>
      </div>
      <InterestNoteSheet open={noteOpen} onClose={closeNote} name={firstName} onSend={send} />
    </section>
  )
}
