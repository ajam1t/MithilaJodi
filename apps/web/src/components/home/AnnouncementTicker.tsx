/**
 * Compact animated announcement strip, shown directly under the header.
 *
 * Replaces the oversized top promotional area. Deliberately short (~34px),
 * mobile-first, and in Mithila Jodi maroon/gold. The marquee is pure CSS
 * (transform only, GPU-friendly) and the global prefers-reduced-motion rule
 * freezes it — the message stays fully readable when animation is disabled.
 *
 * No dates, deadlines, offers or pricing.
 */

const ITEMS = [
  '🌸 Mithila Jodi is currently free for all members',
  'Create your profile',
  'Connect with Maithili families',
  'Marriage biodata in four languages',
]

function Row({ ariaHidden = false }: { ariaHidden?: boolean }) {
  return (
    <span
      className="flex shrink-0 items-center gap-8 pr-8"
      aria-hidden={ariaHidden || undefined}
    >
      {ITEMS.map((item) => (
        <span key={item} className="flex items-center gap-8 whitespace-nowrap">
          <span className="text-[11.5px] sm:text-[12.5px] tracking-[0.14em] uppercase text-gold-lt">
            {item}
          </span>
          <span className="text-gold/70 text-[9px]" aria-hidden="true">◆</span>
        </span>
      ))}
    </span>
  )
}

export function AnnouncementTicker() {
  return (
    <div className="relative overflow-hidden bg-maroon-deep border-b border-gold/30" role="region" aria-label="Announcements">
      {/* soft gold edges so text fades rather than clipping hard */}
      <span className="pointer-events-none absolute inset-y-0 left-0 w-8 z-10 bg-gradient-to-r from-maroon-deep to-transparent" aria-hidden="true" />
      <span className="pointer-events-none absolute inset-y-0 right-0 w-8 z-10 bg-gradient-to-l from-maroon-deep to-transparent" aria-hidden="true" />

      <div className="flex py-[7px] mj-ticker">
        {/* Two identical rows make the loop seamless; the second is decorative. */}
        <Row />
        <Row ariaHidden />
      </div>
    </div>
  )
}
