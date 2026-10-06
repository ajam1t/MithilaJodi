'use client'

import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { WhatsAppRequests } from '@/components/whatsapp/WhatsAppConnect'
import { refreshPendingCounts } from '@/lib/hooks/usePendingCounts'
import { useToast } from '@/components/ui'
import type { SearchCard } from '@/types/profile'

/*
 * The member's matchmaking dashboard (/interests, "Matches" in the nav).
 *
 * Presentation only over the existing flows: interests are still accepted,
 * declined and withdrawn through PATCH /api/interests/[id], messaging still
 * opens the conversation the acceptance created, and WhatsApp is still
 * requested and approved through WhatsAppConnect / WhatsAppRequests.
 */

type MatchInfo = { score: number; band: string } | null

type InterestProfile = {
  interest_id: string
  status: string
  created_at: string
  conversation_id?: string | null
  profile: {
    id: string
    display_name: string
    age: number | null
    gender: string
    caste: string | null
    current_loc_name: string | null
    photo_url: string | null
    gotra: string | null
    mool: string | null
    gram: string | null
    occupation: string | null
    match: MatchInfo
  }
}

type ApiResponse = {
  ok: boolean
  received: InterestProfile[]
  sent: InterestProfile[]
  mutual: InterestProfile[]
  message?: string
}

type Tab = 'foryou' | 'received' | 'sent' | 'mutual'
const TABS: Tab[] = ['foryou', 'received', 'sent', 'mutual']

/** One shape for every card on this page, whichever list it came from. */
type CardData = {
  id: string
  name: string
  age: number | null
  location: string | null
  culture: string[]
  occupation: string | null
  photo: string | null
  match: MatchInfo
  isNew?: boolean
}

function fromInterest(p: InterestProfile['profile']): CardData {
  return {
    id: p.id, name: p.display_name, age: p.age, location: p.current_loc_name,
    culture: [p.caste, p.gotra, p.gram ?? p.mool].filter(Boolean) as string[],
    occupation: p.occupation, photo: p.photo_url, match: p.match,
  }
}

function fromSearch(c: SearchCard): CardData {
  const m = c.match && (c.match.confidence > 0 || c.match.reasons.length > 0) && c.match.blockers.length === 0 ? c.match : null
  return {
    id: c.id, name: c.display_name, age: c.age || null, location: c.current_loc_name,
    culture: [c.caste, c.self_gotra, c.gram ?? c.mool].filter(Boolean) as string[],
    occupation: c.job_title || c.employer || c.profession_detail || null,
    photo: c.primary_photo_url, match: m ? { score: m.score, band: m.band } : null, isNew: c.is_new,
  }
}

// ─── Pieces ──────────────────────────────────────────────────────────────────

function MatchChip({ match }: { match: MatchInfo }) {
  if (!match) return null
  const tone = match.score >= 80 ? 'border-green/30 bg-green/[0.07] text-green'
    : match.score >= 65 ? 'border-gold/50 bg-gold/10 text-[#7A5A12]'
    : 'border-maroon/20 bg-maroon/[0.04] text-maroon'
  return (
    <span className={`inline-flex shrink-0 items-center whitespace-nowrap rounded-full border px-2 py-0.5 text-[11.5px] font-semibold ${tone}`}>
      {match.score}% Match
    </span>
  )
}

const BTN = 'inline-flex flex-1 items-center justify-center gap-1.5 rounded-mj-sm border px-3 py-2 text-[13px] font-semibold transition-colors disabled:opacity-60'

function MatchCard({ c, children }: { c: CardData; children: React.ReactNode }) {
  return (
    <article className="rounded-mj border border-gold/25 bg-cream p-3.5 shadow-mj-xs sm:p-4">
      <div className="flex gap-3.5">
        <Link href={`/profile/${c.id}`} className="relative h-[92px] w-[76px] shrink-0 overflow-hidden rounded-mj-sm border border-gold/25 bg-paper-2" tabIndex={-1} aria-hidden="true">
          {c.photo ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={c.photo} alt="" className="h-full w-full object-cover object-[center_30%]" loading="lazy" decoding="async" />
          ) : (
            <span className="grid h-full w-full place-items-center font-serif text-[26px] text-maroon/70">{c.name[0]?.toUpperCase()}</span>
          )}
          {c.isNew && (
            <span className="absolute left-1 top-1 rounded-full bg-maroon px-1.5 py-px text-[9px] font-semibold uppercase tracking-wide text-cream">New</span>
          )}
        </Link>
        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-2">
            <h3 className="min-w-0 truncate font-serif text-[18px] leading-tight text-maroon">
              <Link href={`/profile/${c.id}`} className="hover:text-terra">{c.name}</Link>
            </h3>
            <MatchChip match={c.match} />
          </div>
          {(c.age || c.location) && (
            <p className="mt-0.5 text-[13px] text-ink">{[c.age ? `${c.age} yrs` : null, c.location].filter(Boolean).join(' · ')}</p>
          )}
          {c.culture.length > 0 && <p className="mt-0.5 truncate text-[12.5px] text-ink-soft">{c.culture.join(' · ')}</p>}
          {c.occupation && <p className="mt-0.5 truncate text-[12.5px] text-ink-soft">{c.occupation}</p>}
        </div>
      </div>
      <div className="mt-3 flex flex-wrap gap-2">{children}</div>
    </article>
  )
}

function ViewProfile({ id }: { id: string }) {
  return <Link href={`/profile/${id}`} className={`${BTN} border-maroon/30 bg-cream text-maroon hover:bg-maroon/5`}>View Profile</Link>
}

/** A mutual match: the status first, then the ways to take it forward. */
function MatchedActions({ id, conversationId }: { id: string; conversationId?: string | null }) {
  return (
    <>
      <span className={`${BTN} basis-full border-gold bg-gold/15 text-maroon`}>It&rsquo;s a Match! <span aria-hidden="true">❤️</span></span>
      <ViewProfile id={id} />
      {conversationId && (
        <Link href={`/messages/${conversationId}`} className={`${BTN} bg-maroon-gradient border-maroon text-cream`}>Message</Link>
      )}
      <Link href={`/profile/${id}#whatsapp`} className={`${BTN} border-green/30 bg-green/[0.06] text-green hover:bg-green/10`}>WhatsApp</Link>
    </>
  )
}

function EmptyCard({ children, cta }: { children: React.ReactNode; cta?: React.ReactNode }) {
  return (
    <div className="rounded-mj border border-gold/25 bg-cream px-6 py-9 text-center">
      <p className="text-[14px] text-ink-soft">{children}</p>
      {cta && <div className="mt-4">{cta}</div>}
    </div>
  )
}

// ─── Page ────────────────────────────────────────────────────────────────────

export default function InterestsContent() {
  const searchParams = useSearchParams()
  const toast = useToast()
  const tabParam = searchParams.get('tab') as Tab | null
  const [tab, setTab] = useState<Tab>(tabParam && TABS.includes(tabParam) ? tabParam : 'foryou')
  const [data, setData] = useState<ApiResponse | null>(null)
  const [suggested, setSuggested] = useState<SearchCard[] | null>(null)
  const [sentNow, setSentNow] = useState<Set<string>>(new Set())
  const [busyId, setBusyId] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const loadInterests = useCallback(async () => {
    const j = await fetch('/api/interests').then(r => r.json()).catch(() => null)
    if (j?.ok) setData(j)
    else setError(j?.message ?? 'Could not load your matches.')
  }, [])

  useEffect(() => {
    Promise.all([
      loadInterests(),
      // "For you" is search's own ranking, best first — no separate algorithm.
      fetch('/api/search?sort=match').then(r => r.json()).then(j => setSuggested(j?.ok ? j.results ?? [] : [])).catch(() => setSuggested([])),
    ]).finally(() => setLoading(false))
  }, [loadInterests])

  async function respond(interestId: string, action: 'accept' | 'decline' | 'withdraw') {
    setError('')
    setBusyId(interestId)
    try {
      const res = await fetch(`/api/interests/${interestId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action }),
      })
      const json = await res.json()
      if (json.ok) {
        await loadInterests()
        // Keep the nav badge honest — responding here is what clears it.
        refreshPendingCounts()
        if (action === 'accept') toast("It's a Match! ❤️ You can now message each other.", { type: 'success' })
      } else {
        setError(json.message ?? 'Could not complete that action. Please try again.')
      }
    } catch {
      setError('Could not complete that action. Please try again.')
    } finally {
      setBusyId(null)
    }
  }

  async function sendInterest(profileId: string) {
    setBusyId(profileId)
    try {
      const res = await fetch('/api/interests', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ to_profile_id: profileId }),
      })
      const json = await res.json().catch(() => ({}))
      if (!res.ok || !json.ok) {
        toast(json.message ?? 'Could not send interest. Please try again.', { type: 'error' })
        return
      }
      setSentNow(s => new Set(s).add(profileId))
      toast('Interest sent', { type: 'success' })
      void loadInterests()
    } finally {
      setBusyId(null)
    }
  }

  const received = data?.received ?? []
  const sent = (data?.sent ?? []).filter(s => s.status !== 'withdrawn')
  const mutual = data?.mutual ?? []
  // Everyone already in a conversation with you is not a "suggestion" any more.
  const known = new Set([...mutual.map(m => m.profile.id)])
  const forYou = (suggested ?? []).filter(c => !known.has(c.id)).slice(0, 12)
  const newMatches = forYou.filter(c => c.is_new && (c.match?.score ?? 0) >= 65).length

  const summary: Array<{ label: string; value: number; tab: Tab }> = [
    { label: 'Mutual Matches', value: mutual.length, tab: 'mutual' },
    { label: 'Interests Sent', value: sent.filter(s => s.status === 'sent').length, tab: 'sent' },
    { label: 'New Matches', value: newMatches, tab: 'foryou' },
  ]

  const tabs: Array<{ id: Tab; label: string; count?: number }> = [
    { id: 'foryou', label: 'For You' },
    { id: 'received', label: 'Received', count: received.length },
    { id: 'sent', label: 'Sent' },
    { id: 'mutual', label: 'Mutual' },
  ]

  return (
    <main id="main-content" className="min-h-screen bg-paper">
      <div className="mx-auto max-w-2xl px-4 py-6 sm:py-8">
        <h1 className="font-serif text-[28px] leading-tight text-maroon sm:text-[32px]">Your Matches</h1>
        <p className="mt-1 text-[13.5px] leading-snug text-ink-soft">People who may be a good fit based on your preferences and profile.</p>

        {/* Summary — real counts from the lists below. */}
        <div className="mt-5 grid grid-cols-3 gap-2 sm:gap-3">
          {summary.map(s => (
            <button
              key={s.label}
              type="button"
              onClick={() => setTab(s.tab)}
              className="rounded-mj border border-gold/30 bg-cream px-2 py-3 text-center shadow-mj-xs transition-colors hover:border-gold/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-maroon/40"
            >
              <span className="block font-serif text-[24px] leading-none text-maroon">{loading ? '–' : s.value}</span>
              <span className="mt-1.5 block text-[11.5px] font-medium leading-tight text-ink-soft">{s.label}</span>
            </button>
          ))}
        </div>

        {/* WhatsApp requests awaiting my approval (existing flow). */}
        <div className="mt-5"><WhatsAppRequests /></div>

        {received.length > 0 && tab !== 'received' && (
          <button
            type="button"
            onClick={() => setTab('received')}
            className="mt-4 flex w-full items-center justify-between rounded-mj border border-maroon/20 bg-[#FFF4E2] px-4 py-3 text-left"
          >
            <span className="text-[14px] font-semibold text-maroon">
              {received.length === 1 ? '1 interest is waiting for your reply' : `${received.length} interests are waiting for your reply`}
            </span>
            <span aria-hidden="true" className="text-maroon">→</span>
          </button>
        )}

        {error && (
          <div className="mt-4 rounded-mj-sm border border-error/30 bg-error-soft px-4 py-3 text-sm text-error-fg">{error}</div>
        )}

        {/* Tabs */}
        <div className="mt-5 flex overflow-x-auto border-b border-paper-3 [scrollbar-width:none]" role="tablist">
          {tabs.map(t => (
            <button
              key={t.id}
              type="button"
              role="tab"
              aria-selected={tab === t.id}
              onClick={() => setTab(t.id)}
              className={`shrink-0 border-b-2 px-4 py-2.5 text-[14px] font-medium transition-colors ${
                tab === t.id ? 'border-maroon text-maroon' : 'border-transparent text-ink-soft hover:text-ink'
              }`}
            >
              {t.label}
              {!!t.count && (
                <span className={`ml-1.5 rounded-full px-1.5 py-0.5 text-xs ${tab === t.id ? 'bg-maroon text-white' : 'bg-paper-3 text-ink-soft'}`}>{t.count}</span>
              )}
            </button>
          ))}
        </div>

        <div className="mt-4 space-y-3" role="tabpanel">
          {loading ? (
            [1, 2, 3].map(i => (
              <div key={i} className="flex animate-pulse gap-3.5 rounded-mj border border-gold/20 bg-cream p-4">
                <div className="h-[92px] w-[76px] rounded-mj-sm bg-paper-3" />
                <div className="flex-1 space-y-2 py-1">
                  <div className="h-4 w-1/2 rounded bg-paper-3" />
                  <div className="h-3 w-1/3 rounded bg-paper-3" />
                  <div className="h-3 w-2/3 rounded bg-paper-3" />
                </div>
              </div>
            ))
          ) : tab === 'foryou' ? (
            forYou.length === 0 ? (
              <EmptyCard cta={<Link href="/profile/edit" className="btn-primary inline-flex px-5 py-2.5 text-[14px]">Complete Profile</Link>}>
                Add a few more details to your profile and we&rsquo;ll suggest people who fit.
              </EmptyCard>
            ) : (
              <>
                {forYou.map(c => {
                  const card = fromSearch(c)
                  const state = sentNow.has(c.id) ? 'sent' : c.interest
                  return (
                    <MatchCard key={c.id} c={card}>
                      {state === 'match' ? (
                        <MatchedActions id={c.id} />
                      ) : (
                        <>
                          <ViewProfile id={c.id} />
                          {state === 'sent' ? (
                            <span className={`${BTN} border-green/30 bg-green/[0.07] text-green`}>Interest Sent <span aria-hidden="true">✓</span></span>
                          ) : state === 'received' ? (
                            <button type="button" onClick={() => setTab('received')} className={`${BTN} bg-maroon-gradient border-maroon text-cream`}>Respond</button>
                          ) : (
                            <button type="button" disabled={busyId === c.id} onClick={() => sendInterest(c.id)} className={`${BTN} bg-maroon-gradient border-maroon text-cream`}>
                              Send Interest
                            </button>
                          )}
                        </>
                      )}
                    </MatchCard>
                  )
                })}
                <Link href="/search" className="block py-2 text-center text-[14px] font-semibold text-maroon hover:underline">See more in Search →</Link>
              </>
            )
          ) : tab === 'received' ? (
            received.length === 0 ? (
              <EmptyCard>No interests waiting for you right now.</EmptyCard>
            ) : received.map(item => (
              <MatchCard key={item.interest_id} c={fromInterest(item.profile)}>
                <button type="button" disabled={busyId === item.interest_id} onClick={() => respond(item.interest_id, 'accept')} className={`${BTN} bg-maroon-gradient border-maroon text-cream`}>Accept</button>
                <button type="button" disabled={busyId === item.interest_id} onClick={() => respond(item.interest_id, 'decline')} className={`${BTN} border-ink/15 bg-cream text-ink-soft hover:text-ink`}>Decline</button>
                <ViewProfile id={item.profile.id} />
              </MatchCard>
            ))
          ) : tab === 'sent' ? (
            sent.length === 0 ? (
              <EmptyCard cta={<Link href="/search" className="btn-primary inline-flex px-5 py-2.5 text-[14px]">Explore Profiles</Link>}>
                You have not sent any interests yet.
              </EmptyCard>
            ) : sent.map(item => (
              <MatchCard key={item.interest_id} c={fromInterest(item.profile)}>
                {item.status === 'accepted' ? (
                  <MatchedActions id={item.profile.id} conversationId={item.conversation_id} />
                ) : item.status === 'sent' ? (
                  <>
                    <span className={`${BTN} border-green/30 bg-green/[0.07] text-green`}>Interest Sent <span aria-hidden="true">✓</span></span>
                    <ViewProfile id={item.profile.id} />
                    <button type="button" disabled={busyId === item.interest_id} onClick={() => respond(item.interest_id, 'withdraw')} className="px-2 text-[12.5px] font-medium text-ink-soft underline-offset-2 hover:underline">
                      Withdraw
                    </button>
                  </>
                ) : (
                  <>
                    <span className={`${BTN} border-ink/10 bg-paper-2/60 text-ink-soft`}>Not taken forward</span>
                    <ViewProfile id={item.profile.id} />
                  </>
                )}
              </MatchCard>
            ))
          ) : (
            mutual.length === 0 ? (
              <EmptyCard>No mutual matches yet. Accept interests, or send a few of your own.</EmptyCard>
            ) : mutual.map(item => (
              <MatchCard key={item.interest_id} c={fromInterest(item.profile)}>
                <MatchedActions id={item.profile.id} conversationId={item.conversation_id} />
              </MatchCard>
            ))
          )}
        </div>
      </div>
    </main>
  )
}
