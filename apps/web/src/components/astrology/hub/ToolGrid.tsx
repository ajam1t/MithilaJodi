import Image from 'next/image'
import Link from 'next/link'
import { ToolArt } from './ToolArt'
import { PointerGlow } from '@/components/motion/PointerGlow'
import { TOOLS, type ToolSlug } from '../tools'

type Card = {
  slug: ToolSlug
  href: string
  title: string
  subtitle: string
  description: string
  /** Phones show this instead of the description. */
  short: string
  cta: string
  /** Bento size: the feature tile, a wide tile, or a regular one. */
  size?: 'feature' | 'wide'
}

/**
 * Bento order: Kundli Match is the feature tile (two columns, two rows) with
 * Nakshatra, Manglik, Janam Kundli and Rashi beside it; then Vivah Muhurat
 * (wide), Baby Names and Compatibility.
 */
const CARDS: Card[] = [
  {
    slug: 'kundli-match', size: 'feature', href: '/astrology/kundli-match', title: 'Kundli Match', subtitle: 'Match two Kundlis',
    description: 'A complete match of two birth charts — all eight kootas, Manglik for both, and both charts.',
    short: '36 Guna for two charts.', cta: 'Start Matching',
  },
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
    slug: 'vivah-muhurat', size: 'wide', href: '/astrology/vivah-muhurat', title: 'Vivah Muhurat', subtitle: 'Auspicious dates for marriage',
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

/** Each tool's Devanagari name, from the shared registry the tool pages use. */
const HI = Object.fromEntries(TOOLS.map(t => [t.slug, t.hi])) as Record<ToolSlug, string>

const NUM = ['०१', '०२', '०३', '०४', '०५', '०६', '०७', '०८']

/** Orbit rings drawn over each tool's window; they turn a little on hover. */
function Orbits() {
  return (
    <svg viewBox="0 0 200 140" className="mj-obs-orbits pointer-events-none absolute inset-0 h-full w-full" preserveAspectRatio="xMidYMid slice" aria-hidden="true" focusable="false">
      <g fill="none" stroke="#C9A24B" strokeOpacity="0.45">
        <ellipse cx="100" cy="70" rx="92" ry="30" strokeWidth="0.6" strokeDasharray="1.5 3" transform="rotate(-14 100 70)" />
        <ellipse cx="100" cy="70" rx="70" ry="58" strokeWidth="0.5" transform="rotate(22 100 70)" />
      </g>
      <circle cx="186" cy="48" r="2.4" fill="#E4C572" />
      <circle cx="48" cy="18" r="1.6" fill="#E4C572" fillOpacity="0.8" />
    </svg>
  )
}

/**
 * The eight tools as a night observatory: an indigo sky with fine blueprint
 * orbits, bento tiles (Kundli Match as the feature, Vivah Muhurat wide), each
 * tool's illustration in a cream window under orbit rings, its Devanagari name
 * and a Devanagari index. A gold spotlight follows the pointer on desktop
 * (PointerGlow); the rings turn on hover. Nothing loops. Links, order and copy
 * are the hub's own.
 */
export function ToolGrid() {
  return (
    <ul className="mj-obs-grid grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-4 lg:gap-5" role="list">
      {CARDS.map((c, i) => {
        const feature = c.size === 'feature'
        const span = feature ? 'col-span-2 md:row-span-2' : c.size === 'wide' ? 'col-span-2' : ''
        return (
          <li key={c.slug} className={`astro-tool-in flex ${span}`} style={{ animationDelay: `${80 + i * 60}ms` }}>
            <Link
              href={c.href}
              className={`mj-obs-card mj-glow-host group relative flex w-full overflow-hidden rounded-[20px] ${feature ? 'flex-col' : c.size === 'wide' ? 'flex-col sm:flex-row' : 'flex-col'}`}
              aria-label={`${c.title} — ${c.subtitle}. ${c.cta}`}
            >
              <PointerGlow />
              <div className={`mj-obs-window relative overflow-hidden ${feature ? 'm-3 aspect-[16/10] rounded-[14px] md:m-4 md:mb-2 md:min-h-[300px] md:flex-1 md:aspect-auto' : c.size === 'wide' ? 'm-3 aspect-[10/7] rounded-[14px] sm:w-[46%] sm:shrink-0 sm:aspect-auto' : 'm-3 aspect-[10/7] rounded-[14px]'}`}>
                {feature ? <MatchArt /> : <ToolArt tool={c.slug as Exclude<ToolSlug, 'kundli-match'>} className="relative h-full w-full" />}
                {!feature && <Orbits />}
              </div>
              <div className={`relative flex flex-col px-4 pb-4 pt-1 ${feature ? 'flex-1 md:flex-none md:px-6 md:pb-6' : c.size === 'wide' ? 'flex-1 sm:justify-center sm:py-4 sm:pl-1' : 'flex-1'}`}>
                <div className="flex items-baseline justify-between gap-2">
                  <h3 className={`font-serif leading-tight text-cream ${feature ? 'text-[22px] md:text-[30px]' : 'text-[17px] lg:text-[21px]'}`}>{c.title}</h3>
                  <span className="shrink-0 text-[12px] tracking-[0.12em] text-gold/70" style={{ fontFamily: 'var(--font-mukta), Mukta, sans-serif' }} aria-hidden="true">{NUM[i]}</span>
                </div>
                <p className="mt-0.5 font-deva text-[13px] leading-tight text-gold-lt/90 lg:text-[14.5px]" lang="hi">{HI[c.slug]}</p>
                <p className="mt-2 font-serif text-[12.5px] italic leading-snug text-[#E9D9BE] lg:text-[14px]">{c.subtitle}</p>
                <p className={`mt-1.5 text-[12px] leading-snug text-[#BFB6CF] ${feature || c.size === 'wide' ? 'hidden sm:block sm:text-[13.5px]' : 'hidden lg:block lg:text-[13px]'}`}>{c.description}</p>
                <p className={`mt-1 text-[12px] leading-snug text-[#BFB6CF] ${feature || c.size === 'wide' ? 'sm:hidden' : 'lg:hidden'}`}>{c.short}</p>
                <span className="mj-obs-cta mt-auto pt-3">
                  <span className={feature || c.size === 'wide' ? '' : 'hidden lg:inline'}>{c.cta}</span>
                  <span className={feature || c.size === 'wide' ? 'hidden' : 'lg:hidden'}>Open</span>
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
