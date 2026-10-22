'use client'

import { useEffect, useState } from 'react'
import { LetterAssembly } from './LetterAssembly'
import { ProfileMatchDemo } from './ProfileMatchDemo'
import { ThreadOfDestiny } from './ThreadOfDestiny'
import {
  COMPAT_STEPS,
  HERO_SEEN_KEY,
  HERO_TIMELINE,
  type HeroStage,
} from './heroStages'

/**
 * Orchestrates the hero cinematic: ASSEMBLY → BRAND_REVEAL → PROFILE_MATCH →
 * THREAD_CONNECTION → FINAL_HERO.
 *
 * Deliberate properties:
 *
 * - This component owns ONLY the visual stage. The headline, tagline and CTAs
 *   live in HeroSection and are server-rendered outside it, so they are present
 *   in the initial HTML and clickable from the first paint — the animation can
 *   never gate access to the site.
 * - Stage transitions come from a single pass over HERO_TIMELINE. Every timer is
 *   collected and cleared together, so a fast navigation cannot leave a stray
 *   setState pointing at an unmounted tree.
 * - Renders `data-stage="assembly"` on the server. The very first client effect
 *   can jump straight to 'final' (reduced motion, or already seen this session)
 *   before anything meaningful has moved.
 */
export function HeroCinematic() {
  const [stage, setStage] = useState<HeroStage>('assembly')
  const [score, setScore] = useState(0)

  useEffect(() => {
    const reduced = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false

    let seen = false
    try {
      seen = sessionStorage.getItem(HERO_SEEN_KEY) === '1'
    } catch {
      // Private mode / storage disabled — treat as first visit and just play it.
    }

    // Skip straight to the stable hero: nothing to animate, nothing to wait for.
    if (reduced || seen) {
      setStage('final')
      setScore(92)
      return
    }

    const timers: ReturnType<typeof setTimeout>[] = []

    for (const { stage: s, at } of HERO_TIMELINE) {
      timers.push(setTimeout(() => setStage(s), at))
    }

    // Compatibility counter: a handful of discrete steps rather than a
    // requestAnimationFrame loop — the read-out is meant to tick, not tween.
    const matchAt = HERO_TIMELINE.find((t) => t.stage === 'match')!.at
    COMPAT_STEPS.forEach((value, i) => {
      timers.push(setTimeout(() => setScore(value), matchAt + i * 260))
    })

    timers.push(
      setTimeout(() => {
        try {
          sessionStorage.setItem(HERO_SEEN_KEY, '1')
        } catch {
          /* nothing to do — the sequence simply replays next navigation */
        }
      }, HERO_TIMELINE[HERO_TIMELINE.length - 1].at),
    )

    return () => timers.forEach(clearTimeout)
  }, [])

  return (
    <div
      // Mobile is a little taller than the old static artwork because the cards
      // stack vertically there and need room to breathe between the badge.
      className="mj-hero-stage relative w-full overflow-hidden
                 h-[224px] sm:h-[256px] md:h-[368px] lg:h-[420px]"
      data-stage={stage}
    >
      {/* Warm paper ground, reusing the existing brand gradients. */}
      <div className="mj-hero-ground absolute inset-0" aria-hidden="true" />

      <ThreadOfDestiny stage={stage} />
      <ProfileMatchDemo stage={stage} score={score} />
      <LetterAssembly stage={stage} />

      {/* Sparks around the convergence point. Eight is already plenty at this
          size; globals.css hides the last four below the sm breakpoint. */}
      <div className="mj-hero-sparks" aria-hidden="true">
        {Array.from({ length: 8 }, (_, i) => (
          <span key={i} className="mj-hero-spark-dot" style={{ '--i': i } as React.CSSProperties} />
        ))}
      </div>
    </div>
  )
}
