'use client'

import Link from 'next/link'
import type { SearchCard } from '@/types/profile'

/*
 * The match card and its actions, shared by Inbox (Interests, Mutual) and the
 * member Home's "Recommended for you", so a person looks the same everywhere.
 * Presentation only: actions call the existing interest / message / WhatsApp
 * flows.
 */

export type MatchInfo = { score: number; band: string } | null

export type InterestProfile = {
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

export type ApiResponse = {
  ok: boolean
  received: InterestProfile[]
  sent: InterestProfile[]
  mutual: InterestProfile[]
  message?: string
}

/** One shape for every card on this page, whichever list it came from. */
export type CardData = {
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

export function fromInterest(p: InterestProfile['profile']): CardData {
  return {
    id: p.id, name: p.display_name, age: p.age, location: p.current_loc_name,
    culture: [p.caste, p.gotra, p.gram ?? p.mool].filter(Boolean) as string[],
    occupation: p.occupation, photo: p.photo_url, match: p.match,
  }
}

export function fromSearch(c: SearchCard): CardData {
  const m = c.match && (c.match.confidence > 0 || c.match.reasons.length > 0) && c.match.blockers.length === 0 ? c.match : null
  return {
    id: c.id, name: c.display_name, age: c.age || null, location: c.current_loc_name,
    culture: [c.caste, c.self_gotra, c.gram ?? c.mool].filter(Boolean) as string[],
    occupation: c.job_title || c.employer || c.profession_detail || null,
    photo: c.primary_photo_url, match: m ? { score: m.score, band: m.band } : null, isNew: c.is_new,
  }
}

// ─── Pieces ──────────────────────────────────────────────────────────────────

export function MatchChip({ match }: { match: MatchInfo }) {
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

export const BTN = 'inline-flex flex-1 items-center justify-center gap-1.5 rounded-mj-sm border px-3 py-2 text-[13px] font-semibold transition-colors disabled:opacity-60'

export function MatchCard({ c, children }: { c: CardData; children: React.ReactNode }) {
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

export function ViewProfile({ id }: { id: string }) {
  return <Link href={`/profile/${id}`} className={`${BTN} border-maroon/30 bg-cream text-maroon hover:bg-maroon/5`}>View Profile</Link>
}

/** A mutual match: the status first, then the ways to take it forward. */
export function MatchedActions({ id, conversationId }: { id: string; conversationId?: string | null }) {
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

export function EmptyCard({ children, cta }: { children: React.ReactNode; cta?: React.ReactNode }) {
  return (
    <div className="rounded-mj border border-gold/25 bg-cream px-6 py-9 text-center">
      <p className="text-[14px] text-ink-soft">{children}</p>
      {cta && <div className="mt-4">{cta}</div>}
    </div>
  )
}

