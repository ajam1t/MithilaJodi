import Link from 'next/link'
import { HeroCinematic } from './hero/HeroCinematic'
import { EcosystemIcon, type EcosystemId } from './EcosystemIcons'
import { HeroMatchLink } from './HeroMatchLink'

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
const ECOSYSTEM: Array<[EcosystemId, string, string]> = [
  ['matrimony', 'Matrimony', '/explore'],
  ['biodata', 'Biodata', '/marriage-biodata'],
  ['invitations', 'Wedding Invitation', '/marriage-invitation'],
  ['astrology', 'Astrology', '/astrology'],
  ['festivals', 'Mithila Culture', '/festivals'],
]

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
              जहाँ परंपरा मिले, प्रेम से
            </p>
            <p className="font-serif text-[14px] text-ink-soft italic">
              Meaningful connections, rooted in Mithila.
            </p>
          </div>

          {/* One plain sentence saying what this actually is.
              Everything above it is a headline, a tagline and a mood — none of
              which tells a first-time visitor arriving from a search result what
              the site does, and the only plain definition on the page sat in the
              FAQ near the bottom. It also matters for how the brand is
              understood off-site: searching "Mithila Jodi" returned an AI
              summary describing devotional Madhubani paintings of divine
              couples, because no prominent, unambiguous sentence tied the name
              to this platform. */}
          <p className="text-[14px] sm:text-[15px] leading-relaxed text-ink-soft max-w-xl">
            <strong className="font-semibold text-ink">Mithila Jodi</strong> is a matrimonial platform for
            Maithil families — meaningful matchmaking, marriage biodata, wedding invitations, astrology and
            Mithila culture, together in one place.
          </p>

          {/* The same ecosystem as small links — one or two short rows, no taller
              than the second button they replaced. */}
          <ul className="flex flex-wrap justify-center gap-1.5 sm:gap-2" aria-label="What Mithila Jodi offers">
            {ECOSYSTEM.map(([icon, label, href]) => (
              <li key={label}>
                <Link href={href} className="inline-flex items-center gap-1 rounded-full border border-line bg-cream px-2.5 py-1 text-[12px] font-medium text-maroon transition-colors hover:border-gold/60 hover:bg-white sm:text-[13px]">
                  <EcosystemIcon id={icon} className="h-3.5 w-3.5 text-gold sm:h-4 sm:w-4" />{label}
                </Link>
              </li>
            ))}
          </ul>

          {/* CTA */}
          <div className="flex pt-0.5 w-full sm:w-auto">
            <HeroMatchLink className="btn-primary text-[15px] px-6 py-3 justify-center w-full sm:w-auto">
              Find Your Match →
            </HeroMatchLink>
          </div>
        </div>
      </div>
    </section>
  )
}
