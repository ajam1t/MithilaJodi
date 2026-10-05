import Link from 'next/link'

/**
 * Announcement strip for the Digital Profile page — the same treatment and
 * height as InvitationAnnouncementStrip. Takes a list so a second item can
 * return later; with more than one, the row scrolls sideways on a phone
 * rather than wrapping into a tall block.
 */
// The strip opens the owner's chosen live example in a new tab (their
// decision, 2026-10-06); the page's other sample buttons use /digital-profile/sample.
const ITEMS: Array<{ href: string; icon: string; label: string; cta: string; newTab?: boolean }> = [
  { href: 'https://mithilajodi.com/p/kxzsSnfFidVRJmFedtxAdg', icon: '👤', label: 'Mithila Digital Profile', cta: 'View sample profile', newTab: true },
]

export function DualPromoStrip() {
  return (
    <nav aria-label="Featured" className="relative bg-maroon">
      <div className="flex snap-x snap-mandatory overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden [&>*:first-child]:ml-auto [&>*:last-child]:mr-auto">
        {ITEMS.map((it, i) => (
          <Link
            key={it.href}
            href={it.href}
            {...(it.newTab ? { target: '_blank', rel: 'noopener noreferrer' } : {})}
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
