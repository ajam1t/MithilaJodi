'use client'
import { useEffect } from 'react'
import { usePathname } from 'next/navigation'

/**
 * Drives every scroll reveal on the site.
 *
 * Mounted once per page by app/template.tsx, so the sections themselves stay
 * server components — they only carry a `data-mj-reveal` or `data-mj-stagger`
 * attribute, which costs nothing and needs no client boundary. That is the
 * point of a single shared driver rather than a `useInView` hook per card: the
 * alternative turns a dozen static sections into client components and ships
 * their markup twice.
 *
 * Two rules here exist because breaking either one blanked real pages.
 *
 * 1. Nothing is hidden unless this component is actively tracking it.
 *
 *    The hidden state lives on `data-mj-armed`, set per element here and
 *    removed on teardown. The first version instead put one class on <html>
 *    that turned the hidden rule on document-wide, which meant CSS could hide
 *    an element the script knew nothing about. On a client-side navigation the
 *    class survived while the effect did not re-run, so every blog category
 *    page rendered its cards at opacity 0 with nothing left that could reveal
 *    them — and scrolling could not recover it. Arming per element makes that
 *    unreachable: an element this code has not personally armed is visible, so
 *    the worst case is a section that does not animate.
 *
 * 2. It re-runs on navigation, and never trusts a stale list.
 *
 *    The effect is keyed to the pathname, and each sweep re-queries the DOM
 *    rather than walking elements captured at mount. A list captured once is
 *    wrong the moment the route changes or content streams in late.
 *
 * A rect sweep rather than IntersectionObserver, and a timer rather than
 * requestAnimationFrame: an observer is only obliged to deliver records "at
 * some point", and rAF does not run when the page is not being painted. Both
 * were tried; in the browser used to verify this, observer callbacks were never
 * delivered at all and the blog index stayed blank. CSS scroll-driven
 * animations (`animation-timeline: view()`) were tried first and never applied
 * despite the browser reporting support. Reading positions directly is the one
 * approach that cannot be starved.
 *
 * The cost is small and self-limiting: at most ~20 rect reads per frame of
 * active scrolling, shrinking as elements reveal, and every listener and timer
 * detaches once the last element is done. Reads happen during scroll, when
 * layout is already clean, with no interleaved writes.
 *
 * Readers who prefer reduced motion get no arming at all, so the page is
 * exactly as rendered.
 */

const SELECTOR = '[data-mj-reveal], [data-mj-stagger] > *'
const ARMED_ATTR = 'data-mj-armed'
const IN_CLASS = 'mj-in'

/** Reveal once the element's top is this far down the viewport. */
const TRIGGER_FRACTION = 0.88

/** Coalescing window for scroll bursts — about one frame at 60Hz. */
const COALESCE_MS = 16

/** Backstop cadence, for movement that is not caused by scrolling. */
const BACKSTOP_MS = 300

export function RevealOnScroll() {
  const pathname = usePathname()

  useEffect(() => {
    if (
      typeof window.matchMedia === 'function' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches
    ) {
      return
    }

    let timer: ReturnType<typeof setTimeout> | null = null
    let backstop: ReturnType<typeof setInterval> | null = null
    let listening = false

    /**
     * Reveal what has reached the trigger line, arm what has not yet.
     * Returns how many are still waiting.
     */
    const sweep = (): number => {
      const line = window.innerHeight * TRIGGER_FRACTION
      const elements = document.querySelectorAll<HTMLElement>(SELECTOR)
      let waiting = 0

      for (const el of elements) {
        if (el.classList.contains(IN_CLASS)) continue

        if (el.getBoundingClientRect().top < line) {
          // Already in view. If it was armed it animates in; if it was never
          // armed — the common case on the first sweep — it was visible all
          // along and stays exactly where it is.
          el.classList.add(IN_CLASS)
        } else {
          el.setAttribute(ARMED_ATTR, '')
          waiting++
        }
      }
      return waiting
    }

    const teardown = () => {
      if (timer !== null) {
        clearTimeout(timer)
        timer = null
      }
      if (backstop !== null) {
        clearInterval(backstop)
        backstop = null
      }
      if (listening) {
        listening = false
        window.removeEventListener('scroll', schedule)
        window.removeEventListener('resize', schedule)
      }
    }

    const run = () => {
      timer = null
      if (sweep() === 0) teardown()
    }

    function schedule() {
      if (timer === null) timer = setTimeout(run, COALESCE_MS)
    }

    if (sweep() > 0) {
      listening = true
      window.addEventListener('scroll', schedule, { passive: true })
      window.addEventListener('resize', schedule, { passive: true })
      backstop = setInterval(run, BACKSTOP_MS)
    }

    return () => {
      teardown()
      // Disarm anything still waiting. Without this, an element left armed by a
      // route change would stay at opacity 0 with no sweep running — exactly
      // the blank-page failure this component is built to prevent.
      document.querySelectorAll<HTMLElement>(`[${ARMED_ATTR}]`).forEach((el) => {
        if (!el.classList.contains(IN_CLASS)) el.removeAttribute(ARMED_ATTR)
      })
    }
  }, [pathname])

  return null
}
