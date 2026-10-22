'use client'

import { useEffect, useRef, useState } from 'react'
import { COMPAT_SIGNALS, DEMO_PROFILES, type HeroStage } from './heroStages'

/**
 * Stage 2 — the two characters of the opening story and the compatibility read-out.
 *
 * Built from the site's own primitives (`.card`, rounded-mj, shadow tokens,
 * Marcellus for names, Mukta for meta) so it reads as a Mithila Jodi interface
 * component rather than a dating-app card. Each character has a portrait;
 * if it is missing or fails to load, the initial-on-paper circle stands in at
 * the same size, so the layout never shifts.
 */

function Avatar({ initial, photo }: { initial: string; photo: string }) {
  const [failed, setFailed] = useState(false)
  const img = useRef<HTMLImageElement>(null)
  // An image that 404s before hydration never fires onError — catch it here.
  useEffect(() => {
    const el = img.current
    if (el && el.complete && el.naturalWidth === 0) setFailed(true)
  }, [])
  const ring = 'h-[60px] w-[60px] sm:h-16 sm:w-16 shrink-0 rounded-full border-[1.5px] border-gold shadow-[0_3px_10px_-4px_rgba(58,20,12,0.45)]'
  if (failed) {
    return (
      <span className={`grid place-items-center bg-paper-2 ${ring}`} aria-hidden="true">
        <span className="font-serif text-maroon text-[20px] sm:text-[22px] leading-none">{initial}</span>
      </span>
    )
  }
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      ref={img}
      src={photo}
      alt=""
      width={128}
      height={128}
      decoding="async"
      onError={() => setFailed(true)}
      className={`object-cover object-[center_25%] bg-paper-2 ${ring}`}
    />
  )
}

function ProfileCard({
  side, name, age, place, photo,
}: { side: 'left' | 'right'; name: string; age: number; place: string; photo: string }) {
  return (
    <div className={`mj-hero-card mj-hero-card--${side} card px-3 py-2.5 sm:px-4 sm:py-3`}>
      <div className="flex items-center gap-2.5 sm:gap-3">
        <Avatar initial={name.charAt(0)} photo={photo} />
        <span className="flex flex-col min-w-0">
          <span className="font-serif text-maroon text-[13px] sm:text-[15px] leading-tight truncate">
            {name}
          </span>
          <span className="font-sans text-ink-soft text-[10.5px] sm:text-[12px] leading-tight">
            {age} • {place}
          </span>
        </span>
      </div>
    </div>
  )
}

export function ProfileMatchDemo({ stage, score }: { stage: HeroStage; score: number }) {
  const connected = stage === 'connected' || stage === 'final'
  const { left, right } = DEMO_PROFILES

  return (
    <div
      className="mj-hero-match absolute inset-0 z-20"
      data-connected={connected ? 'true' : 'false'}
      // One concise description instead of exposing every animated fragment.
      role="img"
      aria-label={
        `Illustration: ${left.name} of ${left.place} and ${right.name} of ${right.place} ` +
        'finding each other through Mithila Jodi, connected by a golden thread.'
      }
    >
      <ProfileCard side="left" {...left} />
      <ProfileCard side="right" {...right} />

      {/* Compatibility read-out, centred between the two cards. */}
      <div className="mj-hero-compat" aria-hidden="true">
        <span className="mj-hero-compat-badge">
          {connected ? (
            <span className="mj-hero-connected font-serif text-[12px] sm:text-[15px] tracking-[0.18em] uppercase">
              Connected
            </span>
          ) : (
            <span className="font-serif text-[22px] sm:text-[30px] leading-none tabular-nums">
              {score}
              <span className="text-[13px] sm:text-[17px] align-top">%</span>
            </span>
          )}
        </span>

        <span className="mj-hero-compat-label eyebrow hidden sm:block">
          {connected ? 'Thread of Destiny' : 'Compatibility Match'}
        </span>
      </div>

      {/* Compatibility signals — desktop only; on mobile the badge carries the
          story and extra rows would crowd a 168–240px tall stage. */}
      <ul className="mj-hero-signals hidden lg:flex" aria-hidden="true">
        {COMPAT_SIGNALS.map((s, i) => (
          <li
            key={s}
            className="mj-hero-signal font-sans text-[11px] text-ink-soft"
            style={{ '--sd': `${i * 140}ms` } as React.CSSProperties}
          >
            <span className="mj-hero-tick text-green" aria-hidden="true">✓</span>
            {s}
          </li>
        ))}
      </ul>
    </div>
  )
}
