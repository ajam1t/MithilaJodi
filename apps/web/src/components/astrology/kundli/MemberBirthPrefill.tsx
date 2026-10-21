'use client'

import { useState } from 'react'
import type { BirthPlace, Role } from '@/lib/astrology/types'
import { useAuthState } from '@/lib/hooks/useAuthState'
import { EMPTY_DRAFT, type PersonDraft } from './BirthDetailsCard'

/**
 * "Use my birth details" for a signed-in member on Kundli Match.
 *
 * Only ever the member's OWN details, read from their own-profile API on
 * their tap: first name, gender (which decides bride or groom), date of
 * birth, birth time and birth place. The other person's card is never filled
 * from anyone's profile — their birth details are private and come from the
 * family, typed in by hand.
 *
 * Nothing here is stored. The details go into the form only, and reach the
 * server only if the member presses Match, exactly as if typed.
 */

type Props = {
  /** Fills one card and reports which role the member took. */
  onFill: (role: Role, draft: PersonDraft) => void
  /** First name of the person they are matching with, for the copy only. */
  partner?: string | null
}

/** "14:05", "2:05 pm", "02.05 AM", "14:05:00" → "HH:MM", or '' if unreadable. */
function toTimeInput(raw: string | null | undefined): string {
  const m = /^\s*(\d{1,2})[:.](\d{2})(?:[:.]\d{2})?\s*([ap])?\.?\s*m?\.?\s*$/i.exec(raw ?? '')
  if (!m) return ''
  let h = Number(m[1])
  const min = Number(m[2])
  const ap = m[3]?.toLowerCase()
  if (min > 59) return ''
  if (ap) {
    if (h < 1 || h > 12) return ''
    if (ap === 'p' && h !== 12) h += 12
    if (ap === 'a' && h === 12) h = 0
  } else if (h > 23) return ''
  return `${String(h).padStart(2, '0')}:${String(min).padStart(2, '0')}`
}

/** The first part of a place name, for comparing "Darbhanga" with "Darbhanga, Bihar". */
const head = (s: string) => s.split(',')[0].trim().toLowerCase()

/**
 * Looks the member's saved birth place up in the tools' own place list (no
 * outside map service). It is used only when the best result is clearly the
 * same town; otherwise the place is left for the member to choose, rather
 * than guessing coordinates that would change the chart.
 */
async function resolvePlace(text: string): Promise<BirthPlace | null> {
  const q = text.trim().slice(0, 80)
  if (q.length < 2) return null
  try {
    const res = await fetch(`/api/astrology/places?q=${encodeURIComponent(q)}`)
    const json = await res.json()
    const first = json?.ok && Array.isArray(json.results) ? json.results[0] : null
    if (!first || head(first.label ?? '') !== head(q)) return null
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { detail, ...place } = first as BirthPlace & { detail?: string }
    return place
  } catch {
    return null
  }
}

export function MemberBirthPrefill({ onFill, partner }: Props) {
  const { auth, authLoaded } = useAuthState()
  const [busy, setBusy] = useState(false)
  const [note, setNote] = useState<string | null>(null)

  if (!authLoaded || !auth.loggedIn) return null

  async function use() {
    setBusy(true)
    setNote(null)
    try {
      const res = await fetch('/api/profile')
      const json = await res.json().catch(() => null)
      const p = json?.ok ? json.profile : null
      if (!p) { setNote('We couldn’t read your profile just now. Please try again, or fill the form by hand.'); return }
      const role: Role | null = p.gender === 'female' ? 'bride' : p.gender === 'male' ? 'groom' : null
      if (!role) { setNote('Your profile doesn’t say bride or groom yet, so please fill the form by hand.'); return }

      const time = toTimeInput(json.private?.birth_time)
      const placeText: string = json.private?.birth_place ?? ''
      const place = placeText ? await resolvePlace(placeText) : null
      onFill(role, {
        ...EMPTY_DRAFT,
        name: typeof p.first_name === 'string' ? p.first_name : '',
        dateOfBirth: typeof p.dob === 'string' ? p.dob.slice(0, 10) : '',
        timeOfBirth: time,
        place,
      })

      const missing = [
        !p.dob && 'date of birth',
        !time && 'birth time',
        !place && 'birth place',
      ].filter(Boolean) as string[]
      setNote(
        missing.length
          ? `Filled in what your profile has. Please add your ${missing.length > 1 ? `${missing.slice(0, -1).join(', ')} and ${missing[missing.length - 1]}` : missing[0]}${placeText && !place ? ` (choose “${placeText}” from the list)` : ''}.`
          : `Your details are in the ${role === 'bride' ? 'bride’s' : 'groom’s'} card — please check them.`,
      )
    } catch {
      setNote('We couldn’t read your profile just now. Please try again, or fill the form by hand.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="mb-5 rounded-mj border border-gold/40 bg-cream px-4 py-3 flex flex-wrap items-center justify-between gap-3">
      <p className="text-[14px] text-ink-soft max-w-xl">
        {partner
          ? <>Matching with <span className="font-semibold text-ink">{partner}</span>? Start with your own birth details, then add {partner}’s from the family.</>
          : <>Signed in? Start with your own birth details from your profile.</>}
        {note && <span className="block mt-1 text-[13px] text-ink" role="status">{note}</span>}
      </p>
      <button type="button" onClick={() => void use()} disabled={busy} className="btn-ghost btn-sm shrink-0 disabled:opacity-60">
        {busy ? 'Filling…' : 'Use my birth details'}
      </button>
    </div>
  )
}
