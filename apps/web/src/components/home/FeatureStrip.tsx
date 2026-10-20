'use client'

import Link from 'next/link'
import { useState } from 'react'
import { PointerGlow } from '@/components/motion/PointerGlow'

type Feature = {
  id: string
  title: string
  tagline: string
  bullets: string[]
  /** Optional ways in, shown under the bullets. */
  links?: Array<{ href: string; label: string }>
  icon: React.ReactNode
}

const FEATURES: Feature[] = [
  {
    id: 'verified',
    title: 'Mobile Verified Profiles',
    tagline: 'Real People. Greater Trust.',
    bullets: [
      'Every account is mobile-number verified',
      'Photos reviewed by our team before they appear',
      'Report tools on every profile',
      'Suspicious profiles removed promptly',
    ],
    icon: (
      <svg viewBox="0 0 48 48" xmlns="http://www.w3.org/2000/svg" className="w-7 h-7 sm:w-8 sm:h-8" aria-hidden="true">
        <ellipse cx="24" cy="26" rx="14" ry="9" fill="#E4C572" stroke="#7A1220" strokeWidth="1.5" />
        <path d="M 38 26 L 46 20 L 46 32 Z" fill="#E4C572" stroke="#7A1220" strokeWidth="1.2" />
        {[0,1,2].map(i => (
          <path key={i} d={`M ${16 + i*4} 18 Q ${17+i*4} 26 ${16+i*4} 34`} fill="none" stroke="#7A1220" strokeWidth="1" />
        ))}
        <circle cx="18" cy="24" r="3" fill="#7A1220" />
        <circle cx="19" cy="23" r="1" fill="#E4C572" />
        {[-6,-3,0,3,6].map((dx,pi) => (
          <ellipse key={pi} cx={24+dx} cy={40} rx={2.5} ry={5} fill="#FF91A4" stroke="#D4536A" strokeWidth="0.6" />
        ))}
        <circle cx="24" cy="38" r="2.5" fill="#FFD700" />
      </svg>
    ),
  },
  {
    id: 'family',
    title: 'Family Involvement',
    tagline: 'Where Families Find Their Match.',
    bullets: [
      'Family-led introductions honoured',
      'Traditional values at the centre',
      'Parental participation welcome',
      'Decisions made together, with love',
    ],
    icon: (
      <svg viewBox="0 0 48 48" xmlns="http://www.w3.org/2000/svg" className="w-7 h-7 sm:w-8 sm:h-8" aria-hidden="true">
        {[-14,-8,-2,4,10,16].map((dx, i) => (
          <g key={i}>
            <line x1="24" y1="30" x2={24+dx} y2={8-Math.abs(dx)*0.3} stroke="#1A6B4A" strokeWidth="1.2" />
            <ellipse cx={24+dx} cy={7-Math.abs(dx)*0.3} rx="4" ry="6" fill="#1A6B4A" stroke="#0D4A30" strokeWidth="0.6" />
            <circle cx={24+dx} cy={8-Math.abs(dx)*0.3} r="2" fill="#4A90A4" />
            <circle cx={24+dx} cy={8-Math.abs(dx)*0.3} r="0.8" fill="#E4C572" />
          </g>
        ))}
        <ellipse cx="24" cy="34" rx="12" ry="8" fill="#1A6B4A" stroke="#0D4A30" strokeWidth="1.2" />
        <circle cx="24" cy="23" r="6" fill="#1A6B4A" stroke="#0D4A30" strokeWidth="1" />
        {[0,1,2,3,4].map(i => (
          <g key={i}><line x1={20+i} y1="17" x2={19+i} y2="12" stroke="#1A6B4A" strokeWidth="0.8" /><circle cx={19+i} cy="11" r="1.5" fill="#E4C572" /></g>
        ))}
        <circle cx="26" cy="22" r="2.2" fill="white" stroke="#0D4A30" strokeWidth="0.5" />
        <circle cx="27" cy="22" r="1.2" fill="#0D4A30" />
      </svg>
    ),
  },
  {
    id: 'roots',
    title: 'Mithila Roots',
    tagline: 'Rooted in Culture. Built for Community.',
    bullets: [
      'Mithila & Maithili traditions honoured',
      'Community-first matchmaking',
      'Cultural heritage preserved',
      'Connect with your roots',
    ],
    icon: (
      <svg viewBox="0 0 48 48" xmlns="http://www.w3.org/2000/svg" className="w-7 h-7 sm:w-8 sm:h-8" aria-hidden="true">
        <rect x="16" y="24" width="16" height="18" fill="#C4562F" stroke="#7A1220" strokeWidth="1.2" />
        <rect x="22" y="30" width="4" height="12" fill="#7A1220" />
        <rect x="12" y="24" width="24" height="5" fill="#7A1220" stroke="#B98A2E" strokeWidth="0.8" />
        <rect x="14" y="16" width="20" height="10" fill="#9B2233" stroke="#7A1220" strokeWidth="1" />
        <rect x="18" y="10" width="12" height="8" fill="#7A1220" />
        <rect x="20" y="6" width="8" height="6" fill="#9B2233" />
        <ellipse cx="24" cy="4" rx="5" ry="3.5" fill="#B98A2E" />
        <circle cx="24" cy="0" r="2" fill="#E4C572" />
        <line x1="12" y1="26" x2="36" y2="26" stroke="#E4C572" strokeWidth="0.8" />
      </svg>
    ),
  },
  {
    id: 'private',
    title: 'Safe & Private',
    tagline: 'Your Privacy, Fully Protected.',
    bullets: [
      'Controlled contact requests only',
      'Photos visible to accepted matches',
      'No spam or unsolicited messages',
      'Block & report tools always available',
    ],
    icon: (
      <svg viewBox="0 0 48 48" xmlns="http://www.w3.org/2000/svg" className="w-7 h-7 sm:w-8 sm:h-8" aria-hidden="true">
        <rect x="8" y="22" width="32" height="22" rx="4" fill="#FBF1DD" stroke="#7A1220" strokeWidth="1.5" />
        <path d="M 16 22 L 16 16 Q 16 8 24 8 Q 32 8 32 16 L 32 22" fill="none" stroke="#7A1220" strokeWidth="2" strokeLinecap="round" />
        <circle cx="24" cy="33" r="4" fill="#7A1220" />
        <rect x="22.5" y="33" width="3" height="5" rx="1" fill="#7A1220" />
      </svg>
    ),
  },
  {
    id: 'matches',
    title: 'Meaningful Matches',
    tagline: 'Compatible Lives. Shared Values.',
    bullets: [
      'Values-based compatibility',
      'Long-term relationship intent',
      'Cultural & community fit',
      'Thoughtful, curated introductions',
    ],
    icon: (
      <svg viewBox="0 0 48 48" xmlns="http://www.w3.org/2000/svg" className="w-7 h-7 sm:w-8 sm:h-8" aria-hidden="true">
        <path d="M24 40 C 10 30, 8 18, 16 14 C 20 12, 24 15, 24 19 C 24 15, 28 12, 32 14 C 40 18, 38 30, 24 40 Z" fill="#7A1220" stroke="#5A0E19" strokeWidth="1" />
        {[0,45,90,135,180,225,270,315].map((a, i) => {
          const rad = (a * Math.PI) / 180
          return <circle key={i} cx={24+18*Math.cos(rad)} cy={24+15*Math.sin(rad)} r="2.2" fill={i%2===0?'#E4C572':'#E8912A'} stroke="#B98A2E" strokeWidth="0.5" />
        })}
        <circle cx="24" cy="24" r="19" fill="none" stroke="#B98A2E" strokeWidth="0.8" strokeDasharray="3,3" />
      </svg>
    ),
  },
  {
    id: 'wedding',
    title: 'Wedding Tools',
    tagline: 'From the First Biodata to the Wedding Day.',
    bullets: [
      'Marriage biodata in Maithili, Hindi, English or Sanskrit',
      'Wedding invitation cards in Mithila designs',
      'Mithila Premium — a digital wedding webpage in one link',
      'Free, and no login needed',
    ],
    links: [
      { href: '/marriage-biodata', label: 'Marriage Biodata' },
      { href: '/marriage-invitation', label: 'Wedding Invitations' },
    ],
    icon: (
      <svg viewBox="0 0 48 48" xmlns="http://www.w3.org/2000/svg" className="w-7 h-7 sm:w-8 sm:h-8" aria-hidden="true">
        <rect x="6" y="14" width="36" height="26" rx="3" fill="#FBF1DD" stroke="#7A1220" strokeWidth="1.5" />
        <path d="M6 16 24 30 42 16" fill="none" stroke="#7A1220" strokeWidth="1.5" />
        <path d="M24 26c-3-2.4-5-4.4-5-6.6 0-1.6 1.2-2.8 2.7-2.8 1 0 1.8.5 2.3 1.3.5-.8 1.3-1.3 2.3-1.3 1.5 0 2.7 1.2 2.7 2.8 0 2.2-2 4.2-5 6.6Z" fill="#7A1220" />
        {[-6,-3,0,3,6].map((dx, pi) => (
          <ellipse key={pi} cx={24 + dx} cy={9} rx={2.2} ry={4} fill="#E4C572" stroke="#B98A2E" strokeWidth="0.5" />
        ))}
        <circle cx="24" cy="7" r="1.8" fill="#B98A2E" />
      </svg>
    ),
  },
]

/** Devanagari numerals, set in Mukta: Rozha One draws these digits in Latin shapes. */
const NUMERALS = ['१', '२', '३', '४', '५', '६']

/** A Madhubani border band — repeating lotus buds between fine gold rules. */
function KohbarBand({ id, flip = false }: { id: string; flip?: boolean }) {
  return (
    <svg className="block h-[22px] w-full" aria-hidden="true" focusable="false" style={flip ? { transform: 'scaleY(-1)' } : undefined}>
      <defs>
        <pattern id={id} width="44" height="22" patternUnits="userSpaceOnUse">
          <path d="M0 3.5H44M0 18.5H44" stroke="#C9A24B" strokeWidth="1" strokeOpacity="0.7" />
          <path d="M22 6c3.2 2.6 3.2 7.4 0 10-3.2-2.6-3.2-7.4 0-10Z" fill="#C9A24B" fillOpacity="0.85" />
          <path d="M14.5 11c2.6-1.4 5-1.2 6.4 0-1.4 1.6-3.8 1.6-6.4 0ZM29.5 11c-2.6-1.4-5-1.2-6.4 0 1.4 1.6 3.8 1.6 6.4 0Z" fill="#C9A24B" fillOpacity="0.55" />
          <circle cx="0" cy="11" r="1.6" fill="#C9A24B" fillOpacity="0.7" />
          <circle cx="44" cy="11" r="1.6" fill="#C9A24B" fillOpacity="0.7" />
        </pattern>
      </defs>
      <rect width="100%" height="22" fill={`url(#${id})`} />
    </svg>
  )
}

/** Aripan petal ring around each icon; it turns a little when its card is hovered. */
function PetalRing() {
  return (
    <svg viewBox="-40 -40 80 80" className="mj-why-ring absolute inset-0 h-full w-full" aria-hidden="true" focusable="false">
      <circle r="36.5" fill="none" stroke="#C9A24B" strokeOpacity="0.45" strokeWidth="0.8" strokeDasharray="1 3" />
      {Array.from({ length: 12 }, (_, k) => (
        <ellipse key={k} cx="0" cy="-33" rx="2.1" ry="4.4" fill="#C9A24B" fillOpacity={k % 2 ? 0.45 : 0.85} transform={`rotate(${k * 30})`} />
      ))}
    </svg>
  )
}

/**
 * "Why Mithila Jodi" — the six promises, as a Kohbar-maroon band.
 *
 * Art Deco framing (gold corner brackets, stepped rules) on a restrained
 * maroon gradient mesh, Devanagari numerals that rise in once when the grid is
 * revealed, aripan medallions around the icons, and — on hover-capable
 * pointers only — a gold spotlight following the cursor (PointerGlow).
 *
 * Every card's details are readable without interaction on tablets and up;
 * on phones each card opens with its own button, so the band stays compact.
 */
export function WhyMithilaJodi() {
  const [openId, setOpenId] = useState<string | null>(null)

  return (
    <section id="how" className="mj-kohbar relative text-cream" aria-labelledby="why-heading">
      <KohbarBand id="why-band-top" />
      <div className="wrap py-10 sm:py-14">
        <div data-mj-reveal className="mb-8 text-center sm:mb-11">
          <p className="eyebrow mb-2 !text-gold-lt">The Mithila Jodi Difference</p>
          <h2 id="why-heading" className="font-serif text-[28px] leading-tight text-cream sm:text-[40px]">Why Mithila Jodi</h2>
          <p className="mt-1.5 font-deva text-[16px] text-gold-lt sm:text-[19px]" lang="mai">मिथिला जोड़ी किएक</p>
          <div className="mx-auto mt-3.5 flex items-center justify-center gap-2" aria-hidden="true">
            <span className="h-px w-12 bg-gradient-to-r from-transparent to-gold" />
            <span className="h-2 w-2 rotate-45 border border-gold" />
            <span className="h-px w-12 bg-gradient-to-l from-transparent to-gold" />
          </div>
        </div>

        <ul data-mj-reveal className="mj-why-grid grid gap-3.5 sm:gap-5 md:grid-cols-2 lg:grid-cols-3">
          {FEATURES.map(({ id, icon, title, tagline, bullets, links }, i) => {
            const open = openId === id
            return (
              <li key={id} className="mj-why-card mj-glow-host group relative overflow-hidden rounded-[18px] border border-gold/30 bg-white/[0.04] p-5 sm:p-6">
                <PointerGlow />
                {/* Art Deco corner brackets */}
                <span className="mj-why-corner left-2.5 top-2.5 border-l border-t" aria-hidden="true" />
                <span className="mj-why-corner right-2.5 top-2.5 border-r border-t" aria-hidden="true" />
                <span className="mj-why-corner bottom-2.5 left-2.5 border-b border-l" aria-hidden="true" />
                <span className="mj-why-corner bottom-2.5 right-2.5 border-b border-r" aria-hidden="true" />
                <span className="mj-why-num pointer-events-none absolute right-5 top-1 text-[56px] font-light leading-none text-gold/25 sm:text-[66px]" style={{ animationDelay: `${0.1 + i * 0.08}s`, fontFamily: 'var(--font-mukta), Mukta, sans-serif' }} aria-hidden="true">
                  {NUMERALS[i]}
                </span>

                <div className="relative flex items-center gap-4">
                  <span className="relative grid h-[74px] w-[74px] shrink-0 place-items-center">
                    <PetalRing />
                    <span className="grid h-[50px] w-[50px] place-items-center rounded-full bg-cream shadow-[0_0_0_3px_rgba(201,162,75,0.35)]">{icon}</span>
                  </span>
                  <div className="min-w-0 flex-1">
                    <h3 className="font-serif text-[18px] leading-snug text-cream sm:text-[19px]">{title}</h3>
                    <p className="mt-0.5 font-serif text-[13.5px] italic leading-snug text-gold-lt">{tagline}</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setOpenId(open ? null : id)}
                    aria-expanded={open}
                    aria-controls={`why-${id}`}
                    aria-label={`${open ? 'Hide' : 'Show'} details: ${title}`}
                    className="grid h-9 w-9 shrink-0 place-items-center rounded-full border border-gold/40 text-gold-lt transition-colors hover:border-gold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold md:hidden"
                  >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" aria-hidden="true" className={`transition-transform ${open ? 'rotate-180' : ''}`}><polyline points="6 9 12 15 18 9" /></svg>
                  </button>
                </div>

                <div id={`why-${id}`} className={`relative mt-4 md:block ${open ? 'block' : 'hidden'}`}>
                  <div className="mb-3 h-px w-full bg-gradient-to-r from-gold/60 via-gold/25 to-transparent" aria-hidden="true" />
                  <ul className="space-y-1.5">
                    {bullets.map(b => (
                      <li key={b} className="flex items-start gap-2.5 text-[13.5px] leading-snug text-[#EFE2C8]">
                        <span className="mt-[6px] h-1.5 w-1.5 shrink-0 rotate-45 bg-gold" aria-hidden="true" />
                        {b}
                      </li>
                    ))}
                  </ul>
                  {links && (
                    <div className="mt-4 flex flex-wrap gap-2">
                      {links.map(l => (
                        <Link key={l.href} href={l.href} className="inline-flex items-center rounded-full border border-gold/60 px-3 py-1.5 text-[12.5px] font-medium text-gold-lt transition-colors hover:border-gold-lt hover:bg-gold/10">
                          {l.label} →
                        </Link>
                      ))}
                    </div>
                  )}
                </div>
              </li>
            )
          })}
        </ul>
      </div>
      <KohbarBand id="why-band-bottom" flip />
    </section>
  )
}

/** @deprecated use WhyMithilaJodi */
export { WhyMithilaJodi as FeatureStrip }
