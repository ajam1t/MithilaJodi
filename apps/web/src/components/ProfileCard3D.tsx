'use client'

import React, { useState, useEffect, useRef } from 'react'
import type { SearchCard } from './ProfileCard'

// ─── Types ────────────────────────────────────────────────────────────────────

interface ProfileCard3DProps {
  profile: SearchCard
  onShortlist?: (id: string) => Promise<void> | void
  onSendInterest?: (id: string) => Promise<void> | void
  className?: string
}

// ─── Constants ────────────────────────────────────────────────────────────────

const FACE_LABELS = ['Introduction', 'Career', 'Lifestyle', 'Roots', 'Places', 'Marriage']

const TIMELINE_MAP: Record<string, { label: string; pct: number; urgency: string }> = {
  within_3_months: { label: 'Within 3 months', pct: 100, urgency: 'Very soon' },
  within_6_months: { label: 'Within 6 months', pct: 80,  urgency: 'Soon' },
  within_1_year:   { label: 'Within 1 year',   pct: 60,  urgency: 'This year' },
  within_2_years:  { label: 'Within 2 years',  pct: 40,  urgency: 'When ready' },
  no_rush:         { label: 'No rush',          pct: 20,  urgency: 'Open' },
}

const KEYFRAMES = `
  @keyframes enter-from-right {
    from { opacity: 0; transform: translateX(28px) rotateY(10deg); }
    to   { opacity: 1; transform: translateX(0)    rotateY(0deg);  }
  }
  @keyframes enter-from-left {
    from { opacity: 0; transform: translateX(-28px) rotateY(-10deg); }
    to   { opacity: 1; transform: translateX(0)     rotateY(0deg);   }
  }
  @media (prefers-reduced-motion: reduce) {
    @keyframes enter-from-right { from { opacity: 0; } to { opacity: 1; } }
    @keyframes enter-from-left  { from { opacity: 0; } to { opacity: 1; } }
  }
`

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

// ─── Sub-components ───────────────────────────────────────────────────────────

function MiniPhoto({ profile }: { profile: SearchCard }) {
  return (
    <div className="absolute top-4 right-4">
      <div className="w-8 h-8 rounded-full overflow-hidden border border-gold/40 bg-cream flex-shrink-0 flex items-center justify-center">
        {profile.primary_photo_url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={profile.primary_photo_url} alt="" className="w-full h-full object-cover" />
        ) : (
          <span className="font-serif text-sm text-maroon">{profile.display_name.charAt(0)}</span>
        )}
      </div>
    </div>
  )
}

function FaceHeader({ icon, title }: { icon: React.ReactNode; title: string }) {
  return (
    <div className="flex items-center gap-2.5 pb-2 border-b border-gold/20">
      <div className="text-maroon opacity-80 flex-shrink-0">{icon}</div>
      <h4 className="font-serif text-[16px] text-maroon leading-none">{title}</h4>
    </div>
  )
}

function Field({ label, value }: { label: string; value: string | null | undefined }) {
  if (!value) return null
  return (
    <div className="flex items-start gap-3 py-1.5 border-b border-gold/10 last:border-0">
      <span className="text-[11px] text-ink-soft uppercase tracking-wide w-20 flex-shrink-0 pt-0.5 leading-tight">
        {label}
      </span>
      <span className="text-[14px] text-ink leading-snug">{value}</span>
    </div>
  )
}

// ─── Icons ────────────────────────────────────────────────────────────────────

function BriefcaseIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
      <rect x="2" y="7" width="20" height="14" rx="2"/>
      <path d="M16 7V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v2"/>
    </svg>
  )
}

function LotusIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
      <path d="M12 22c-4-4-8-8-8-12a8 8 0 0 1 16 0c0 4-4 8-8 12z"/>
      <path d="M12 22V10"/>
    </svg>
  )
}

function TempleIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
      <path d="M3 22h18M5 22V10l7-7 7 7v12M10 22v-5h4v5"/>
    </svg>
  )
}

function PinIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
      <path d="M21 10c0 7-9 13-9 13S3 17 3 10a9 9 0 0 1 18 0z"/>
      <circle cx="12" cy="10" r="3"/>
    </svg>
  )
}

function HeartIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
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

// ─── Main Component ───────────────────────────────────────────────────────────

export function ProfileCard3D({
  profile,
  onShortlist,
  onSendInterest,
  className,
}: ProfileCard3DProps) {
  const [face, setFace] = useState(0)
  const [dir, setDir] = useState<1 | -1>(1)
  const [animating, setAnimating] = useState(false)
  const [tilt, setTilt] = useState({ x: 0, y: 0 })
  const [isHovered, setIsHovered] = useState(false)
  const [shortlisted, setShortlisted] = useState(false)
  const [interestSent, setInterestSent] = useState(false)
  const [busy, setBusy] = useState<'shortlist' | 'interest' | null>(null)
  const cardRef = useRef<HTMLDivElement>(null)
  const touchStartX = useRef<number | null>(null)
  const animTimers = useRef<ReturnType<typeof setTimeout>[]>([])
  const prefersReducedMotion = useRef(
    typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches
  )

  useEffect(() => {
    return () => animTimers.current.forEach(clearTimeout)
  }, [])

  function navigate(direction: 1 | -1) {
    if (animating) return
    const next = (face + direction + 6) % 6
    setDir(direction)
    setAnimating(true)
    const t1 = setTimeout(() => setFace(next), prefersReducedMotion.current ? 0 : 180)
    const t2 = setTimeout(() => setAnimating(false), prefersReducedMotion.current ? 0 : 400)
    animTimers.current.push(t1, t2)
  }

  function navigateTo(target: number) {
    if (animating || target === face) return
    const direction: 1 | -1 = target > face ? 1 : -1
    setDir(direction)
    setAnimating(true)
    const t1 = setTimeout(() => setFace(target), prefersReducedMotion.current ? 0 : 180)
    const t2 = setTimeout(() => setAnimating(false), prefersReducedMotion.current ? 0 : 400)
    animTimers.current.push(t1, t2)
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'ArrowRight' || e.key === 'ArrowDown') { e.preventDefault(); navigate(1) }
    if (e.key === 'ArrowLeft'  || e.key === 'ArrowUp')   { e.preventDefault(); navigate(-1) }
  }

  function handleMouseMove(e: React.MouseEvent<HTMLDivElement>) {
    if (prefersReducedMotion.current || !cardRef.current) return
    const rect = cardRef.current.getBoundingClientRect()
    const x = (e.clientX - rect.left)  / rect.width  - 0.5
    const y = (e.clientY - rect.top)   / rect.height - 0.5
    setTilt({ x: y * -6, y: x * 8 })
  }

  function handleMouseLeave() {
    setTilt({ x: 0, y: 0 })
    setIsHovered(false)
  }

  function handleTouchStart(e: React.TouchEvent) {
    touchStartX.current = e.touches[0].clientX
  }

  function handleTouchEnd(e: React.TouchEvent) {
    if (touchStartX.current === null) return
    const diff = e.changedTouches[0].clientX - touchStartX.current
    touchStartX.current = null
    if (Math.abs(diff) < 40) return
    navigate(diff < 0 ? 1 : -1)
  }

  const animClass = dir === 1 ? 'enter-from-right' : 'enter-from-left'

  const cardStyle: React.CSSProperties = {
    transform: `perspective(1200px) rotateX(${tilt.x}deg) rotateY(${tilt.y}deg)`,
    transition: isHovered ? 'transform 0.08s ease-out' : 'transform 0.5s ease-out',
    transformStyle: 'preserve-3d',
  }

  const faceAnim: React.CSSProperties = {
    animation: `${animClass} 0.32s ease forwards`,
  }

  return (
    <div
      ref={cardRef}
      className={`relative select-none ${className ?? ''}`}
      style={{ width: '100%', maxWidth: 360 }}
      onMouseMove={handleMouseMove}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={handleMouseLeave}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
      onKeyDown={handleKeyDown}
      tabIndex={0}
      role="article"
      aria-label={`Profile card for ${profile.display_name}, face ${face + 1} of 6: ${FACE_LABELS[face]}`}
    >
      <style>{KEYFRAMES}</style>

      {/* Outer card shell — gets the 3D tilt */}
      <div style={cardStyle} className="rounded-mj overflow-hidden shadow-mj bg-paper border border-gold/20">

        {/* Top Madhubani border strip */}
        <div className="h-2 bg-gradient-to-r from-maroon via-gold to-maroon" />

        {/* Face content area — fixed height */}
        <div className="relative overflow-hidden" style={{ height: 420 }}>

          {/* ── FACE 0: INTRODUCTION ── */}
          {face === 0 && (
            <div
              key={face}
              style={faceAnim}
              className="absolute inset-0 flex flex-col items-center justify-center px-5 pb-4 pt-6 gap-3 bg-paper"
            >
              {/* Photo */}
              <div className="relative">
                <div className="w-24 h-24 rounded-full overflow-hidden border-4 border-gold/50 shadow-mj-sm bg-cream flex items-center justify-center">
                  {profile.primary_photo_url ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={profile.primary_photo_url}
                      alt={profile.display_name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <span className="font-serif text-3xl text-maroon">
                      {profile.display_name.charAt(0)}
                    </span>
                  )}
                </div>
                <div className="absolute inset-0 rounded-full border-2 border-gold/30 scale-110 pointer-events-none" />
              </div>

              {/* Name & basics */}
              <div className="text-center">
                <h3 className="font-serif text-[22px] text-maroon leading-tight">
                  {profile.display_name}
                </h3>
                <div className="h-px w-12 bg-gold mx-auto mt-1.5 mb-1.5 opacity-60" />
                <p className="text-[13px] text-ink-soft">
                  {[
                    profile.age ? `${profile.age} yrs` : null,
                    profile.gender === 'male' ? 'Male' : profile.gender === 'female' ? 'Female' : null,
                  ]
                    .filter(Boolean)
                    .join(' · ')}
                </p>
                {profile.current_loc_name && (
                  <p className="text-[12px] text-terra mt-1">{profile.current_loc_name}</p>
                )}
              </div>

              {/* Community chips */}
              <div className="flex flex-wrap gap-1.5 justify-center mt-1">
                {profile.caste && (
                  <span className="text-[11px] bg-cream text-maroon border border-gold/30 rounded-full px-3 py-1">
                    {profile.caste}
                  </span>
                )}
                {profile.self_gotra && (
                  <span className="text-[11px] bg-cream text-maroon border border-gold/30 rounded-full px-3 py-1">
                    Gotra: {profile.self_gotra}
                  </span>
                )}
                {profile.mool && (
                  <span className="text-[11px] bg-cream text-maroon border border-gold/30 rounded-full px-3 py-1">
                    {profile.mool}
                  </span>
                )}
              </div>

              {/* Profile ID */}
              <p className="text-[10px] font-mono text-ink-soft opacity-50 mt-auto">
                MJ · {profile.id.slice(0, 8).toUpperCase()}
              </p>
            </div>
          )}

          {/* ── FACE 1: CAREER ── */}
          {face === 1 && (
            <div
              key={face}
              style={faceAnim}
              className="absolute inset-0 flex flex-col px-5 py-5 bg-paper gap-1"
            >
              <MiniPhoto profile={profile} />
              <FaceHeader icon={<BriefcaseIcon />} title="Career & Education" />
              <div className="mt-3 flex-1">
                <Field label="Company"     value={profile.employer} />
                <Field label="Designation" value={profile.profession_detail} />
                <Field label="Education"   value={profile.education_detail} />
              </div>
              {!profile.employer && !profile.profession_detail && !profile.education_detail && (
                <p className="text-[13px] text-ink-soft text-center mt-8">No career details shared.</p>
              )}
            </div>
          )}

          {/* ── FACE 2: LIFESTYLE ── */}
          {face === 2 && (
            <div
              key={face}
              style={faceAnim}
              className="absolute inset-0 flex flex-col px-5 py-5 bg-paper gap-1"
            >
              <MiniPhoto profile={profile} />
              <FaceHeader icon={<LotusIcon />} title="Lifestyle" />
              <div className="mt-3 flex-1">
                <Field label="Diet"     value={formatDiet(profile.diet)} />
                <Field
                  label="Smoking"
                  value={
                    profile.smoking
                      ? profile.smoking === 'no' ? 'No' : profile.smoking.replace(/_/g, ' ')
                      : null
                  }
                />
                <Field
                  label="Drinking"
                  value={
                    profile.drinking
                      ? profile.drinking === 'no' ? 'No' : profile.drinking.replace(/_/g, ' ')
                      : null
                  }
                />
              </div>
              {!profile.diet && !profile.smoking && !profile.drinking && (
                <p className="text-[13px] text-ink-soft text-center mt-8">No lifestyle details shared.</p>
              )}
            </div>
          )}

          {/* ── FACE 3: ROOTS ── */}
          {face === 3 && (
            <div
              key={face}
              style={faceAnim}
              className="absolute inset-0 flex flex-col px-5 py-5 bg-paper gap-1"
            >
              <MiniPhoto profile={profile} />
              <FaceHeader icon={<TempleIcon />} title="Community & Roots" />
              <div className="mt-3 flex-1">
                <Field label="Gotra"      value={profile.self_gotra} />
                <Field label="Mat. Gotra" value={profile.maternal_gotra} />
                <Field label="Mool"       value={profile.mool} />
                <Field label="Caste"      value={profile.caste} />
                <Field label="Village"    value={profile.gram} />
              </div>
              {!profile.self_gotra && !profile.maternal_gotra && !profile.mool && !profile.caste && !profile.gram && (
                <p className="text-[13px] text-ink-soft text-center mt-8">No community details shared.</p>
              )}
            </div>
          )}

          {/* ── FACE 4: PLACES ── */}
          {face === 4 && (
            <div
              key={face}
              style={faceAnim}
              className="absolute inset-0 flex flex-col px-5 py-5 bg-paper gap-1"
            >
              <MiniPhoto profile={profile} />
              <FaceHeader icon={<PinIcon />} title="Places" />
              <div className="mt-3 flex-1">
                <Field label="Village"  value={profile.gram} />
                <Field label="Native"   value={profile.native_place_name} />
                <Field label="Currently" value={profile.current_loc_name} />
                <Field label="Job City" value={profile.job_loc_name} />
              </div>
              {!profile.gram && !profile.native_place_name && !profile.current_loc_name && !profile.job_loc_name && (
                <p className="text-[13px] text-ink-soft text-center mt-8">No location details shared.</p>
              )}
            </div>
          )}

          {/* ── FACE 5: MARRIAGE INTENT ── */}
          {face === 5 && (
            <div
              key={face}
              style={faceAnim}
              className="absolute inset-0 flex flex-col px-5 py-5 bg-paper gap-3"
            >
              <MiniPhoto profile={profile} />
              <FaceHeader icon={<HeartIcon />} title="Marriage Plans" />

              <div className="mt-2 flex-1">
                {profile.marriage_timeline ? (() => {
                  const t = TIMELINE_MAP[profile.marriage_timeline] ?? {
                    label:   profile.marriage_timeline.replace(/_/g, ' '),
                    pct:     50,
                    urgency: '',
                  }
                  return (
                    <div className="mb-4">
                      <p className="text-[12px] text-ink-soft uppercase tracking-wide mb-2">
                        Looking to marry
                      </p>
                      <p className="font-serif text-[18px] text-maroon mb-2">{t.label}</p>
                      <div className="h-2 bg-cream rounded-full overflow-hidden">
                        <div
                          className="h-full bg-gradient-to-r from-maroon to-terra rounded-full transition-all duration-700"
                          style={{ width: `${t.pct}%` }}
                        />
                      </div>
                      {t.urgency && (
                        <p className="text-[11px] text-terra mt-1">{t.urgency}</p>
                      )}
                    </div>
                  )
                })() : (
                  <p className="text-[13px] text-ink-soft mb-4">Marriage timeline not specified.</p>
                )}
              </div>

              {/* CTAs */}
              <div className="flex flex-col gap-2 mt-auto">
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
                      shortlisted
                        ? 'bg-gold border-gold text-maroon'
                        : 'bg-cream border-gold/50 text-maroon hover:bg-gold/10',
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
                      interestSent
                        ? 'bg-maroon border-maroon text-gold-lt'
                        : 'bg-maroon border-maroon text-gold-lt hover:bg-maroon-deep',
                    ].join(' ')}
                  >
                    <HeartSmallIcon />
                    {interestSent ? 'Sent!' : 'Send Interest'}
                  </button>
                </div>
                <a
                  href={`/profile/${profile.id}`}
                  className="flex items-center justify-center gap-1 text-[12px] text-maroon hover:text-terra transition-colors py-1"
                >
                  View Full Profile →
                </a>
              </div>
            </div>
          )}
        </div>

        {/* Bottom nav bar */}
        <div className="bg-maroon-deep px-4 py-2.5 flex items-center justify-between">
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="text-gold-lt hover:text-gold transition-colors p-1 rounded focus:outline-none focus:ring-1 focus:ring-gold"
            aria-label="Previous face"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
              <polyline points="15 18 9 12 15 6"/>
            </svg>
          </button>

          {/* Face indicator dots */}
          <div className="flex items-center gap-1.5">
            {FACE_LABELS.map((label, i) => (
              <button
                key={i}
                type="button"
                onClick={() => navigateTo(i)}
                aria-label={`Face ${i + 1}: ${label}`}
                className={[
                  'rounded-full transition-all',
                  i === face
                    ? 'w-4 h-2 bg-gold'
                    : 'w-2 h-2 bg-gold opacity-30 hover:opacity-60',
                ].join(' ')}
              />
            ))}
          </div>

          <button
            type="button"
            onClick={() => navigate(1)}
            className="text-gold-lt hover:text-gold transition-colors p-1 rounded focus:outline-none focus:ring-1 focus:ring-gold"
            aria-label="Next face"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
              <polyline points="9 18 15 12 9 6"/>
            </svg>
          </button>
        </div>

        {/* Bottom gold strip */}
        <div className="h-1.5 bg-gradient-to-r from-maroon via-gold to-maroon" />
      </div>
    </div>
  )
}

export default ProfileCard3D
