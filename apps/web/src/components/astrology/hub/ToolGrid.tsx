import Image from 'next/image'
import Link from 'next/link'
import { ToolArt } from './ToolArt'
import type { ToolSlug } from '../tools'

type Card = {
  slug: ToolSlug
  href: string
  title: string
  subtitle: string
  description: string
  /** Phones show this instead of the description. */
  short: string
  cta: string
}

/** Hub order: row one Nakshatra … Rashi, row two Vivah Muhurat … Kundli Match. */
const CARDS: Card[] = [
  {
    slug: 'nakshatra', href: '/astrology/nakshatra', title: 'Nakshatra', subtitle: 'Find your Janma Nakshatra',
    description: 'Determine the birth star from your date, time and place and understand its significance in Mithila tradition.',
    short: 'Your birth star and pada.', cta: 'Find Your Nakshatra',
  },
  {
    slug: 'manglik', href: '/astrology/manglik', title: 'Manglik Check', subtitle: 'Understand Manglik dosha',
    description: 'See which house Mars occupies and understand how Manglik status is assessed.',
    short: 'Mars from Lagna and Moon.', cta: 'Check Manglik Dosha',
  },
  {
    slug: 'janam-kundli', href: '/astrology/janam-kundli', title: 'Janam Kundli', subtitle: 'Your birth chart in the Vedic tradition',
    description: 'Generate your complete birth chart with Lagna, Navamsa and planetary details.',
    short: 'Your complete birth chart.', cta: 'Generate Kundli',
  },
  {
    slug: 'rashi', href: '/astrology/rashi', title: 'Rashi', subtitle: 'Find your Moon sign',
    description: 'Determine your Janma Rashi from your date, time and place of birth.',
    short: 'Your Janma Rashi.', cta: 'Find Your Rashi',
  },
  {
    slug: 'vivah-muhurat', href: '/astrology/vivah-muhurat', title: 'Vivah Muhurat', subtitle: 'Auspicious dates for marriage',
    description: 'Find suitable marriage dates for your city, worked out with traditional muhurat rules.',
    short: 'Shubh wedding dates.', cta: 'Explore Muhurat',
  },
  {
    slug: 'baby-names', href: '/astrology/baby-names', title: 'Baby Names', subtitle: 'Name syllables from Janma Nakshatra',
    description: 'Find traditional name-starting syllables based on Nakshatra and Pada.',
    short: 'Letters from the nakshatra.', cta: 'Find Baby Names',
  },
  {
    slug: 'compatibility', href: '/astrology/compatibility', title: 'Compatibility', subtitle: 'Beyond the 36 Guna',
    description: 'Guna Milan and Manglik, then the Lagna, the 7th house, Navamsa and how the two charts touch.',
    short: 'Lagna, 7th house, Navamsa.', cta: 'Check Compatibility',
  },
  {
    slug: 'kundli-match', href: '/astrology/kundli-match', title: 'Kundli Match', subtitle: 'Match two Kundlis',
    description: 'A complete match of two birth charts — all eight kootas, Manglik for both, and both charts.',
    short: '36 Guna for two charts.', cta: 'Start Matching',
  },
]

function Arrow() {
  return (
    <svg width="15" height="15" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M3 8h10M8 3l5 5-5 5" />
    </svg>
  )
}

/** Kundli Match art: the couple from the site's wedding illustration under a zodiac arc and stars. */
function MatchArt() {
  return (
    <div className="astro-match-art relative mx-auto h-full w-full overflow-hidden rounded-[14px]">
      <Image src="/hero-couple.jpg" alt="" fill sizes="(max-width: 640px) 45vw, 300px" className="object-cover object-[46%_22%] scale-[1.25] origin-[46%_20%]" />
      <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(139,18,53,0.18),transparent_40%,rgba(255,248,236,0.0)_70%,rgba(255,248,236,0.55))]" />
      <svg viewBox="0 0 200 120" className="absolute inset-0 h-full w-full" preserveAspectRatio="xMidYMid slice" aria-hidden="true">
        <g fill="none" stroke="#FFE7A6" strokeOpacity="0.75">
          <path d="M18 120A82 82 0 0 1 182 120" strokeWidth="1" />
          <path d="M34 120A66 66 0 0 1 166 120" strokeWidth="0.6" strokeDasharray="1.5 3" />
        </g>
        <g className="astro-constellation" stroke="#FFE7A6" strokeOpacity="0.7" strokeWidth="0.6" fill="#FFF1C2">
          <path d="M22 26 36 18 50 24M150 16l16 8 12-6" fill="none" />
          <circle cx="22" cy="26" r="1.4" /><circle cx="36" cy="18" r="1.8" /><circle cx="50" cy="24" r="1.2" />
          <circle cx="150" cy="16" r="1.3" /><circle cx="166" cy="24" r="1.8" /><circle cx="178" cy="18" r="1.2" />
        </g>
        <path d="M100 30c-3-4-10-3-10 3 0 5 7 9 10 12 3-3 10-7 10-12 0-6-7-7-10-3Z" fill="#E8325A" fillOpacity="0.85" stroke="#FFE7A6" strokeWidth="0.8" />
      </svg>
    </div>
  )
}

export function ToolGrid() {
  return (
    <ul className="astro-grid grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-4 lg:gap-5" role="list">
      {CARDS.map((c, i) => {
        const featured = c.slug === 'kundli-match'
        return (
          <li key={c.slug} className="astro-tool-in flex" style={{ animationDelay: `${80 + i * 60}ms` }}>
            <Link href={c.href} className={`astro-tool group w-full ${featured ? 'astro-tool--featured' : ''}`} aria-label={`${c.title} — ${c.subtitle}. ${c.cta}`}>
              <div className="astro-tool-art">
                {featured ? <MatchArt /> : <ToolArt tool={c.slug as Exclude<ToolSlug, 'kundli-match'>} className="h-full w-full" />}
              </div>
              <div className="flex flex-1 flex-col px-3 pb-3 pt-2 lg:px-5 lg:pb-5">
                <h3 className="font-serif text-maroon text-[17px] leading-tight lg:text-[23px]">{c.title}</h3>
                <span className="astro-tool-rule" aria-hidden="true" />
                <p className="font-serif italic text-[12px] leading-snug text-[#8B1235] min-h-[2.75em] lg:min-h-0 lg:text-[15px]">{c.subtitle}</p>
                <p className="mt-1 mb-2.5 min-h-[2.75em] text-[12px] leading-snug text-ink-soft lg:hidden">{c.short}</p>
                <p className="mt-1.5 mb-4 hidden text-[14px] leading-relaxed text-ink-soft lg:block">{c.description}</p>
                <span className="astro-tool-cta">
                  <span className="hidden lg:inline">{c.cta}</span>
                  <span className="lg:hidden">Open</span>
                  <Arrow />
                </span>
              </div>
            </Link>
          </li>
        )
      })}
    </ul>
  )
}
