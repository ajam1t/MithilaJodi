'use client'

import Link from 'next/link'
import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import { cn } from '@/lib/utils/cn'
import { PROMO_SETS, type PromoSet } from '@/lib/promoStrips'

/**
 * The one promotional strip, directly under MithilaHeader on Home, Digital
 * Profile, Join / Login, Search (/explore) and Astrology. The shell is fixed
 * (50px, maroon, gold text) so every page shows the same component; only the
 * message set from lib/promoStrips changes.
 *
 * Messages rotate every 4s with a 400ms slide-and-fade, and pause while the
 * strip is hovered, focused or touched. The whole strip is the link for the
 * message showing. A message too long for a phone keeps the strip's height:
 * its label slides sideways during its turn instead of wrapping.
 */

const DWELL_MS = 4000
// Pause after a touch ends before rotation resumes.
const TOUCH_RESUME_MS = 4000

const useIsoLayoutEffect = typeof window === 'undefined' ? useEffect : useLayoutEffect

export function ContextualPromoStrip({ set }: { set: PromoSet }) {
  const items = PROMO_SETS[set]
  const [pos, setPos] = useState<{ active: number; prev: number | null }>({ active: 0, prev: null })
  const [paused, setPaused] = useState(false)
  // How far each label overflows its box, in px (0 = fits).
  const [overflow, setOverflow] = useState<number[]>(() => items.map(() => 0))
  const rootRef = useRef<HTMLElement>(null)
  const boxes = useRef<(HTMLSpanElement | null)[]>([])
  const touchTimer = useRef<number | undefined>(undefined)

  useEffect(() => {
    if (paused || items.length < 2) return
    const id = window.setInterval(() => {
      if (document.hidden) return
      setPos(p => ({ prev: p.active, active: (p.active + 1) % items.length }))
    }, DWELL_MS)
    return () => window.clearInterval(id)
  }, [paused, items.length])

  useEffect(() => () => window.clearTimeout(touchTimer.current), [])

  // Measure every label against its box, and again whenever the strip resizes.
  useIsoLayoutEffect(() => {
    const root = rootRef.current
    if (!root) return
    const measure = () =>
      setOverflow(boxes.current.map(box => {
        const text = box?.firstElementChild as HTMLElement | null
        return box && text ? Math.max(0, Math.ceil(text.scrollWidth - box.clientWidth)) : 0
      }))
    measure()
    const ro = new ResizeObserver(measure)
    ro.observe(root)
    return () => ro.disconnect()
  }, [items])

  const pause = () => { window.clearTimeout(touchTimer.current); setPaused(true) }
  const resume = () => setPaused(false)

  return (
    <nav
      ref={rootRef}
      aria-label="Featured on Mithila Jodi"
      className="relative h-[50px] overflow-hidden bg-maroon"
      onMouseEnter={pause}
      onMouseLeave={resume}
      onFocus={pause}
      onBlur={e => { if (!e.currentTarget.contains(e.relatedTarget as Node | null)) resume() }}
      onTouchStart={pause}
      onTouchEnd={() => { touchTimer.current = window.setTimeout(resume, TOUCH_RESUME_MS) }}
    >
      {items.map((m, i) => {
        const isActive = i === pos.active
        const isLeaving = i === pos.prev
        const shift = overflow[i] ?? 0
        return (
          <Link
            key={m.href + m.label}
            href={m.href}
            {...(m.newTab ? { target: '_blank', rel: 'noopener noreferrer' } : {})}
            aria-label={`${m.label} — ${m.cta}${m.newTab ? ' (opens in a new tab)' : ''}`}
            aria-hidden={isActive ? undefined : true}
            inert={!isActive}
            className={cn(
              'group absolute inset-0 flex items-center justify-center px-3 transition-[opacity,transform] duration-[400ms] ease-mj-out sm:px-6',
              'hover:bg-maroon-deep focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-gold-lt',
              'motion-reduce:translate-x-0 motion-reduce:transition-opacity',
              isActive ? 'translate-x-0 opacity-100' : cn('pointer-events-none opacity-0', isLeaving ? '-translate-x-6' : 'translate-x-6')
            )}
          >
            <span className="flex min-w-0 max-w-full items-center gap-2 sm:gap-3">
              <span aria-hidden="true" className="shrink-0 text-[14px] leading-none sm:text-[15px]">{m.icon}</span>
              <span
                ref={el => { boxes.current[i] = el }}
                className={cn('min-w-0 overflow-hidden', shift > 0 && '[mask-image:linear-gradient(90deg,transparent,#000_6px,#000_calc(100%-14px),transparent)]')}
              >
                <span
                  className={cn(
                    'inline-block whitespace-nowrap text-[11px] font-semibold uppercase leading-none tracking-[0.12em] text-gold-lt sm:text-[12.5px]',
                    shift > 0 && (isActive || isLeaving) && 'mj-promo-slide'
                  )}
                  style={shift > 0 ? ({ '--mj-shift': `-${shift + 8}px` } as React.CSSProperties) : undefined}
                >
                  {m.label}
                </span>
              </span>
              <span aria-hidden="true" className="h-3.5 w-px shrink-0 bg-gold/40" />
              <span className="flex shrink-0 items-center gap-1 whitespace-nowrap text-[11.5px] font-medium leading-none text-paper-2 transition-colors group-hover:text-cream sm:text-[13px]">
                {m.cta}
                <span aria-hidden="true" className="text-gold-lt transition-transform group-hover:translate-x-0.5 motion-reduce:transform-none">→</span>
              </span>
            </span>
          </Link>
        )
      })}

      {/* The shimmering gold rule that frames the header group. */}
      <span className="mj-line mj-line--delayed pointer-events-none absolute bottom-0 left-0 right-0 h-[2px] bg-gradient-to-r from-maroon-deep via-gold to-maroon-deep" aria-hidden="true" />
    </nav>
  )
}
