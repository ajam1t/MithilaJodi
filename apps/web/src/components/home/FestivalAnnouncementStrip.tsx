import Link from 'next/link'

/**
 * Thin, fully-clickable announcement strip that sits directly under the brand
 * header and leads into the festivals section.
 *
 * The whole strip is one <Link>, not a row with a link inside it, so tapping
 * anywhere on it navigates — which is what a strip like this looks like it
 * should do. Kept deliberately short (~34px) so it reads as an announcement
 * rather than a section, and styled in brand maroon with gold/cream text.
 *
 * This replaced the decorative Mithila border that used to occupy this slot,
 * so the space is now doing navigational work instead of being purely ornamental.
 */
export function FestivalAnnouncementStrip() {
  return (
    <Link
      href="/festivals"
      className="group block bg-maroon border-b border-gold/30 hover:bg-maroon-deep transition-colors
                 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold-lt focus-visible:ring-inset"
      aria-label="Mithila Festivals — explore rituals, stories and songs"
    >
      <div className="wrap py-[7px] flex items-center justify-center gap-2 sm:gap-3 text-center">
        <span aria-hidden="true" className="text-[12px] sm:text-[13px] shrink-0">🌸</span>

        <span className="text-[10.5px] sm:text-[12px] tracking-[0.16em] uppercase font-semibold text-gold-lt whitespace-nowrap">
          Mithila Festivals
        </span>

        {/* Decorative divider; only shown alongside the full wording. */}
        <span aria-hidden="true" className="hidden sm:inline text-gold/50 text-[9px] shrink-0">|</span>

        {/* Full wording on wider screens; a shorter form on phones so the strip
            stays one line and never wraps into a two-row block. */}
        <span className="hidden sm:inline text-[12px] text-paper-2 group-hover:text-paper transition-colors">
          Explore rituals, stories &amp; songs of our rich heritage
        </span>
        <span className="sm:hidden text-[10.5px] text-paper-2">
          Rituals, stories &amp; songs
        </span>

        <span
          aria-hidden="true"
          className="text-gold-lt text-[12px] shrink-0 transition-transform group-hover:translate-x-0.5 motion-reduce:transform-none"
        >
          →
        </span>
      </div>
    </Link>
  )
}
