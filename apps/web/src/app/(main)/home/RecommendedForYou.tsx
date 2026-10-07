'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useToast } from '@/components/ui'
import type { SearchCard } from '@/types/profile'
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
  const [busy, setBusy] = useState<string | null>(null)

  useEffect(() => {
    fetch('/api/search?sort=match')
      .then(r => r.json())
      .then(j => setItems(j?.ok ? (j.results ?? []).filter((c: SearchCard) => c.interest !== 'match').slice(0, limit) : []))
      .catch(() => setItems([]))
  }, [limit])

  async function send(id: string) {
    setBusy(id)
    try {
      const res = await fetch('/api/interests', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ to_profile_id: id }),
      })
      const json = await res.json().catch(() => ({}))
      if (!res.ok || !json.ok) { toast(json.message ?? 'Could not send interest. Please try again.', { type: 'error' }); return }
      setSent(s => new Set(s).add(id))
      toast('Interest sent', { type: 'success' })
    } finally {
      setBusy(null)
    }
  }

  if (!items) {
    return (
      <div className="space-y-3" aria-busy="true">
        {[1, 2].map(i => (
          <div key={i} className="flex animate-pulse gap-3.5 rounded-mj border border-gold/20 bg-cream p-4">
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
        const state = sent.has(c.id) ? 'sent' : c.interest
        return (
          <MatchCard key={c.id} c={fromSearch(c)}>
            {state === 'match' ? (
              <MatchedActions id={c.id} />
            ) : (
              <>
                <ViewProfile id={c.id} />
                {state === 'sent' ? (
                  <span className={`${BTN} border-green/30 bg-green/[0.07] text-green`}>Interest Sent <span aria-hidden="true">✓</span></span>
                ) : state === 'received' ? (
                  <Link href="/inbox?tab=interests" className={`${BTN} bg-maroon-gradient border-maroon text-cream`}>Respond</Link>
                ) : (
                  <button type="button" disabled={busy === c.id} onClick={() => send(c.id)} className={`${BTN} bg-maroon-gradient border-maroon text-cream`}>
                    Send Interest
                  </button>
                )}
              </>
            )}
          </MatchCard>
        )
      })}
    </div>
  )
}
