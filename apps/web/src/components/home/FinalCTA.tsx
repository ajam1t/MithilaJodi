import Link from 'next/link'

/**
 * Closing call to action.
 *
 * Was a full-width maroon banner with py-20 sitting directly above the
 * maroon-deep footer — two dark warm tones with almost no edge between them, so
 * it read as one enormous block and the CTA lost its own presence. It is now a
 * compact cream card on a paper-3 ground: light against the dark footer below,
 * and a step warmer than the cream FAQ above, so it separates on both sides.
 *
 * Decoration is deliberately restrained — two corner motifs at very low opacity
 * and the shared shimmering gold rules — because this section's job is
 * readability and conversion, not ornament.
 */

/** Small Mithila line-art corner flourish. Purely decorative. */
function CornerMotif({ position }: { position: 'tl' | 'br' }) {
  return (
    <svg
      className={`pointer-events-none absolute w-[72px] h-[72px] opacity-[0.09] ${
        position === 'tl' ? 'left-2 top-2' : 'right-2 bottom-2 rotate-180'
      }`}
      viewBox="0 0 100 100"
      fill="none"
      stroke="#7A1220"
      strokeWidth="1.2"
      aria-hidden="true"
      focusable="false"
    >
      {/* Quarter lotus fan */}
      {[0, 22, 44, 66, 88].map((a) => (
        <ellipse key={a} cx="14" cy="14" rx="5" ry="26" transform={`rotate(${a - 45} 14 14)`} />
      ))}
      <circle cx="14" cy="14" r="3" />
      {/* Fine trailing vine */}
      <path d="M 30 46 C 52 52, 60 66, 58 88" stroke="#B98A2E" />
      <circle cx="58" cy="88" r="2.4" stroke="#B98A2E" />
    </svg>
  )
}

export function FinalCTA() {
  return (
    <section
      className="relative bg-paper-3 py-6 sm:py-7"
      aria-label="Create your profile — call to action"
    >
      {/* Shimmering gold rules, matching the hairlines that frame the branding. */}
      <span
        className="mj-line absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-paper-3 via-gold to-paper-3"
        aria-hidden="true"
      />

      <div className="wrap">
        <div className="card relative overflow-hidden mx-auto max-w-xl text-center px-5 py-5 sm:px-9 sm:py-6">
          <CornerMotif position="tl" />
          <CornerMotif position="br" />

          <div className="relative">
            <p className="eyebrow mb-2">Your Next Chapter</p>

            <h2 className="font-serif text-maroon leading-snug text-[20px] sm:text-[23px] lg:text-[26px]">
              Begin Your Family&apos;s Next Chapter
            </h2>

            <div className="ornament-line mj-line w-14 mx-auto my-2.5" />

            {/* Controlled measure — ~46 characters per line reads comfortably. */}
            <p className="font-sans text-ink-soft text-[14px] sm:text-[15px] leading-relaxed mx-auto max-w-[46ch]">
              Create a verified biodata and connect with Maithili families across India — with
              privacy and cultural care at every step.
            </p>

            <div className="mt-4">
              <Link href="/register" className="btn-primary text-[15px] px-7 py-3">
                Create Your Biodata
              </Link>
            </div>

            <p className="mt-3.5 text-[11px] text-ink-soft opacity-80">
              By registering you agree to our{' '}
              <Link href="/legal/terms" className="underline underline-offset-2 hover:text-maroon transition-colors">
                Terms of Service
              </Link>{' '}
              and{' '}
              <Link href="/legal/privacy" className="underline underline-offset-2 hover:text-maroon transition-colors">
                Privacy Policy
              </Link>
              .
            </p>
          </div>
        </div>
      </div>

      <span
        className="mj-line mj-line--delayed absolute bottom-0 left-0 right-0 h-[2px] bg-gradient-to-r from-paper-3 via-gold to-paper-3"
        aria-hidden="true"
      />
    </section>
  )
}
