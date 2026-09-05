'use client'

import React, { useState, useCallback, useRef } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import type { SearchCard } from '@/types/profile'
import { cn } from '@/lib/utils/cn'
import { VerifiedBadge } from '@/components/ui'

// ─── Types ──────────────────────────────────────────────────────────────────

interface ProfileCardProps {
  profile: SearchCard
  onShortlist?: (id: string) => Promise<void> | void
  onSendInterest?: (id: string) => Promise<void> | void
  /** Hide the shortlist / interest action bar (own-profile & preview surfaces). */
  hideActions?: boolean
  /** Accepted for backwards compatibility; the flip card does not auto-rotate. */
  autoRotate?: boolean
  /** Compact presentation for the homepage featured carousel. */
  compact?: boolean
  className?: string
}

const TIMELINE_MAP: Record<string, string> = {
  within_3_months: 'Within 3 months',
  within_6_months: 'Within 6 months',
  within_1_year: 'Within 1 year',
  within_2_years: '1–2 years',
  no_rush: 'Open to discussion',
}

// ─── Helpers ────────────────────────────────────────────────────────────────

function formatDiet(diet: string | null): string | null {
  if (!diet) return null
  const map: Record<string, string> = {
    vegetarian: 'Vegetarian',
    non_vegetarian: 'Non-Vegetarian',
    eggetarian: 'Eggetarian',
    vegan: 'Vegan',
  }
  return map[diet.toLowerCase().replace('-', '_')] ?? diet.replace(/_/g, ' ')
}

function yesNo(v: string | null): string | null {
  if (!v) return null
  return v === 'no' ? 'No' : v.replace(/_/g, ' ')
}

function heightLabel(cm: number | null): string | null {
  if (!cm) return null
  const totalInches = Math.round(cm / 2.54)
  const ft = Math.floor(totalInches / 12)
  const inch = totalInches % 12
  return `${ft}'${inch}" · ${cm} cm`
}

// ─── Icons ──────────────────────────────────────────────────────────────────

function PinIcon({ className }: { className?: string }) {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" className={className} aria-hidden="true">
      <path d="M21 10c0 7-9 13-9 13S3 17 3 10a9 9 0 0 1 18 0z" />
      <circle cx="12" cy="10" r="3" />
    </svg>
  )
}
function HeartIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
    </svg>
  )
}
function StarIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
      <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
    </svg>
  )
}

/** Simplified Madhubani-style lotus figure for the no-photo placeholder. */
function LotusPlaceholder({ initial }: { initial: string }) {
  return (
    <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-gradient-to-br from-paper-2 to-paper-3">
      <svg width="88" height="88" viewBox="0 0 120 120" fill="none" aria-hidden="true" className="opacity-70">
        {[0, 40, 80, 120, 160, 200, 240, 280, 320].map((a) => (
          <ellipse
            key={a}
            cx="60"
            cy="60"
            rx="11"
            ry="34"
            fill="none"
            stroke="#B98A2E"
            strokeWidth="1.2"
            opacity="0.55"
            transform={`rotate(${a} 60 60)`}
          />
        ))}
        <circle cx="60" cy="60" r="13" fill="#E8912A" opacity="0.35" />
      </svg>
      <span className="font-serif text-4xl text-maroon/70 select-none">{initial}</span>
    </div>
  )
}

// ─── Detail rows (back face) ──────────────────────────────────────────────────

function DetailRow({ label, value }: { label: string; value: string | null | undefined }) {
  if (!value) return null
  return (
    <div className="flex items-start gap-2.5 py-1.5 border-b border-gold/10 last:border-0">
      <span className="text-[10px] text-ink-soft uppercase tracking-wide w-[76px] flex-shrink-0 pt-0.5 leading-tight">
        {label}
      </span>
      <span className="text-[13px] leading-snug text-ink">{value}</span>
    </div>
  )
}

// ─── Component ────────────────────────────────────────────────────────────────

export function ProfileCard3D({
  profile,
  onShortlist,
  onSendInterest,
  hideActions,
  compact = false,
  className,
}: ProfileCardProps) {
  const [flipped, setFlipped] = useState(false)
  const [shortlisted, setShortlisted] = useState(false)
  const [interestSent, setInterestSent] = useState(false)
  const [busy, setBusy] = useState<'shortlist' | 'interest' | null>(null)

  const reducedMotion = useRef(
    typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches
  )

  const genderLabel = profile.gender === 'male' ? 'Male' : profile.gender === 'female' ? 'Female' : null
  const metaLine = [profile.age ? `${profile.age} yrs` : null, genderLabel, heightLabel(profile.height_cm)]
    .filter(Boolean)
    .join(' · ')
  const locationLine = [profile.current_loc_name, profile.native_place_name].filter(Boolean).join(' · ')
  const communityTags = [profile.caste, profile.self_gotra && `Gotra: ${profile.self_gotra}`, profile.mool && `Mool: ${profile.mool}`]
    .filter(Boolean)
    .slice(0, 3) as string[]

  const hasDetails = Boolean(
    profile.employer || profile.profession_detail || profile.education_detail ||
    profile.maternal_gotra || profile.gram || profile.diet || profile.smoking ||
    profile.drinking || profile.marriage_timeline || profile.job_loc_name
  )

  const handleShortlist = useCallback(async () => {
    if (shortlisted || busy) return
    setBusy('shortlist')
    try {
      await onShortlist?.(profile.id)
      setShortlisted(true)
    } catch { /* handler surfaces its own error */ }
    finally { setBusy(null) }
  }, [shortlisted, busy, onShortlist, profile.id])

  const handleInterest = useCallback(async () => {
    if (interestSent || busy) return
    setBusy('interest')
    try {
      await onSendInterest?.(profile.id)
      setInterestSent(true)
    } catch { /* handler surfaces its own error */ }
    finally { setBusy(null) }
  }, [interestSent, busy, onSendInterest, profile.id])

  const showActions = !hideActions && (onShortlist || onSendInterest)

  return (
    <div className={cn('w-full mx-auto', compact ? 'max-w-[280px]' : 'max-w-[320px]', className)} style={{ perspective: 1200 }}>
      <div
        className={cn('relative w-full transition-transform duration-500 ease-mj-out', compact ? 'h-[360px]' : 'h-[452px]')}
        style={{
          transformStyle: 'preserve-3d',
          transform: flipped ? 'rotateY(180deg)' : 'rotateY(0deg)',
          transitionDuration: reducedMotion.current ? '0ms' : undefined,
        }}
      >
        {/* ── FRONT ─────────────────────────────────────────── */}
        <div
          className="absolute inset-0 flex flex-col rounded-mj-lg overflow-hidden bg-cream border border-paper-3 shadow-mj-sm"
          style={{ backfaceVisibility: 'hidden' }}
          aria-hidden={flipped}
          inert={flipped}
        >
          <div className="gold-strip flex-shrink-0" />

          {/* Photo */}
          <div className="relative flex-shrink-0" style={{ aspectRatio: '4 / 3' }}>
            {profile.primary_photo_url ? (
              <Image
                src={profile.primary_photo_url}
                alt={profile.display_name}
                fill
                sizes={compact ? '(max-width: 640px) 80vw, 280px' : '(max-width: 640px) 90vw, 320px'}
                className="object-cover"
              />
            ) : (
              <LotusPlaceholder initial={profile.display_name.charAt(0).toUpperCase()} />
            )}
            {/* gradient for legibility of any overlay */}
            <div className="absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-black/35 to-transparent pointer-events-none" />
            {profile.verified && (
              <div className="absolute top-2.5 left-2.5">
                <VerifiedBadge />
              </div>
            )}
            {!profile.primary_photo_url && (
              <span className="absolute bottom-2 inset-x-0 text-center text-[10px] text-ink-soft">
                Photo shared on request
              </span>
            )}
          </div>

          {/* Body */}
          <div className={cn('flex-1 min-h-0 flex flex-col', compact ? 'px-3 pt-2 pb-2.5' : 'px-4 pt-3 pb-3.5')}>
            <Link href={`/profile/${profile.id}`} className="group">
              <h3 className={cn('font-serif text-maroon leading-tight group-hover:text-terra transition-colors truncate', compact ? 'text-[17px]' : 'text-[19px]')}>
                {profile.display_name}
              </h3>
            </Link>
            {metaLine && <p className={cn('text-ink-soft mt-0.5', compact ? 'text-[11.5px]' : 'text-[12.5px]')}>{metaLine}</p>}
            {locationLine && (
              <p className={cn('text-terra flex items-center gap-1 truncate', compact ? 'text-[11px] mt-0.5' : 'text-[12px] mt-1')}>
                <PinIcon className="flex-shrink-0" /> <span className="truncate">{locationLine}</span>
              </p>
            )}

            {communityTags.length > 0 && (
              <div className={cn('flex flex-wrap', compact ? 'gap-1 mt-1.5' : 'gap-1.5 mt-2.5')}>
                {communityTags.map((t) => (
                  <span
                    key={t}
                    className={cn('rounded-pill border border-green/15 bg-green/[0.06] text-green', compact ? 'text-[9px] px-1.5 py-0.5' : 'text-[10px] px-2 py-0.5')}
                  >
                    {t}
                  </span>
                ))}
              </div>
            )}

            <div className={cn('mt-auto flex flex-col', compact ? 'gap-1.5 pt-2' : 'gap-2 pt-3')}>
              {showActions && (
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    disabled={shortlisted || busy === 'shortlist'}
                    onClick={handleShortlist}
                    className={cn(
                      cn('flex items-center justify-center gap-1.5 rounded-mj-sm font-semibold border transition-all disabled:opacity-70', compact ? 'py-1.5 text-[12px]' : 'py-2 text-[13px]'),
                      shortlisted ? 'bg-gold border-gold text-maroon' : 'bg-cream border-gold/50 text-maroon hover:bg-gold/10'
                    )}
                  >
                    <StarIcon />
                    {shortlisted ? 'Saved' : 'Shortlist'}
                  </button>
                  <button
                    type="button"
                    disabled={interestSent || busy === 'interest'}
                    onClick={handleInterest}
                    className={cn(
                      cn('flex items-center justify-center gap-1.5 rounded-mj-sm font-semibold border transition-all disabled:opacity-70', compact ? 'py-1.5 text-[12px]' : 'py-2 text-[13px]'),
                      'bg-maroon-gradient border-maroon text-cream hover:shadow-mj-sm'
                    )}
                  >
                    <HeartIcon />
                    {interestSent ? 'Sent' : 'Interest'}
                  </button>
                </div>
              )}
              <div className="flex items-center gap-2">
                <Link
                  href={`/profile/${profile.id}`}
                  className={cn('flex-1 text-center rounded-mj-sm font-semibold border border-maroon/30 text-maroon hover:bg-maroon hover:text-cream transition-colors', compact ? 'py-1.5 text-[12px]' : 'py-2 text-[13px]')}
                >
                  View profile
                </Link>
                {hasDetails && (
                  <button
                    type="button"
                    onClick={() => setFlipped(true)}
                    aria-expanded={flipped}
                    className={cn('rounded-mj-sm font-semibold border border-gold/40 text-ink-soft hover:text-maroon hover:border-gold transition-colors', compact ? 'px-2 py-1.5 text-[12px]' : 'px-3 py-2 text-[13px]')}
                  >
                    Details
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* ── BACK ──────────────────────────────────────────── */}
        <div
          className="absolute inset-0 flex flex-col rounded-mj-lg overflow-hidden bg-cream border border-gold shadow-mj"
          style={{ backfaceVisibility: 'hidden', transform: 'rotateY(180deg)' }}
          aria-hidden={!flipped}
          inert={!flipped}
        >
          <div className="gold-strip flex-shrink-0" />
          <div className="flex items-center justify-between px-4 pt-3 pb-2 border-b border-gold/20 flex-shrink-0">
            <h3 className="font-serif text-[17px] text-maroon truncate">{profile.display_name}</h3>
            <button
              type="button"
              onClick={() => setFlipped(false)}
              className="text-[12px] font-semibold text-ink-soft hover:text-maroon flex items-center gap-1"
              aria-label="Back to photo"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" aria-hidden="true">
                <polyline points="15 18 9 12 15 6" />
              </svg>
              Back
            </button>
          </div>

          <div className="flex-1 min-h-0 overflow-y-auto px-4 py-2.5">
            <DetailRow label="Education" value={profile.education_detail} />
            <DetailRow label="Profession" value={profile.profession_detail} />
            <DetailRow label="Company" value={profile.employer} />
            <DetailRow label="Job City" value={profile.job_loc_name} />
            <DetailRow label="Gotra" value={profile.self_gotra} />
            <DetailRow label="Mat. Gotra" value={profile.maternal_gotra} />
            <DetailRow label="Mool" value={profile.mool} />
            <DetailRow label="Village" value={profile.gram} />
            <DetailRow label="Diet" value={formatDiet(profile.diet)} />
            <DetailRow label="Smoking" value={yesNo(profile.smoking)} />
            <DetailRow label="Drinking" value={yesNo(profile.drinking)} />
            <DetailRow
              label="Marriage"
              value={
                profile.marriage_timeline
                  ? TIMELINE_MAP[profile.marriage_timeline] ?? profile.marriage_timeline.replace(/_/g, ' ')
                  : null
              }
            />
          </div>

          <div className="p-3 flex-shrink-0 border-t border-gold/15">
            <Link
              href={`/profile/${profile.id}`}
              className="block text-center py-2 rounded-mj-sm text-[13px] font-semibold bg-maroon-gradient text-cream hover:shadow-mj-sm transition-shadow"
            >
              View full profile →
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}

export default ProfileCard3D
