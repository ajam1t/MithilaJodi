'use client'

import { useCallback, useEffect, useState } from 'react'
import Link from 'next/link'
import { useToast } from '@/components/ui'
import type { SearchCard } from '@/types/profile'
import { InterestNoteSheet } from '@/components/interests/InterestNoteSheet'
import { sendInterest } from '@/lib/interestNotes'
import { BTN, EmptyCard, MatchCard, MatchedActions, ViewProfile, fromSearch } from '@/components/inbox/MatchPieces'

/**
 * A few people for the member Home, taken from search's own ranking (best
 * match first) — no separate recommendation logic. People already matched
 * are skipped: they live in the Inbox now.
 */
export function RecommendedForYou({ limit = 3 }: { limit?: number }) {
  const toast = useToast()
  const [items, setItems] = useState<SearchCard[] | null>(null)
  const [sent, setSent] = useState<Set<string>>(new Set())
  // Sending back to someone who already asked makes a match on the spot.
  const [matched, setMatched] = useState<Map<string, string | null>>(new Map())
  const [noteFor, setNoteFor] = useState<SearchCard | null>(null)
  const closeNote = useCallback(() => setNoteFor(null), [])

  // A failed load is not the same as "nobody to suggest": only a successful,
  // empty answer may point the member at their profile. `attempt` re-runs it.
  const [failed, setFailed] = useState(false)
  const [attempt, setAttempt] = useState(0)
  useEffect(() => {
    setFailed(false)
    fetch('/api/search?sort=match')
      .then(r => r.json())
      .then(j => {
        if (!j?.ok) throw new Error('search failed')
        setItems((j.results ?? []).filter((c: SearchCard) => c.interest !== 'match').slice(0, limit))
      })
      .catch(() => setFailed(true))
  }, [limit, attempt])

  async function send(id: string, note: string): Promise<boolean | string> {
    const r = await sendInterest(id, note)
    if (!r.ok) return r.message
    if (r.matched) {
      setMatched(m => new Map(m).set(id, r.conversationId))
      toast("It's a Match! ❤️ You can now message each other.", { type: 'success' })
    } else {
      setSent(s => new Set(s).add(id))
      toast('Interest sent', { type: 'success' })
    }
    return true
  }

  if (failed) {
    return (
      <EmptyCard
        cta={
          <button type="button" onClick={() => { setItems(null); setAttempt(a => a + 1) }} className="btn-primary inline-flex px-5 py-2.5 text-[14px]">
            Retry
          </button>
        }
      >
        Couldn&rsquo;t load recommendations. Please check your connection and try again.
      </EmptyCard>
    )
  }

  if (!items) {
    return (
      <div className="space-y-3" aria-busy="true">
        {[1, 2].map(i => (
          <div key={i} className="flex animate-pulse gap-3.5 rounded-mj border border-line bg-cream p-4">
            <div className="h-[92px] w-[76px] rounded-mj-sm bg-paper-3" />
            <div className="flex-1 space-y-2 py-1"><div className="h-4 w-1/2 rounded bg-paper-3" /><div className="h-3 w-2/3 rounded bg-paper-3" /></div>
          </div>
        ))}
      </div>
    )
  }

  if (items.length === 0) {
    return (
      <EmptyCard cta={<Link href="/profile/edit" className="btn-primary inline-flex px-5 py-2.5 text-[14px]">Complete Profile</Link>}>
        Add a few more details to your profile and we&rsquo;ll suggest people who fit.
      </EmptyCard>
    )
  }

  return (
    <div className="space-y-3">
      {items.map(c => {
        const state = matched.has(c.id) ? 'match' : sent.has(c.id) ? 'sent' : c.interest
        return (
          <MatchCard key={c.id} c={fromSearch(c)}>
            {state === 'match' ? (
              <MatchedActions id={c.id} conversationId={matched.get(c.id)} />
            ) : (
              <>
                <ViewProfile id={c.id} />
                {state === 'sent' ? (
                  <span className={`${BTN} border-green/30 bg-green/[0.07] text-green`}>Interest Sent <span aria-hidden="true">✓</span></span>
                ) : state === 'received' ? (
                  <Link href="/inbox?tab=interests" className={`${BTN} bg-maroon-gradient border-maroon text-cream`}>Respond</Link>
                ) : (
                  <button type="button" onClick={() => setNoteFor(c)} className={`${BTN} bg-maroon-gradient border-maroon text-cream`}>
                    Send Interest
                  </button>
                )}
              </>
            )}
          </MatchCard>
        )
      })}
      <InterestNoteSheet
        open={noteFor !== null}
        onClose={closeNote}
        name={noteFor?.display_name.split(' ')[0] ?? ''}
        onSend={note => (noteFor ? send(noteFor.id, note) : Promise.resolve(false as boolean | string))}
      />
    </div>
  )
}
