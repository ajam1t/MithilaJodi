'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import type { ReactNode } from 'react'
import Image from 'next/image'
import type { SearchCard } from '@/types/profile'

type ProfileCardGallery3DProps = {
  profile: SearchCard
  autoRotate?: boolean
}

const BASE_CARDS = ['Profile', 'Career', 'Lifestyle', 'Roots', 'Marriage'] as const
const ROTATE_MS = 4800

const BAND_LABEL: Record<'excellent' | 'strong' | 'good' | 'fair', string> = {
  excellent: 'Excellent match',
  strong: 'Strong match',
  good: 'Good match',
  fair: 'Possible match',
}

function offsetFor(index: number, active: number, count: number) {
  let offset = index - active
  if (offset > count / 2) offset -= count
  if (offset < -count / 2) offset += count
  return offset
}

function styleForOffset(offset: number) {
  const side = Math.sign(offset)
  switch (Math.abs(offset)) {
    case 0: return { transform: 'translateX(0) translateZ(110px) rotateY(0deg) scale(1)', opacity: 1, zIndex: 30 }
    case 1: return { transform: `translateX(${side * 58}%) translateZ(20px) rotateY(${-side * 38}deg) scale(.86)`, opacity: .88, zIndex: 20 }
    default: return { transform: `translateX(${side * 98}%) translateZ(-70px) rotateY(${-side * 52}deg) scale(.72)`, opacity: .42, zIndex: 10 }
  }
}

function text(value: string | number | null | undefined, fallback = 'Not provided') {
  return value == null || value === '' ? fallback : String(value)
}

function humanize(value: string | null | undefined) {
  return value ? value.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase()) : null
}

function Field({ label, value }: { label: string; value: string | number | null | undefined }) {
  return (
    <div className="flex items-start justify-between gap-3 border-b border-gold/15 py-2 last:border-0">
      <span className="shrink-0 text-[10px] uppercase tracking-wide text-ink-soft">{label}</span>
      <span className="text-right text-[13px] leading-snug text-ink">{text(value)}</span>
    </div>
  )
}

function CardFrame({ children, active }: { children: ReactNode; active: boolean }) {
  return (
    <div className={`flex h-full w-full flex-col overflow-hidden rounded-mj border bg-paper ${active ? 'border-gold shadow-mj ring-1 ring-gold/30' : 'border-gold/20 shadow-mj-sm'}`}>
      <div className="h-1.5 shrink-0 bg-gradient-to-r from-maroon via-gold to-maroon" />
      <div className="min-h-0 flex-1 px-4 py-3.5">{children}</div>
      <div className="h-1 shrink-0 bg-gradient-to-r from-maroon via-gold to-maroon" />
    </div>
  )
}

/**
 * "MBA, Finance - Mumbai University" from whichever of the structured education
 * fields are filled, falling back to the free-text field.
 *
 * The card previously showed `education_detail` alone, so a member who filled in
 * Degree, Specialisation and Institution in the editor saw only whatever
 * happened to be in the separate free-text box - usually far less than they had
 * entered, which reads as "my education is not showing".
 */
function educationLine(profile: SearchCard): string | null {
  const degree = [profile.degree, profile.specialization].filter(Boolean).join(', ')
  const withPlace = [degree || null, profile.institution].filter(Boolean).join(' \u2014 ')
  return withPlace || profile.education_detail || null
}

function Face({ card, profile }: { card: string; profile: SearchCard }) {
  if (card === 'Profile') {
    return (
      <div className="flex h-full flex-col">
        <p className="mb-2 text-[10px] uppercase tracking-widest text-terra">Profile</p>
        <div className="relative mx-auto mb-3 h-24 w-24 overflow-hidden rounded-full border-2 border-gold/60 bg-cream">
          {profile.primary_photo_url ? (
            <Image src={profile.primary_photo_url} alt={profile.display_name} fill sizes="96px" className="object-cover" />
          ) : (
            <div className="flex h-full items-center justify-center font-serif text-4xl text-maroon">{profile.display_name.charAt(0).toUpperCase()}</div>
          )}
        </div>
        <h3 className="text-center font-serif text-xl leading-tight text-maroon">{profile.display_name}</h3>
        <p className="mt-1 text-center text-[12px] text-ink-soft">{profile.age ? `${profile.age} yrs` : 'Age not provided'}{profile.gender ? ` · ${humanize(profile.gender)}` : ''}</p>
        <div className="mt-auto space-y-0.5">
          <Field label="Caste" value={profile.caste} />
          <Field label="Status" value={humanize(profile.marital_status)} />
          <Field label="Location" value={profile.current_loc_name ?? profile.native_place_name} />
        </div>
      </div>
    )
  }

  if (card === 'Career') {
    return (
      <div>
        <p className="mb-3 text-[10px] uppercase tracking-widest text-terra">Career & education</p>
        <Field label="Education" value={educationLine(profile)} />
        <Field label="Role" value={profile.job_title} />
        <Field label="Profession" value={profile.profession_detail} />
        <Field label="Employer" value={profile.employer} />
        <Field label="Job city" value={profile.job_loc_name} />
      </div>
    )
  }

  if (card === 'Lifestyle') {
    return (
      <div>
        <p className="mb-3 text-[10px] uppercase tracking-widest text-terra">Lifestyle</p>
        <Field label="Height" value={profile.height_cm ? `${profile.height_cm} cm` : null} />
        <Field label="Diet" value={humanize(profile.diet)} />
        <Field label="Smoking" value={humanize(profile.smoking)} />
        <Field label="Drinking" value={humanize(profile.drinking)} />
        <Field label="About" value={profile.about_snippet ? `${profile.about_snippet.slice(0, 55)}…` : null} />
      </div>
    )
  }

  if (card === 'Roots') {
    return (
      <div>
        <p className="mb-3 text-[10px] uppercase tracking-widest text-terra">Roots & community</p>
        <Field label="Native place" value={profile.native_place_name} />
        <Field label="Current city" value={profile.current_loc_name} />
        <Field label="Gotra" value={profile.self_gotra} />
        <Field label="Maternal gotra" value={profile.maternal_gotra} />
        <Field label="Mool / Gram" value={[profile.mool, profile.gram].filter(Boolean).join(' · ') || null} />
      </div>
    )
  }

  if (card === 'Marriage') {
    return (
      <div>
        <p className="mb-3 text-[10px] uppercase tracking-widest text-terra">Marriage outlook</p>
        <Field label="Timeline" value={humanize(profile.marriage_timeline)} />
        <Field label="Marital status" value={humanize(profile.marital_status)} />
        <Field label="Family" value={humanize(profile.family_type)} />
        <Field label="Profile status" value={humanize(profile.profile_status)} />
        <div className="mt-4 rounded-mj-sm border border-gold/25 bg-cream px-3 py-2.5 text-center">
          <p className="font-serif text-[15px] text-maroon">A thoughtful beginning</p>
          <p className="mt-0.5 text-[11px] leading-relaxed text-ink-soft">Review the full profile to see more details and connect respectfully.</p>
        </div>
      </div>
    )
  }

  if (card === 'Preferences') {
    // Only rendered when profile.preferences is non-null, and that loader
    // already returns null unless the family actually stated something.
    const q = profile.preferences!
    return (
      <div className="flex h-full flex-col">
        <p className="mb-2 text-[10px] uppercase tracking-widest text-terra">Looking for</p>
        <div className="min-h-0 flex-1 overflow-y-auto">
          <Field label="Age" value={q.ageRange} />
          <Field label="Bride / Groom" value={q.lookingFor} />
          <Field label="Community" value={q.community} />
          <Field label="Marital status" value={q.maritalStatus} />
          <Field label="Education" value={q.education} />
          <Field label="Profession" value={q.profession} />
          <Field label="Location" value={q.location} />
          <Field label="Diet" value={q.diet} />
          <Field label="Timeline" value={q.marriageTimeline} />
          <Field label="Manglik" value={q.manglik} />
          {q.notes && (
            <p className="mt-2 text-[11.5px] leading-snug text-ink-soft">
              {q.notes.length > 150 ? `${q.notes.slice(0, 150)}…` : q.notes}
            </p>
          )}
        </div>
        {q.gotraSafe && (
          <p className="mt-2 pt-2 border-t border-gold/20 text-[10px] leading-snug text-ink-soft">
            Gotra-safe matches only
          </p>
        )}
      </div>
    )
  }

  // Match face — only ever rendered when profile.match exists (see CARDS).
  const match = profile.match!
  const blocked = match.blockers.length > 0
  return (
    <div className="flex h-full flex-col">
      <p className="mb-2 text-[10px] uppercase tracking-widest text-terra">How you match</p>
      <div className="flex items-baseline gap-2">
        <span className={`font-serif text-3xl leading-none ${blocked ? 'text-terra' : match.score >= 80 ? 'text-green' : match.score >= 65 ? 'text-gold' : 'text-maroon'}`}>
          {match.score}
        </span>
        <span className="text-[12px] text-maroon">{blocked ? 'Needs checking' : BAND_LABEL[match.band]}</span>
      </div>
      <p className="mt-0.5 text-[10.5px] text-ink-soft">Based on {Math.round(match.confidence * 100)}% of our factors</p>

      {blocked ? (
        <p className="mt-2.5 rounded-mj-sm border border-terra/25 bg-terra/[0.07] px-2 py-1.5 text-[11.5px] leading-snug text-terra">
          {match.blockers[0]}
        </p>
      ) : (
        <ul className="mt-2.5 space-y-1.5">
          {match.reasons.slice(0, 3).map(r => (
            <li key={r.key} className="flex gap-1.5 text-[11.5px] leading-snug text-ink">
              <span aria-hidden="true" className="shrink-0 text-green">✓</span>
              <span>{r.detail}</span>
            </li>
          ))}
        </ul>
      )}

      <p className="mt-auto pt-2 text-[10px] leading-snug text-ink-soft">
        A guide, not a verdict. Full breakdown below.
      </p>
    </div>
  )
}

export default function ProfileCardGallery3D({ profile, autoRotate = true }: ProfileCardGallery3DProps) {
  // Both extra faces are conditional. Preferences appears only when the family
  // stated something; the match face only when there is a score to show (your
  // own profile and a signed-out viewer have nothing to compare against). An
  // empty card is worse than one fewer card.
  const CARDS: readonly string[] = [
    ...BASE_CARDS,
    ...(profile.preferences ? ['Preferences'] : []),
    ...(profile.match ? ['Match'] : []),
  ]

  const [active, setActive] = useState(0)
  const [paused, setPaused] = useState(false)
  const [stopped, setStopped] = useState(false)
  const pointerStart = useRef<number | null>(null)
  const reducedMotion = useRef(typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches)

  const navigate = useCallback((direction: 1 | -1) => {
    setActive(current => (current + direction + CARDS.length) % CARDS.length)
  }, [CARDS.length])

  useEffect(() => {
    if (!autoRotate || paused || stopped || reducedMotion.current) return
    const timer = setInterval(() => navigate(1), ROTATE_MS)
    return () => clearInterval(timer)
  }, [autoRotate, navigate, paused, stopped])

  function stopAndNavigate(direction: 1 | -1) {
    setStopped(true)
    navigate(direction)
  }

  function handleKeyDown(event: React.KeyboardEvent<HTMLDivElement>) {
    if (event.key === 'ArrowRight' || event.key === 'ArrowDown') { event.preventDefault(); stopAndNavigate(1) }
    if (event.key === 'ArrowLeft' || event.key === 'ArrowUp') { event.preventDefault(); stopAndNavigate(-1) }
  }

  function handlePointerUp(event: React.PointerEvent<HTMLDivElement>) {
    if (pointerStart.current === null) return
    const distance = event.clientX - pointerStart.current
    pointerStart.current = null
    if (Math.abs(distance) >= 40) stopAndNavigate(distance < 0 ? 1 : -1)
  }

  return (
    <div className="w-full select-none">
      <div
        className="relative w-full overflow-hidden"
        style={{ perspective: 1100 }}
        onPointerDown={event => { pointerStart.current = event.clientX }}
        onPointerUp={handlePointerUp}
        onPointerLeave={() => { pointerStart.current = null }}
        onMouseEnter={() => setPaused(true)}
        onMouseLeave={() => setPaused(false)}
        onFocus={() => setPaused(true)}
        onBlur={() => setPaused(false)}
        onKeyDown={handleKeyDown}
        tabIndex={0}
        role="group"
        aria-roledescription="carousel"
        aria-label={`Your profile information cards. Showing ${CARDS[active]}.`}
      >
        <div className="relative mx-auto h-[330px] max-w-[620px] sm:h-[370px]" style={{ transformStyle: 'preserve-3d' }}>
          {CARDS.map((label, index) => {
            const style = styleForOffset(offsetFor(index, active, CARDS.length))
            const isActive = index === active
            return (
              <div
                key={label}
                className="absolute left-1/2 top-1/2 h-[290px] w-[190px] sm:h-[330px] sm:w-[220px]"
                style={{
                  transform: `translate(-50%, -50%) ${style.transform}`,
                  opacity: style.opacity,
                  zIndex: style.zIndex,
                  transition: reducedMotion.current ? 'none' : 'transform .6s cubic-bezier(.2,.7,.2,1), opacity .6s ease',
                  transformStyle: 'preserve-3d',
                  pointerEvents: 'auto',
                }}
                onClick={() => { if (!isActive) { setStopped(true); setActive(index) } }}
                aria-hidden={!isActive}
              >
                <CardFrame active={isActive}><Face card={label} profile={profile} /></CardFrame>
              </div>
            )
          })}
        </div>
      </div>

      <div className="mt-2 flex items-center justify-center gap-4">
        <button type="button" onClick={() => stopAndNavigate(-1)} className="rounded-full border border-gold/40 p-1.5 text-maroon hover:border-gold focus:outline-none focus:ring-1 focus:ring-gold" aria-label="Previous information card">←</button>
        <div className="flex items-center gap-1.5" aria-label="Choose profile information card">
          {CARDS.map((label, index) => (
            <button key={label} type="button" onClick={() => { setStopped(true); setActive(index) }} aria-label={label} aria-current={active === index} className={`rounded-full transition-all ${active === index ? 'h-2 w-5 bg-maroon' : 'h-2 w-2 bg-gold/50 hover:bg-gold'}`} />
          ))}
        </div>
        <button type="button" onClick={() => stopAndNavigate(1)} className="rounded-full border border-gold/40 p-1.5 text-maroon hover:border-gold focus:outline-none focus:ring-1 focus:ring-gold" aria-label="Next information card">→</button>
      </div>
      <p className="mt-1.5 text-center text-[11px] text-ink-soft">{active + 1} / {CARDS.length} · <span className="text-maroon">{CARDS[active]}</span> · swipe or use arrows</p>
    </div>
  )
}
