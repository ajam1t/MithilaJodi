'use client'
import { useCallback, useEffect, useRef, useState } from 'react'

/**
 * A 3D photo deck for a shared profile.
 *
 * Replaces a flat grid that put the extra photos in a row of thumbnails. A
 * family opening a shared link looks at the photographs first, and a thumbnail
 * strip makes them work for it. This shows one photograph large with the others
 * stacked behind, which is also how the profile card gallery already behaves —
 * so the shared page feels like the same product.
 *
 * Rendered only when there is more than one photograph; a single photo already
 * appears in the header and a one-item carousel would be a control that does
 * nothing.
 */
export function SharedPhotoCarousel({ photos, name }: { photos: string[]; name: string }) {
  const [active, setActive] = useState(0)
  const [stopped, setStopped] = useState(false)
  const pointerStart = useRef<number | null>(null)
  const reducedMotion = useRef(
    typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches,
  )

  const step = useCallback((direction: number) => {
    setActive(current => (current + direction + photos.length) % photos.length)
  }, [photos.length])

  // Auto-advance, but stop for good once the visitor takes control — continuing
  // to rotate under someone who is looking at a specific photograph is hostile.
  useEffect(() => {
    if (stopped || reducedMotion.current || photos.length < 2) return
    const timer = window.setInterval(() => step(1), 4200)
    return () => window.clearInterval(timer)
  }, [stopped, step, photos.length])

  if (photos.length < 2) return null

  const take = (direction: number) => { setStopped(true); step(direction) }

  return (
    <section aria-label={`Photographs of ${name}`} className="select-none">
      <div
        className="relative h-[300px] sm:h-[340px]"
        style={{ perspective: '1100px' }}
        onPointerDown={e => { pointerStart.current = e.clientX }}
        onPointerUp={e => {
          const start = pointerStart.current
          pointerStart.current = null
          if (start == null) return
          const dx = e.clientX - start
          if (Math.abs(dx) > 40) take(dx < 0 ? 1 : -1)
        }}
      >
        {photos.map((src, index) => {
          // Signed offset, wrapped, so the deck rotates the short way round.
          let offset = index - active
          if (offset > photos.length / 2) offset -= photos.length
          if (offset < -photos.length / 2) offset += photos.length

          const isActive = offset === 0
          const depth = Math.min(Math.abs(offset), 3)

          return (
            <div
              key={src}
              aria-hidden={!isActive}
              className="absolute left-1/2 top-0 h-full w-[62%] sm:w-[54%] -translate-x-1/2 transition-all duration-500 ease-out"
              style={{
                transform: `translateX(calc(-50% + ${offset * 38}%)) translateZ(${-depth * 90}px) rotateY(${offset * -22}deg) scale(${isActive ? 1 : 0.9})`,
                opacity: depth >= 3 ? 0 : 1 - depth * 0.22,
                zIndex: 10 - depth,
                pointerEvents: isActive ? 'auto' : 'none',
              }}
            >
              <div className="h-full w-full overflow-hidden rounded-mj border-2 border-gold/50 bg-paper-2 shadow-mj">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={src}
                  alt={isActive ? `${name}, photograph ${index + 1} of ${photos.length}` : ''}
                  className="h-full w-full object-cover object-[center_35%]"
                  draggable={false}
                />
              </div>
            </div>
          )
        })}
      </div>

      <div className="mt-3 flex items-center justify-center gap-3">
        <button type="button" onClick={() => take(-1)} aria-label="Previous photograph"
          className="grid h-8 w-8 place-items-center rounded-full border border-gold/50 text-maroon transition-colors hover:bg-maroon hover:text-gold-lt">←</button>
        <div className="flex gap-1.5" role="tablist" aria-label="Choose a photograph">
          {photos.map((src, i) => (
            <button key={src} type="button" role="tab" aria-selected={i === active}
              aria-label={`Photograph ${i + 1}`}
              onClick={() => { setStopped(true); setActive(i) }}
              className={`h-1.5 rounded-full transition-all ${i === active ? 'w-5 bg-maroon' : 'w-1.5 bg-ink/25 hover:bg-maroon/50'}`} />
          ))}
        </div>
        <button type="button" onClick={() => take(1)} aria-label="Next photograph"
          className="grid h-8 w-8 place-items-center rounded-full border border-gold/50 text-maroon transition-colors hover:bg-maroon hover:text-gold-lt">→</button>
      </div>
      <p className="mt-1.5 text-center text-[11px] text-ink-soft">
        {active + 1} / {photos.length} · swipe or use the arrows
      </p>
    </section>
  )
}
