'use client'
import { useRef } from 'react'
import { ProfileCard3D } from '@/components/ProfileCard3D'
import type { SearchCard } from '@/types/profile'

/**
 * Horizontal, scroll-snap carousel of featured profile cards.
 * Uses native scroll (touch swipe on mobile) + prev/next controls.
 * No animation loop — GPU-friendly and reduced-motion safe.
 */
export function FeaturedCarousel({ profiles }: { profiles: SearchCard[] }) {
  const trackRef = useRef<HTMLDivElement>(null)

  const scrollByCard = (dir: 1 | -1) => {
    const el = trackRef.current
    if (!el) return
    const card = el.querySelector<HTMLElement>('[data-card]')
    const amount = card ? card.offsetWidth + 20 : el.clientWidth * 0.8
    el.scrollBy({ left: dir * amount, behavior: 'smooth' })
  }

  return (
    <div className="relative">
      <div
        ref={trackRef}
        className="flex gap-5 overflow-x-auto snap-x snap-mandatory pb-4 -mx-4 px-4 no-scrollbar"
        style={{ scrollPaddingLeft: '1rem' }}
      >
        {profiles.map((p) => (
          <div key={p.id} data-card className="snap-start shrink-0 w-[280px] sm:w-[300px]">
            <ProfileCard3D profile={p} hideActions />
          </div>
        ))}
      </div>

      {profiles.length > 1 && (
        <div className="flex justify-center gap-3 mt-3">
          <button
            type="button"
            onClick={() => scrollByCard(-1)}
            aria-label="Previous profiles"
            className="w-10 h-10 rounded-full border border-gold/40 text-maroon bg-cream hover:bg-gold/10 hover:border-gold transition-colors flex items-center justify-center focus:outline-none focus:ring-2 focus:ring-gold/40"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" aria-hidden="true">
              <polyline points="15 18 9 12 15 6" />
            </svg>
          </button>
          <button
            type="button"
            onClick={() => scrollByCard(1)}
            aria-label="Next profiles"
            className="w-10 h-10 rounded-full border border-gold/40 text-maroon bg-cream hover:bg-gold/10 hover:border-gold transition-colors flex items-center justify-center focus:outline-none focus:ring-2 focus:ring-gold/40"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" aria-hidden="true">
              <polyline points="9 18 15 12 9 6" />
            </svg>
          </button>
        </div>
      )}
    </div>
  )
}
