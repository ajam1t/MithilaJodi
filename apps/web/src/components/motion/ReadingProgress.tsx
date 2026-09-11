'use client'
import { useEffect, useRef, useState } from 'react'

/**
 * How far through the article you are.
 *
 * Functional rather than decorative: the guides run 700-1000 words, and on a
 * phone that is a long scroll with no sense of how much is left.
 *
 * This originally had two implementations and picked between them with
 * `CSS.supports('animation-timeline', 'scroll()')`, preferring a pure-CSS bar
 * driven by a scroll timeline. That has been removed. The Chromium this was
 * verified in answers that check `true` and still never applies the animation,
 * which means the CSS branch would have rendered a bar that sat permanently at
 * zero — a capability check that lies is worse than no capability check, and
 * the failure is silent. One implementation that is known to run everywhere is
 * worth more here than a fast path that cannot be trusted.
 *
 * The cost is kept to roughly nothing by the two things a naive version gets
 * wrong: updates are coalesced to about one per frame rather than one per
 * scroll event (which would force a React render per event and make the page
 * feel slower than it did without a progress bar), and the transform is written
 * straight to the element instead of going through state, so scrolling causes
 * no re-render at all.
 *
 * The coalescing uses a short timer rather than requestAnimationFrame, matching
 * RevealOnScroll and for the same reason: rAF does not run when the page is not
 * being painted, and in the browser used to verify this it did not run reliably
 * at all, which left the bar parked at zero for an entire article. A timer
 * cannot be starved that way, and at this cadence the difference is invisible —
 * one composited transform write, no layout.
 *
 * Hidden from assistive technology: it conveys nothing a screen reader user
 * cannot get from the document itself.
 */
export function ReadingProgress() {
  const [enabled, setEnabled] = useState(false)
  const barRef = useRef<HTMLDivElement>(null)
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    if (
      typeof window.matchMedia === 'function' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches
    ) {
      return
    }
    setEnabled(true)
  }, [])

  useEffect(() => {
    if (!enabled) return

    const measure = () => {
      timer.current = null
      const bar = barRef.current
      if (!bar) return
      const doc = document.documentElement
      const scrollable = doc.scrollHeight - doc.clientHeight
      const pct = scrollable > 0 ? Math.min(1, Math.max(0, doc.scrollTop / scrollable)) : 0
      bar.style.transform = `scaleX(${pct})`
    }

    const onScroll = () => {
      // Coalesce bursts of scroll events into roughly one write per frame.
      if (timer.current === null) timer.current = setTimeout(measure, 16)
    }

    measure()
    window.addEventListener('scroll', onScroll, { passive: true })
    window.addEventListener('resize', onScroll, { passive: true })
    return () => {
      window.removeEventListener('scroll', onScroll)
      window.removeEventListener('resize', onScroll)
      if (timer.current !== null) clearTimeout(timer.current)
    }
  }, [enabled])

  if (!enabled) return null

  return (
    <div
      aria-hidden="true"
      // z-[60], not z-50: MithilaHeader is `sticky top-0 z-50` and occupies the
      // same strip, so at an equal z-index the header would paint over the bar
      // and it would vanish the moment the header pinned itself to the top.
      className="fixed left-0 right-0 top-0 z-[60] h-[3px] bg-transparent pointer-events-none"
    >
      <div
        ref={barRef}
        className="h-full origin-left bg-gradient-to-r from-maroon via-gold to-maroon"
        style={{ transform: 'scaleX(0)' }}
      />
    </div>
  )
}
