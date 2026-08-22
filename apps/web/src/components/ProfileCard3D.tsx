'use client'

import React, { useState, useEffect, useRef, useCallback } from 'react'
import type { SearchCard } from './ProfileCard'

// ─── Types ────────────────────────────────────────────────────────────────────

interface ProfileCard3DProps {
  profile: SearchCard
  onShortlist?: (id: string) => Promise<void> | void
  onSendInterest?: (id: string) => Promise<void> | void
  /** Hide the shortlist / interest / view-profile action bar (own-profile & preview). */
  hideActions?: boolean
  /** Enable slow auto-rotation (default true). Always paused on interaction / reduced-motion. */
  autoRotate?: boolean
  className?: string
}

// ─── Constants ────────────────────────────────────────────────────────────────

const CARD_COUNT = 6
const FACE_LABELS = ['Profile', 'Career', 'Lifestyle', 'Roots', 'Places', 'Marriage']
const AUTO_ROTATE_MS = 4800

const TIMELINE_MAP: Record<string, { label: string; pct: number; urgency: string }> = {
  within_3_months: { label: 'Within 3 months', pct: 100, urgency: 'Very soon' },
  within_6_months: { label: 'Within 6 months', pct: 80,  urgency: 'Soon' },
  within_1_year:   { label: 'Within 1 year',   pct: 60,  urgency: 'This year' },
  within_2_years:  { label: '1–2 years',       pct: 40,  urgency: 'When ready' },
  no_rush:         { label: 'Open to discussion', pct: 20, urgency: 'Open' },
}

// ─── Geometry ─────────────────────────────────────────────────────────────────
// Coverflow-style curved ring: each card's transform derived from its signed
// offset (shortest circular distance) from the active card.

function offsetFor(index: number, active: number): number {
  let o = index - active
  if (o > CARD_COUNT / 2) o -= CARD_COUNT
  if (o < -CARD_COUNT / 2) o += CARD_COUNT
  return o
}

function styleForOffset(o: number): { transform: string; opacity: number; z: number } {
  const s = Math.sign(o)
  const a = Math.abs(o)
  switch (a) {
    case 0:
      return { transform: 'translateX(0) translateZ(130px) rotateY(0deg) scale(1)', opacity: 1, z: 40 }
    case 1:
      return { transform: `translateX(${s * 58}%) translateZ(30px) rotateY(${-s * 40}deg) scale(0.86)`, opacity: 0.92, z: 30 }
    case 2:
      return { transform: `translateX(${s * 92}%) translateZ(-45px) rotateY(${-s * 55}deg) scale(0.72)`, opacity: 0.5, z: 20 }
    default: // the single card directly behind centre (|offset| === 3)
      return { transform: `translateX(${s * 100}%) translateZ(-150px) rotateY(${-s * 62}deg) scale(0.6)`, opacity: 0, z: 10 }
  }
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatDiet(diet: string | null): string | null {
  if (!diet) return null
  const map: Record<string, string> = {
    vegetarian:     'Vegetarian',
    non_vegetarian: 'Non-Vegetarian',
    eggetarian:     'Eggetarian',
    vegan:          'Vegan',
  }
  return map[diet.toLowerCase().replace('-', '_')] ?? diet.replace(/_/g, ' ')
}

function yesNo(v: string | null): string | null {
  if (!v) return null
  return v === 'no' ? 'No' : v.replace(/_/g, ' ')
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function FaceHeader({ icon, title }: { icon: React.ReactNode; title: string }) {
  return (
    <div className="flex items-center gap-2 pb-2 border-b border-gold/20">
      <div className="text-maroon opacity-80 flex-shrink-0">{icon}</div>
      <h4 className="font-serif text-[15px] text-maroon leading-none">{title}</h4>
    </div>
  )
}

function Field({ label, value }: { label: string; value: string | null | undefined }) {
  return (
    <div className="flex items-start gap-2.5 py-1.5 border-b border-gold/10 last:border-0">
      <span className="text-[10px] text-ink-soft uppercase tracking-wide w-[74px] flex-shrink-0 pt-0.5 leading-tight">
        {label}
      </span>
      <span className={`text-[13px] leading-snug ${value ? 'text-ink' : 'text-ink-soft/60 italic'}`}>
        {value ?? 'Not provided'}
      </span>
    </div>
  )
}

function EmptyNote({ show, text }: { show: boolean; text: string }) {
  if (!show) return null
  return <p className="text-[12px] text-ink-soft text-center mt-6">{text}</p>
}

// ─── Icons ────────────────────────────────────────────────────────────────────

function BriefcaseIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
      <rect x="2" y="7" width="20" height="14" rx="2"/>
      <path d="M16 7V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v2"/>
    </svg>
  )
}

function LotusIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
      <path d="M12 22c-4-4-8-8-8-12a8 8 0 0 1 16 0c0 4-4 8-8 12z"/>
      <path d="M12 22V10"/>
    </svg>
  )
}

function TempleIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
      <path d="M3 22h18M5 22V10l7-7 7 7v12M10 22v-5h4v5"/>
    </svg>
  )
}

function PinIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
      <path d="M21 10c0 7-9 13-9 13S3 17 3 10a9 9 0 0 1 18 0z"/>
      <circle cx="12" cy="10" r="3"/>
    </svg>
  )
}

function HeartIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
      <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
    </svg>
  )
}

function HeartSmallIcon() {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor" stroke="none" aria-hidden="true">
      <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
    </svg>
  )
}

function StarIcon() {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
      <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
    </svg>
  )
}

// ─── Face content ─────────────────────────────────────────────────────────────

function FaceContent({ index, profile }: { index: number; profile: SearchCard }) {
  switch (index) {
    // ── FACE 0: BASIC PROFILE ──
    case 0:
      return (
        <div className="h-full flex flex-col items-center justify-center text-center gap-2.5">
          <div className="relative">
            <div className="w-24 h-24 rounded-full overflow-hidden border-4 border-gold/50 shadow-mj-sm bg-cream flex items-center justify-center">
              {profile.primary_photo_url ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={profile.primary_photo_url} alt={profile.display_name} className="w-full h-full object-cover" />
              ) : (
                <span className="font-serif text-3xl text-maroon">{profile.display_name.charAt(0)}</span>
              )}
            </div>
            <div className="absolute inset-0 rounded-full border-2 border-gold/30 scale-110 pointer-events-none" />
          </div>
          <div>
            <h3 className="font-serif text-[21px] text-maroon leading-tight px-2 break-words">{profile.display_name}</h3>
            <div className="h-px w-12 bg-gold mx-auto mt-1.5 mb-1.5 opacity-60" />
            <p className="text-[13px] text-ink-soft">
              {[
                profile.age ? `${profile.age} Years` : null,
                profile.gender === 'male' ? 'Male' : profile.gender === 'female' ? 'Female' : null,
              ].filter(Boolean).join(' · ')}
            </p>
            {profile.current_loc_name && <p className="text-[12px] text-terra mt-1">{profile.current_loc_name}</p>}
          </div>
          <div className="flex flex-wrap gap-1.5 justify-center mt-0.5 px-1">
            {profile.caste && (
              <span className="text-[10px] bg-cream text-maroon border border-gold/30 rounded-full px-2.5 py-0.5">{profile.caste}</span>
            )}
            {profile.self_gotra && (
              <span className="text-[10px] bg-cream text-maroon border border-gold/30 rounded-full px-2.5 py-0.5">Gotra: {profile.self_gotra}</span>
            )}
          </div>
          <p className="text-[9px] font-mono text-ink-soft opacity-50 mt-auto">MJ · {profile.id.slice(0, 8).toUpperCase()}</p>
        </div>
      )

    // ── FACE 1: CAREER ──
    case 1: {
      const empty = !profile.employer && !profile.profession_detail && !profile.education_detail && !profile.job_loc_name
      return (
        <div className="h-full flex flex-col gap-1">
          <FaceHeader icon={<BriefcaseIcon />} title="Career & Education" />
          <div className="mt-2 flex-1">
            {!empty && (
              <>
                <Field label="Company" value={profile.employer} />
                <Field label="Designation" value={profile.profession_detail} />
                <Field label="Education" value={profile.education_detail} />
                <Field label="Job City" value={profile.job_loc_name} />
              </>
            )}
          </div>
          <EmptyNote show={empty} text="No career details shared." />
        </div>
      )
    }

    // ── FACE 2: LIFESTYLE ──
    case 2: {
      const empty = !profile.diet && !profile.smoking && !profile.drinking
      return (
        <div className="h-full flex flex-col gap-1">
          <FaceHeader icon={<LotusIcon />} title="Lifestyle" />
          <div className="mt-2 flex-1">
            {!empty && (
              <>
                <Field label="Diet" value={formatDiet(profile.diet)} />
                <Field label="Smoking" value={yesNo(profile.smoking)} />
                <Field label="Drinking" value={yesNo(profile.drinking)} />
              </>
            )}
          </div>
          <EmptyNote show={empty} text="No lifestyle details shared." />
        </div>
      )
    }

    // ── FACE 3: ROOTS & COMMUNITY ──
    case 3: {
      const empty = !profile.self_gotra && !profile.maternal_gotra && !profile.mool && !profile.caste && !profile.gram
      return (
        <div className="h-full flex flex-col gap-1">
          <FaceHeader icon={<TempleIcon />} title="Roots & Community" />
          <div className="mt-2 flex-1">
            {!empty && (
              <>
                <Field label="Gotra" value={profile.self_gotra} />
                <Field label="Mat. Gotra" value={profile.maternal_gotra} />
                <Field label="Caste" value={profile.caste} />
                <Field label="Mool" value={profile.mool} />
                <Field label="Village" value={profile.gram} />
              </>
            )}
          </div>
          <EmptyNote show={empty} text="No community details shared." />
        </div>
      )
    }

    // ── FACE 4: LOCATIONS ──
    case 4: {
      const empty = !profile.native_place_name && !profile.current_loc_name && !profile.job_loc_name
      return (
        <div className="h-full flex flex-col gap-1">
          <FaceHeader icon={<PinIcon />} title="Locations" />
          <div className="mt-2 flex-1">
            {!empty && (
              <>
                <Field label="Native" value={profile.native_place_name} />
                <Field label="Currently" value={profile.current_loc_name} />
                <Field label="Job City" value={profile.job_loc_name} />
              </>
            )}
          </div>
          <EmptyNote show={empty} text="No location details shared." />
        </div>
      )
    }

    // ── FACE 5: MARRIAGE INTENT ──
    case 5: {
      const t = profile.marriage_timeline
        ? TIMELINE_MAP[profile.marriage_timeline] ?? { label: profile.marriage_timeline.replace(/_/g, ' '), pct: 50, urgency: '' }
        : null
      return (
        <div className="h-full flex flex-col gap-1">
          <FaceHeader icon={<HeartIcon />} title="Marriage Intent" />
          <div className="mt-3 flex-1">
            {t ? (
              <>
                <p className="text-[11px] text-ink-soft uppercase tracking-wide mb-2">Looking for marriage</p>
                <p className="font-serif text-[19px] text-maroon mb-2 leading-snug">{t.label}</p>
                <div className="h-2 bg-cream rounded-full overflow-hidden border border-gold/20">
                  <div className="h-full bg-gradient-to-r from-maroon to-terra rounded-full transition-all duration-700" style={{ width: `${t.pct}%` }} />
                </div>
                {t.urgency && <p className="text-[11px] text-terra mt-1.5">{t.urgency}</p>}
              </>
            ) : (
              <EmptyNote show text="Marriage timeline not specified." />
            )}
          </div>
        </div>
      )
    }

    default:
      return null
  }
}

// ─── Card shell ───────────────────────────────────────────────────────────────

function CardShell({ active, children }: { active: boolean; children: React.ReactNode }) {
  return (
    <div
      className={[
        'w-full h-full rounded-mj overflow-hidden bg-paper flex flex-col border',
        active ? 'border-gold shadow-mj ring-1 ring-gold/40' : 'border-gold/20 shadow-mj-sm',
      ].join(' ')}
      style={{ backfaceVisibility: 'hidden' }}
    >
      <div className="h-1.5 bg-gradient-to-r from-maroon via-gold to-maroon flex-shrink-0" />
      <div className="flex-1 min-h-0 px-4 py-3.5 overflow-hidden">{children}</div>
      <div className="h-1 bg-gradient-to-r from-maroon via-gold to-maroon flex-shrink-0" />
    </div>
  )
}

// ─── Main Component ───────────────────────────────────────────────────────────

export function ProfileCard3D({
  profile,
  onShortlist,
  onSendInterest,
  hideActions,
  autoRotate = true,
  className,
}: ProfileCard3DProps) {
  const [active, setActive] = useState(0)
  const [paused, setPaused] = useState(false)     // hover / focus pause
  const [autoStopped, setAutoStopped] = useState(false) // user took control
  const [shortlisted, setShortlisted] = useState(false)
  const [interestSent, setInterestSent] = useState(false)
  const [busy, setBusy] = useState<'shortlist' | 'interest' | null>(null)

  const pointerStartX = useRef<number | null>(null)
  const prefersReducedMotion = useRef(
    typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches
  )

  const navigate = useCallback((dir: 1 | -1) => {
    setActive(a => (a + dir + CARD_COUNT) % CARD_COUNT)
  }, [])

  const navigateTo = useCallback((target: number) => {
    setActive(target % CARD_COUNT)
  }, [])

  const stopAuto = useCallback(() => setAutoStopped(true), [])

  // Auto-rotation
  useEffect(() => {
    if (!autoRotate || autoStopped || paused || prefersReducedMotion.current) return
    const id = setInterval(() => setActive(a => (a + 1) % CARD_COUNT), AUTO_ROTATE_MS)
    return () => clearInterval(id)
  }, [autoRotate, autoStopped, paused])

  // ── Interaction handlers ──
  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'ArrowRight' || e.key === 'ArrowDown') { e.preventDefault(); stopAuto(); navigate(1) }
    if (e.key === 'ArrowLeft' || e.key === 'ArrowUp')    { e.preventDefault(); stopAuto(); navigate(-1) }
  }

  function handlePointerDown(e: React.PointerEvent) {
    pointerStartX.current = e.clientX
  }

  function handlePointerUp(e: React.PointerEvent) {
    if (pointerStartX.current === null) return
    const diff = e.clientX - pointerStartX.current
    pointerStartX.current = null
    if (Math.abs(diff) < 40) return
    stopAuto()
    navigate(diff < 0 ? 1 : -1)
  }

  const transition = prefersReducedMotion.current
    ? 'none'
    : 'transform 0.6s cubic-bezier(0.2, 0.7, 0.2, 1), opacity 0.6s ease'

  return (
    <div className={`w-full max-w-[400px] mx-auto select-none ${className ?? ''}`}>
      {/* ── 3D stage ── */}
      <div
        className="relative w-full overflow-hidden"
        style={{ perspective: 1100 }}
        onPointerDown={handlePointerDown}
        onPointerUp={handlePointerUp}
        onPointerLeave={() => { pointerStartX.current = null; setPaused(false) }}
        onMouseEnter={() => setPaused(true)}
        onFocus={() => setPaused(true)}
        onBlur={() => setPaused(false)}
        onKeyDown={handleKeyDown}
        tabIndex={0}
        role="group"
        aria-roledescription="carousel"
        aria-label={`Profile of ${profile.display_name}. Card ${active + 1} of ${CARD_COUNT}: ${FACE_LABELS[active]}`}
      >
        <div
          className="relative mx-auto h-[330px] sm:h-[360px]"
          style={{ transformStyle: 'preserve-3d' }}
        >
          {Array.from({ length: CARD_COUNT }, (_, i) => {
            const st = styleForOffset(offsetFor(i, active))
            const isActive = i === active
            return (
              <div
                key={i}
                className="absolute top-1/2 left-1/2 w-[196px] h-[300px] sm:w-[224px] sm:h-[330px]"
                style={{
                  transform: `translate(-50%, -50%) ${st.transform}`,
                  opacity: st.opacity,
                  zIndex: st.z,
                  transition,
                  transformStyle: 'preserve-3d',
                  pointerEvents: isActive ? 'auto' : st.opacity > 0 ? 'auto' : 'none',
                  cursor: isActive ? 'default' : 'pointer',
                }}
                onClick={isActive ? undefined : () => { stopAuto(); navigateTo(i) }}
                aria-hidden={!isActive}
              >
                <CardShell active={isActive}>
                  <FaceContent index={i} profile={profile} />
                </CardShell>
              </div>
            )
          })}
        </div>
      </div>

      {/* ── Controls ── */}
      <div className="flex items-center justify-center gap-4 mt-3">
        <button
          type="button"
          onClick={() => { stopAuto(); navigate(-1) }}
          className="text-maroon hover:text-terra transition-colors p-1.5 rounded-full border border-gold/30 hover:border-gold/60 focus:outline-none focus:ring-1 focus:ring-gold"
          aria-label="Previous card"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
            <polyline points="15 18 9 12 15 6" />
          </svg>
        </button>

        <div className="flex items-center gap-1.5">
          {FACE_LABELS.map((label, i) => (
            <button
              key={i}
              type="button"
              onClick={() => { stopAuto(); navigateTo(i) }}
              aria-label={`Card ${i + 1}: ${label}`}
              aria-current={i === active}
              className={['rounded-full transition-all', i === active ? 'w-5 h-2 bg-maroon' : 'w-2 h-2 bg-gold/40 hover:bg-gold/70'].join(' ')}
            />
          ))}
        </div>

        <button
          type="button"
          onClick={() => { stopAuto(); navigate(1) }}
          className="text-maroon hover:text-terra transition-colors p-1.5 rounded-full border border-gold/30 hover:border-gold/60 focus:outline-none focus:ring-1 focus:ring-gold"
          aria-label="Next card"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
            <polyline points="9 18 15 12 9 6" />
          </svg>
        </button>
      </div>

      <p className="text-center text-[11px] text-ink-soft mt-1.5">
        {active + 1} / {CARD_COUNT} · <span className="text-maroon">{FACE_LABELS[active]}</span>
      </p>

      {/* ── Action bar (hidden on own-profile / preview) ── */}
      {!hideActions && (
        <div className="mt-3 max-w-[300px] mx-auto flex flex-col gap-2">
          {(onShortlist || onSendInterest) && (
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                disabled={shortlisted || busy === 'shortlist'}
                onClick={async () => {
                  if (shortlisted || busy) return
                  setBusy('shortlist')
                  await onShortlist?.(profile.id)
                  setShortlisted(true)
                  setBusy(null)
                }}
                className={[
                  'flex items-center justify-center gap-1.5 py-2.5 rounded-mj-sm text-[13px] font-semibold border transition-all',
                  shortlisted ? 'bg-gold border-gold text-maroon' : 'bg-cream border-gold/50 text-maroon hover:bg-gold/10',
                ].join(' ')}
              >
                <StarIcon />
                {shortlisted ? 'Shortlisted' : 'Shortlist'}
              </button>
              <button
                type="button"
                disabled={interestSent || busy === 'interest'}
                onClick={async () => {
                  if (interestSent || busy) return
                  setBusy('interest')
                  await onSendInterest?.(profile.id)
                  setInterestSent(true)
                  setBusy(null)
                }}
                className={[
                  'flex items-center justify-center gap-1.5 py-2.5 rounded-mj-sm text-[13px] font-semibold border transition-all',
                  interestSent ? 'bg-maroon border-maroon text-gold-lt' : 'bg-maroon border-maroon text-gold-lt hover:bg-maroon-deep',
                ].join(' ')}
              >
                <HeartSmallIcon />
                {interestSent ? 'Sent!' : 'Send Interest'}
              </button>
            </div>
          )}
          {/* Always available: navigate to the full profile (to view details & send interest) */}
          <a
            href={`/profile/${profile.id}`}
            className="flex items-center justify-center gap-1.5 py-2.5 rounded-mj-sm text-[13px] font-semibold border border-maroon bg-maroon text-gold-lt hover:bg-maroon-deep transition-colors"
          >
            View Full Profile & Send Interest →
          </a>
        </div>
      )}
    </div>
  )
}

export default ProfileCard3D
