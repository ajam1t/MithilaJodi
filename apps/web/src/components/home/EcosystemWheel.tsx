'use client'

import { useRef, useState, type KeyboardEvent } from 'react'
import Link from 'next/link'
import { EcosystemIcon, type EcosystemId } from './EcosystemIcons'

/**
 * "Explore the Mithila Jodi ecosystem" — a six-segment wheel with a panel that
 * follows the selection.
 *
 * It is an ordinary tab widget underneath: the six segment labels are real
 * <button role="tab">s with roving tabindex and arrow-key movement, and the
 * panel is the tabpanel. The SVG ring is decoration that mirrors the state
 * (its paths are clickable for pointer users, but carry no semantics). Every
 * fact in the panel describes a feature that exists, and every link goes to it.
 *
 * Motion only answers input: the gold marker turns to the chosen segment and
 * the panel fades in. Nothing loops, and prefers-reduced-motion removes both
 * (globals.css collapses transition and animation durations).
 */

type Item = {
  id: EcosystemId
  label: string
  /** Shown in the wheel's centre for the active segment. */
  deva: string
  title: string
  body: string
  points: string[]
  cta: { href: string; label: string }
  more?: { href: string; label: string }
}

const ITEMS: Item[] = [
  {
    id: 'matrimony', label: 'Matrimony', deva: 'जोड़ी', title: 'Matrimony, the Mithila way',
    body: 'Profiles built around what Maithil families ask first — and matches that check it for you.',
    points: ['Gotra, maternal gotra, mool and gram on every profile', 'Every match score flags a same-gotra clash', 'Free for every member'],
    cta: { href: '/explore', label: 'Explore profiles' }, more: { href: '/register', label: 'Create a free profile' },
  },
  {
    id: 'biodata', label: 'Biodata', deva: 'बायोडाटा', title: 'Marriage biodata in minutes',
    body: 'A printable biodata with gotra, mool and gram at the top, in the language your family reads.',
    points: ['Maithili, Hindi, English or Sanskrit', 'Four Madhubani designs, PDF and WhatsApp image', 'Members’ details fill in from their profile'],
    cta: { href: '/marriage-biodata', label: 'Make a biodata' },
  },
  {
    id: 'invitations', label: 'Invitations', deva: 'निमंत्रण', title: 'Wedding invitations',
    body: 'Invitation cards to download, or a complete wedding webpage your guests open from one link.',
    points: ['Basic cards in Mithila designs', 'Premium: Mithila Premium, MJ Scratch & Reveal, Blush Lace', 'Guests reply on WhatsApp'],
    cta: { href: '/marriage-invitation', label: 'Create an invitation' },
  },
  {
    id: 'astrology', label: 'Astrology', deva: 'ज्योतिष', title: 'Astrology for marriage',
    body: 'The checks families make before a rishta, calculated from birth details.',
    points: ['Kundli matching and Manglik check', 'Janam kundli, rashi and nakshatra', 'Vivah muhurat dates'],
    cta: { href: '/astrology', label: 'Open astrology tools' }, more: { href: '/astrology/kundli-match', label: 'Match kundlis' },
  },
  {
    id: 'festivals', label: 'Festivals', deva: 'पाबनि', title: 'Mithila festivals',
    body: 'The festivals of Mithila — what each one means, how it is kept, and its songs.',
    points: ['Chhath, Sama Chakeva, Madhushravani, Kojagara and more', 'Rituals, stories and dates', 'Festival songs to listen to'],
    cta: { href: '/festivals', label: 'Explore festivals' }, more: { href: '/festival-songs', label: 'Festival songs' },
  },
  {
    id: 'culture', label: 'Culture', deva: 'संस्कृति', title: 'Mithila roots and culture',
    body: 'Guides to the lineage and traditions behind every Maithil match.',
    points: ['All 20 gotras, with a gotra match checker', 'The mools of the Mithila Panji', 'The Journal: customs, rituals and heritage'],
    cta: { href: '/gotra', label: 'Gotra & mool guides' }, more: { href: '/blogs', label: 'Read the Journal' },
  },
]

// ── Geometry (viewBox 400 × 400), rounded so server and browser agree ──
const C = 200, R_OUT = 188, R_IN = 96, GAP = 1.6
const r2 = (n: number) => Math.round(n * 100) / 100
const polar = (r: number, deg: number) => {
  const a = ((deg - 90) * Math.PI) / 180
  return [r2(C + r * Math.cos(a)), r2(C + r * Math.sin(a))]
}
function sector(i: number): string {
  const a0 = i * 60 - 30 + GAP, a1 = i * 60 + 30 - GAP
  const [x0, y0] = polar(R_OUT, a0), [x1, y1] = polar(R_OUT, a1)
  const [x2, y2] = polar(R_IN, a1), [x3, y3] = polar(R_IN, a0)
  return `M${x0} ${y0}A${R_OUT} ${R_OUT} 0 0 1 ${x1} ${y1}L${x2} ${y2}A${R_IN} ${R_IN} 0 0 0 ${x3} ${y3}Z`
}
const SECTORS = ITEMS.map((_, i) => sector(i))
/** Label centres as percentages of the wheel, for the HTML buttons. */
const SPOTS = ITEMS.map((_, i) => {
  const [x, y] = polar((R_OUT + R_IN) / 2, i * 60)
  return { left: `${r2((x / 400) * 100)}%`, top: `${r2((y / 400) * 100)}%` }
})
const TICKS = Array.from({ length: 36 }, (_, i) => {
  const [x0, y0] = polar(R_IN - 10, i * 10), [x1, y1] = polar(R_IN - (i % 3 === 0 ? 18 : 14), i * 10)
  return `M${x0} ${y0}L${x1} ${y1}`
}).join('')
const MARKER = (() => {
  const [x0, y0] = polar(R_OUT + 7, -26), [x1, y1] = polar(R_OUT + 7, 26)
  return `M${x0} ${y0}A${R_OUT + 7} ${R_OUT + 7} 0 0 1 ${x1} ${y1}`
})()

export function EcosystemWheel() {
  const [active, setActive] = useState(0)
  // Turns accumulate so the marker always takes the short way round.
  const [turn, setTurn] = useState(0)
  const tabs = useRef<Array<HTMLButtonElement | null>>([])

  function select(i: number, focus = false) {
    const delta = ((i - active + 9) % 6) - 3
    setTurn(t => t + delta * 60)
    setActive(i)
    if (focus) tabs.current[i]?.focus()
  }

  function onKey(e: KeyboardEvent, i: number) {
    const next: Record<string, number> = {
      ArrowRight: (i + 1) % 6, ArrowDown: (i + 1) % 6, ArrowLeft: (i + 5) % 6, ArrowUp: (i + 5) % 6, Home: 0, End: 5,
    }
    if (e.key in next) { e.preventDefault(); select(next[e.key], true) }
  }

  const item = ITEMS[active]

  return (
    <section className="relative py-11 sm:py-16 overflow-hidden" aria-labelledby="eco-heading">
      <div className="mj-eco-bg absolute inset-0 -z-10" aria-hidden="true" />
      <div className="wrap">
        <div data-mj-reveal className="text-center mb-7 sm:mb-10">
          <p className="eyebrow mb-2">One platform · six ways in</p>
          <h2 id="eco-heading" className="section-heading text-[24px] sm:text-[32px]">Explore the Mithila Jodi ecosystem</h2>
          <div className="ornament-line w-16 mx-auto mt-3" />
        </div>

        <div data-mj-reveal className="mx-auto grid max-w-5xl items-center gap-7 md:grid-cols-[minmax(0,440px)_minmax(0,1fr)] md:gap-12">
          {/* ── The wheel ── */}
          <div className="relative mx-auto aspect-square w-full max-w-[340px] sm:max-w-[400px] md:max-w-[440px]">
            <svg viewBox="-12 -12 424 424" className="absolute inset-0 h-full w-full overflow-visible" aria-hidden="true" focusable="false">
              {/* Blueprint-fine guides: two orbits and a tick ring around the centre. */}
              <circle cx={C} cy={C} r={R_OUT + 7} fill="none" stroke="#B98A2E" strokeOpacity="0.25" strokeWidth="1" strokeDasharray="2 5" />
              <path d={TICKS} stroke="#B98A2E" strokeOpacity="0.45" strokeWidth="1" />
              {SECTORS.map((d, i) => (
                <path
                  key={i}
                  d={d}
                  className="mj-eco-seg"
                  data-on={i === active || undefined}
                  onClick={() => select(i)}
                />
              ))}
              <g className="mj-eco-marker" style={{ transform: `rotate(${turn}deg)` }}>
                <path d={MARKER} fill="none" stroke="#B98A2E" strokeWidth="3.5" strokeLinecap="round" />
              </g>
              <circle cx={C} cy={C} r={R_IN - 24} fill="#FFFAF0" stroke="#B98A2E" strokeOpacity="0.6" strokeWidth="1" />
              <circle cx={C} cy={C} r={R_IN - 30} fill="none" stroke="#7A1220" strokeOpacity="0.12" strokeWidth="1" />
            </svg>

            {/* Centre: the brand mark and the active part's name in Devanagari. */}
            <div className="pointer-events-none absolute left-1/2 top-1/2 flex w-[30%] -translate-x-1/2 -translate-y-1/2 flex-col items-center text-center">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/logo-mark.png" alt="" width={44} height={40} className="h-auto w-[34%] min-w-[28px] max-w-[46px]" />
              <span key={item.id} className="mj-eco-swap mt-1 font-deva text-[13px] leading-tight text-maroon sm:text-[16px]" lang="hi">{item.deva}</span>
            </div>

            <div role="tablist" aria-label="Parts of Mithila Jodi" aria-orientation="horizontal" className="absolute inset-0">
              {ITEMS.map((it, i) => (
                <button
                  key={it.id}
                  ref={el => { tabs.current[i] = el }}
                  type="button"
                  role="tab"
                  id={`eco-tab-${it.id}`}
                  aria-selected={i === active}
                  aria-controls="eco-panel"
                  tabIndex={i === active ? 0 : -1}
                  onClick={() => select(i)}
                  onKeyDown={e => onKey(e, i)}
                  className="mj-eco-tab absolute flex w-[22%] -translate-x-1/2 -translate-y-1/2 flex-col items-center gap-1 rounded-mj-sm py-1.5"
                  style={SPOTS[i]}
                  data-on={i === active || undefined}
                >
                  <EcosystemIcon id={it.id} className="h-[22px] w-[22px] sm:h-6 sm:w-6" />
                  <span className="text-[11px] font-semibold leading-none tracking-wide sm:text-[12.5px]">{it.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* ── The panel ── */}
          <div id="eco-panel" role="tabpanel" aria-labelledby={`eco-tab-${item.id}`} className="min-h-[300px]">
            <div key={item.id} className="mj-eco-panel card relative overflow-hidden p-6 sm:p-8">
              <span className="pointer-events-none absolute -right-6 -top-6 text-gold/15" aria-hidden="true">
                <EcosystemIcon id={item.id} className="h-36 w-36" />
              </span>
              <p className="eyebrow mb-2 tabular-nums">0{active + 1} / 06</p>
              <h3 className="font-serif text-maroon text-[23px] sm:text-[28px] leading-tight">{item.title}</h3>
              <p className="mt-2.5 text-[15px] leading-relaxed text-ink-soft">{item.body}</p>
              <ul className="mt-4 space-y-2">
                {item.points.map(p => (
                  <li key={p} className="flex items-start gap-2.5 text-[14.5px] leading-snug text-ink">
                    <span className="mt-[7px] h-1.5 w-1.5 shrink-0 rotate-45 bg-gold" aria-hidden="true" />
                    {p}
                  </li>
                ))}
              </ul>
              <div className="mt-6 flex flex-wrap items-center gap-x-5 gap-y-3">
                <Link href={item.cta.href} className="btn-primary px-5 py-2.5 text-[14.5px]">{item.cta.label} →</Link>
                {item.more && (
                  <Link href={item.more.href} className="text-[14px] font-medium text-maroon underline-offset-4 hover:underline">
                    {item.more.label}
                  </Link>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
