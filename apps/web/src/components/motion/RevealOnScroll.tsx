'use client'
import { useEffect } from 'react'

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
 * Why a rect sweep and not IntersectionObserver
 * ---------------------------------------------
 * IntersectionObserver is the textbook answer and was the first two
 * implementations here. It was replaced because its one weakness happens to be
 * this feature's worst failure mode. An observer is only obliged to deliver
 * records "at some point" after an intersection changes, and if that delivery
 * never comes, an element that has been hidden in anticipation of being
 * revealed simply stays invisible. That is not theoretical: in the browser used
 * to verify this work, observer callbacks were not delivered at all, and the
 * entire blog index stayed blank. The same browser also never applied CSS
 * scroll-driven animations (`animation-timeline: view()`) despite reporting
 * support for them, which ruled out the JavaScript-free approach as well.
 *
 * Those are automation artefacts and a normal browser does neither. But a
 * reveal that hides content up front should not depend on a delivery guarantee
 * that does not exist, so this reads the truth for itself:
 *
 *   - `sweep()` reveals everything at or above the trigger line, and drops it
 *     from the pending list, so the work shrinks to nothing as the reader
 *     scrolls;
 *   - scroll and resize schedule a sweep, coalesced to roughly one per frame by
 *     a short timer. Deliberately a timer and not requestAnimationFrame, which
 *     is throttled whenever the page is not being painted — the same class of
 *     dependency this is trying to avoid;
 *   - a slow interval sweeps anyway, which covers the cases scrolling does not:
 *     lazy-loaded cover images on the blog and festival indexes pushing cards
 *     down after first paint, fonts reflowing, a details element opening;
 *   - everything detaches itself the moment the last element is revealed, so a
 *     reader who reaches the bottom of the page leaves no timers running.
 *
 * At most ~20 rect reads per frame of active scrolling, falling to zero, with
 * no interleaved writes — reads during scroll happen when layout is already
 * clean, so nothing is forced to re-layout.
 *
 * Degradation
 * -----------
 * The CSS that hides an un-revealed element is scoped to `html.mj-reveal-ready`,
 * a class only ever added by this component. The server-rendered HTML therefore
 * contains no hidden content: a crawler, and a reader whose JavaScript failed,
 * both get the finished page rather than blank sections. Readers who prefer
 * reduced motion never get the class either.
 *
 * The first sweep runs before the class is added, so anything already on screen
 * is marked revealed without animating. That ordering is what stops
 * above-the-fold content being hidden for a frame and faded back in — a visible
 * flash on the most important content on the page, and one that would land
 * squarely on Largest Contentful Paint.
 */

const SELECTOR = '[data-mj-reveal], [data-mj-stagger] > *'
const READY_CLASS = 'mj-reveal-ready'
const IN_CLASS = 'mj-in'

/** Reveal once the element's top is this far down the viewport. */
const TRIGGER_FRACTION = 0.88

/** Coalescing window for scroll bursts — about one frame at 60Hz. */
const COALESCE_MS = 16

/** Backstop cadence, for movement that is not caused by scrolling. */
const BACKSTOP_MS = 300

export function RevealOnScroll() {
  useEffect(() => {
    const root = document.documentElement

    if (
      typeof window.matchMedia === 'function' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches
    ) {
      return
    }

    let pending = Array.from(document.querySelectorAll<HTMLElement>(SELECTOR))
    if (pending.length === 0) return

    let timer: ReturnType<typeof setTimeout> | null = null
    let backstop: ReturnType<typeof setInterval> | null = null
    let listening = false

    const sweep = () => {
      const line = window.innerHeight * TRIGGER_FRACTION
      const remaining: HTMLElement[] = []
      for (const el of pending) {
        if (el.getBoundingClientRect().top < line) {
          // Adding the class both drops the hidden state and starts the
          // keyframes. On the first sweep nothing is hidden yet, so this just
          // leaves the element exactly as rendered.
          el.classList.add(IN_CLASS)
        } else {
          remaining.push(el)
        }
      }
      pending = remaining
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
      sweep()
      if (pending.length === 0) teardown()
    }

    function schedule() {
      if (timer === null) timer = setTimeout(run, COALESCE_MS)
    }

    // First sweep, then the class — see the note above on ordering.
    sweep()
    root.classList.add(READY_CLASS)

    if (pending.length > 0) {
      listening = true
      window.addEventListener('scroll', schedule, { passive: true })
      window.addEventListener('resize', schedule, { passive: true })
      backstop = setInterval(run, BACKSTOP_MS)
    }

    return () => {
      teardown()
      // Dropped on unmount so that during a navigation — old template gone,
      // new one not yet mounted — the incoming page's elements cannot be
      // caught by the hidden-state rule with nothing running to reveal them.
      root.classList.remove(READY_CLASS)
    }
  }, [])

  return null
}
