'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import type { ReactNode } from 'react'
import Image from 'next/image'
import type { SearchCard } from '@/types/profile'

type ProfileCardGallery3DProps = {
  profile: SearchCard
  autoRotate?: boolean
}

const CARDS = ['Profile', 'Career', 'Lifestyle', 'Roots', 'Marriage'] as const
const ROTATE_MS = 4800

function offsetFor(index: number, active: number) {
  let offset = index - active
  if (offset > CARDS.length / 2) offset -= CARDS.length
  if (offset < -CARDS.length / 2) offset += CARDS.length
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

function Face({ index, profile }: { index: number; profile: SearchCard }) {
  if (index === 0) {
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
          <Field label="Location" value={profile.current_loc_name ?? profile.native_place_name} />
        </div>
      </div>
    )
  }

  if (index === 1) {
    return (
      <div>
        <p className="mb-3 text-[10px] uppercase tracking-widest text-terra">Career & education</p>
        <Field label="Education" value={profile.education_detail} />
        <Field label="Profession" value={profile.profession_detail} />
        <Field label="Employer" value={profile.employer} />
        <Field label="Job city" value={profile.job_loc_name} />
        <p className="mt-5 text-center text-xs leading-relaxed text-ink-soft">A little context helps families start the right conversation.</p>
      </div>
    )
  }

  if (index === 2) {
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

  if (index === 3) {
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

  return (
    <div>
      <p className="mb-3 text-[10px] uppercase tracking-widest text-terra">Marriage outlook</p>
      <Field label="Timeline" value={humanize(profile.marriage_timeline)} />
      <Field label="Profile status" value={humanize(profile.profile_status)} />
      <div className="mt-5 rounded-mj-sm border border-gold/25 bg-cream px-3 py-3 text-center">
        <p className="font-serif text-lg text-maroon">A thoughtful beginning</p>
        <p className="mt-1 text-[11px] leading-relaxed text-ink-soft">Review the full profile to see more details and connect respectfully.</p>
      </div>
    </div>
  )
}

export default function ProfileCardGallery3D({ profile, autoRotate = true }: ProfileCardGallery3DProps) {
  const [active, setActive] = useState(0)
  const [paused, setPaused] = useState(false)
  const [stopped, setStopped] = useState(false)
  const pointerStart = useRef<number | null>(null)
  const reducedMotion = useRef(typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches)

  const navigate = useCallback((direction: 1 | -1) => {
    setActive(current => (current + direction + CARDS.length) % CARDS.length)
  }, [])

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
            const style = styleForOffset(offsetFor(index, active))
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
                <CardFrame active={isActive}><Face index={index} profile={profile} /></CardFrame>
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
