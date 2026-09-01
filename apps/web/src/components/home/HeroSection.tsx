import Link from 'next/link'
import { HeroCinematic } from './hero/HeroCinematic'

/**
 * Homepage hero.
 *
 * The visual area is the cinematic sequence (see hero/HeroCinematic); everything
 * below it — eyebrow, h1, tagline and CTAs — stays a server component. That
 * split is deliberate:
 *
 *   - the <h1> and the Devanagari tagline are in the initial HTML, so the
 *     headline is never dependent on client JS for indexing;
 *   - the CTAs are outside the animated subtree and therefore clickable from
 *     first paint. The cinematic can never gate access to the site.
 *
 * The previous full-bleed /hero-couple.jpg is no longer used here. It is still
 * the Open Graph / Twitter card image in the page metadata.
 */
export function HeroSection() {
  return (
    <section className="relative overflow-hidden bg-paper" aria-label="Hero — Mithila matrimonial platform">
      {/* ── Cinematic stage (replaces the former static artwork) ── */}
      <HeroCinematic />

      {/* ── Hero copy + CTAs — always present, always interactive ── */}
      <div className="wrap relative z-10 py-4 md:py-9">
        <div className="hero-text-enter flex flex-col gap-2.5 md:gap-5 text-center items-center max-w-2xl mx-auto">
          {/* Eyebrow */}
          <div className="flex items-center gap-2.5">
            <div className="h-px w-8 bg-gold" />
            <span className="eyebrow">Matrimony • Family • Mithila</span>
            <div className="h-px w-8 bg-gold" />
          </div>

          {/* Headline — "Find Your Life Partner" is the dominant line */}
          <h1 className="font-serif text-maroon">
            <span className="block text-[26px] sm:text-[38px] md:text-[52px] leading-[1.1]">
              Find Your Life Partner,
            </span>
            <span className="block text-[16px] sm:text-[21px] md:text-[26px] text-terra mt-0.5 leading-snug">
              Keep Your Mithila Roots.
            </span>
          </h1>

          {/* Tagline — the emotional line, Hindi and English visually connected */}
          <div className="space-y-0.5">
            <p className="font-deva text-[15px] sm:text-lg md:text-xl text-maroon opacity-90" lang="hi">
              जहाँ परम्परा मिले, प्रेम से
            </p>
            <p className="font-serif text-[14px] text-ink-soft italic">
              Meaningful connections, rooted in Mithila.
            </p>
          </div>

          {/* CTAs */}
          <div className="flex flex-col sm:flex-row gap-2.5 pt-0.5 w-full sm:w-auto">
            <Link href="/register" className="btn-primary text-[15px] px-6 py-3 justify-center">
              Find Your Match →
            </Link>
            <Link href="#biodata" className="btn-ghost text-[15px] px-6 py-3 justify-center !border-maroon !border-opacity-40">
              Explore Marriage Biodata
            </Link>
          </div>
        </div>
      </div>
    </section>
  )
}
