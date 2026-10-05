import Link from 'next/link'
import { SAMPLE_PROFILE_PATH } from '@/lib/digitalProfileDemo'

/**
 * Two announcements in one thin maroon strip — the same treatment and height
 * as InvitationAnnouncementStrip. Side by side on wider screens; on a phone
 * the row scrolls sideways rather than wrapping into a tall block.
 */
const ITEMS = [
  { href: '/marriage-invitation', icon: '💍', label: 'Mithila Wedding Invitation', cta: 'Create yours' },
  { href: SAMPLE_PROFILE_PATH, icon: '👤', label: 'Mithila Digital Profile', cta: 'View sample profile' },
]

export function DualPromoStrip() {
  return (
    <nav aria-label="Featured" className="relative bg-maroon">
      <div className="flex snap-x snap-mandatory overflow-x-auto [scrollbar-width:none] sm:justify-center [&::-webkit-scrollbar]:hidden">
        {ITEMS.map((it, i) => (
          <Link
            key={it.href}
            href={it.href}
            className={`group flex shrink-0 snap-start items-center gap-2 whitespace-nowrap px-4 py-[7px] transition-colors hover:bg-maroon-deep focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-gold-lt sm:px-6 ${i > 0 ? 'border-l border-gold/30' : ''}`}
          >
            <span aria-hidden="true" className="text-[12px] sm:text-[13px]">{it.icon}</span>
            <span className="text-[10.5px] font-semibold uppercase tracking-[0.16em] text-gold-lt sm:text-[12px]">{it.label}</span>
            <span className="text-[10.5px] text-paper-2 group-hover:text-paper sm:text-[12px]">{it.cta}</span>
            <span aria-hidden="true" className="text-[12px] text-gold-lt transition-transform group-hover:translate-x-0.5 motion-reduce:transform-none">→</span>
          </Link>
        ))}
      </div>
      <span className="mj-line mj-line--delayed absolute bottom-0 left-0 right-0 h-[2px] bg-gradient-to-r from-maroon-deep via-gold to-maroon-deep" aria-hidden="true" />
    </nav>
  )
}
