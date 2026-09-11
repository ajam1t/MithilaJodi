'use client'
import { useEffect, useRef } from 'react'

/**
 * A soft gold light that follows the cursor inside its container.
 *
 * Deliberately scoped to a single box rather than the page. A document-level
 * pointermove handler fires continuously for the whole visit; this one only
 * fires while the cursor is actually inside the one card it decorates, which
 * on most visits is never.
 *
 * Three things keep it cheap:
 *
 *  - Position is written straight to the element's inline custom properties.
 *    Nothing goes through React state, so a cursor sweep causes no renders —
 *    only a compositor-level background repaint on one small layer.
 *  - Handlers are coalesced to roughly one write per frame, so a mouse
 *    reporting at 1000Hz still costs one update per paint. A short timer rather
 *    than requestAnimationFrame, matching RevealOnScroll and ReadingProgress —
 *    rAF is throttled whenever the page is not being painted, and in the
 *    browser used to verify this work it did not run reliably at all.
 *  - It does not attach at all unless the device genuinely hovers with a fine
 *    pointer and the reader has not asked for reduced motion. On a phone this
 *    component mounts, finds no match, and adds no listeners.
 *
 * Must be rendered as a child of a `position: relative` (and normally
 * `overflow-hidden`) box — it fills its parent and reads the parent's
 * bounding box to convert page coordinates into local ones.
 */
export function PointerGlow() {
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const el = ref.current
    const host = el?.parentElement
    if (!el || !host) return

    if (
      typeof window.matchMedia !== 'function' ||
      !window.matchMedia('(hover: hover) and (pointer: fine)').matches ||
      window.matchMedia('(prefers-reduced-motion: reduce)').matches
    ) {
      return
    }

    let timer: ReturnType<typeof setTimeout> | null = null
    let pending: { x: number; y: number } | null = null

    const write = () => {
      timer = null
      if (!pending) return
      const box = host.getBoundingClientRect()
      el.style.setProperty('--mj-gx', `${pending.x - box.left}px`)
      el.style.setProperty('--mj-gy', `${pending.y - box.top}px`)
    }

    const onMove = (e: PointerEvent) => {
      pending = { x: e.clientX, y: e.clientY }
      if (timer === null) timer = setTimeout(write, 16)
    }

    host.addEventListener('pointermove', onMove)
    return () => {
      host.removeEventListener('pointermove', onMove)
      if (timer !== null) clearTimeout(timer)
    }
  }, [])

  return <div ref={ref} aria-hidden="true" className="mj-glow absolute inset-0 pointer-events-none" />
}
