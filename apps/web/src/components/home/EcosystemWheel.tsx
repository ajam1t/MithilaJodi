'use client'

import { useEffect, useRef, useState, type KeyboardEvent } from 'react'
import Link from 'next/link'
import { EcosystemIcon, type EcosystemId } from './EcosystemIcons'

/**
 * "Explore the Mithila Jodi ecosystem" — a ten-segment wheel, one segment for
 * each part of the site, with a compact card that follows the selection.
 *
 * It is an ordinary tab widget underneath: the segment labels are real
 * <button role="tab">s with roving tabindex and arrow-key movement, and the
 * card is the tabpanel. The SVG ring is decoration that mirrors the state
 * (its paths are clickable for pointer users, but carry no semantics). Every
 * line in the card describes a feature that exists, and every link goes to it.
 *
 * The card is two lines: a short phrase whose key word is spelled out on
 * split-flap tiles, and the link. Motion only answers input: the gold marker
 * turns to the chosen segment and the tiles flip to the new word. Nothing
 * loops, and prefers-reduced-motion removes both (the tiles simply show the
 * word; globals.css collapses transition durations).
 */

type Item = {
  id: EcosystemId
  label: string
  /** Shown in the wheel's centre for the active segment. */
  deva: string
  /** The card's first line: a lead-in, then the word on the tiles (≤ TILES characters). */
  lead: string
  flap: string
  cta: { href: string; label: string }
}

const ITEMS: Item[] = [
  { id: 'matrimony', label: 'Matrimony', deva: 'जोड़ी', lead: 'Profiles with', flap: 'GOTRA & MOOL', cta: { href: '/explore', label: 'Explore profiles' } },
  { id: 'profile', label: 'Digital Profile', deva: 'प्रोफ़ाइल', lead: 'Share it in', flap: 'ONE LINK', cta: { href: '/digital-profile', label: 'Make a Digital Profile' } },
  { id: 'biodata', label: 'Biodata', deva: 'बायोडाटा', lead: 'Biodata ready in', flap: 'MINUTES', cta: { href: '/marriage-biodata', label: 'Make a biodata' } },
  { id: 'invitations', label: 'Invitations', deva: 'निमंत्रण', lead: 'Cards and a', flap: 'WEDDING PAGE', cta: { href: '/marriage-invitation', label: 'Create an invitation' } },
  { id: 'astrology', label: 'Astrology', deva: 'ज्योतिष', lead: 'Before the rishta,', flap: 'KUNDLI MATCH', cta: { href: '/astrology', label: 'Open astrology tools' } },
  { id: 'names', label: 'Baby Names', deva: 'नामकरण', lead: 'Name letters by', flap: 'NAKSHATRA', cta: { href: '/astrology/baby-names', label: 'Find name letters' } },
  { id: 'culture', label: 'Gotra & Mool', deva: 'गोत्र · मूल', lead: 'Know your', flap: 'ROOTS', cta: { href: '/gotra', label: 'Gotra & mool guides' } },
  { id: 'festivals', label: 'Festivals', deva: 'पाबनि', lead: 'From Chhath to', flap: 'SAMA CHAKEVA', cta: { href: '/festivals', label: 'Explore festivals' } },
  { id: 'songs', label: 'Songs', deva: 'गीत', lead: 'Listen to', flap: 'MAITHILI GEET', cta: { href: '/festival-songs', label: 'Festival songs' } },
  { id: 'journal', label: 'Journal', deva: 'लेख', lead: 'Customs and', flap: 'HERITAGE', cta: { href: '/blogs', label: 'Read the Journal' } },
]
const N = ITEMS.length
const STEP = 360 / N
/** Tiles on the board: the longest word, so every word sits on the same board. */
const TILES = Math.max(...ITEMS.map(it => it.flap.length))

// ── Geometry (viewBox 400 × 400), rounded so server and browser agree ──
const C = 200, R_OUT = 190, R_IN = 86, GAP = 1.2
const r2 = (n: number) => Math.round(n * 100) / 100
const polar = (r: number, deg: number) => {
  const a = ((deg - 90) * Math.PI) / 180
  return [r2(C + r * Math.cos(a)), r2(C + r * Math.sin(a))]
}
function sector(i: number): string {
  const a0 = i * STEP - STEP / 2 + GAP, a1 = i * STEP + STEP / 2 - GAP
  const [x0, y0] = polar(R_OUT, a0), [x1, y1] = polar(R_OUT, a1)
  const [x2, y2] = polar(R_IN, a1), [x3, y3] = polar(R_IN, a0)
  return `M${x0} ${y0}A${R_OUT} ${R_OUT} 0 0 1 ${x1} ${y1}L${x2} ${y2}A${R_IN} ${R_IN} 0 0 0 ${x3} ${y3}Z`
}
const SECTORS = ITEMS.map((_, i) => sector(i))
/** Label centres as percentages of the wheel, for the HTML buttons. */
const SPOTS = ITEMS.map((_, i) => {
  const [x, y] = polar((R_OUT + R_IN) / 2, i * STEP)
  return { left: `${r2((x / 400) * 100)}%`, top: `${r2((y / 400) * 100)}%` }
})
const TICKS = Array.from({ length: 36 }, (_, i) => {
  const [x0, y0] = polar(R_IN - 10, i * 10), [x1, y1] = polar(R_IN - (i % 3 === 0 ? 18 : 14), i * 10)
  return `M${x0} ${y0}L${x1} ${y1}`
}).join('')
const MARKER = (() => {
  const [x0, y0] = polar(R_OUT + 7, -(STEP / 2 - 3)), [x1, y1] = polar(R_OUT + 7, STEP / 2 - 3)
  return `M${x0} ${y0}A${R_OUT + 7} ${R_OUT + 7} 0 0 1 ${x1} ${y1}`
})()

export function EcosystemWheel() {
  const [active, setActive] = useState(0)
  // Turns accumulate so the marker always takes the short way round.
  const [turn, setTurn] = useState(0)
  const tabs = useRef<Array<HTMLButtonElement | null>>([])

  function select(i: number, focus = false) {
    const delta = ((i - active + N + N / 2) % N) - N / 2
    setTurn(t => t + delta * STEP)
    setActive(i)
    if (focus) tabs.current[i]?.focus()
  }

  function onKey(e: KeyboardEvent, i: number) {
    const next: Record<string, number> = {
      ArrowRight: (i + 1) % N, ArrowDown: (i + 1) % N, ArrowLeft: (i + N - 1) % N, ArrowUp: (i + N - 1) % N, Home: 0, End: N - 1,
    }
    if (e.key in next) { e.preventDefault(); select(next[e.key], true) }
  }

  const item = ITEMS[active]

  return (
    <section className="relative py-11 sm:py-16 overflow-hidden" aria-labelledby="eco-heading">
      <div className="mj-eco-bg absolute inset-0 -z-10" aria-hidden="true" />
      <div className="wrap">
        <div data-mj-reveal className="text-center mb-7 sm:mb-10">
          <p className="eyebrow mb-2">One platform · ten ways in</p>
          <h2 id="eco-heading" className="section-heading text-[24px] sm:text-[32px]">Explore the Mithila Jodi ecosystem</h2>
          <div className="ornament-line w-16 mx-auto mt-3" />
        </div>

        <div data-mj-reveal className="mx-auto grid max-w-5xl items-center gap-7 md:grid-cols-[minmax(0,460px)_minmax(0,1fr)] md:gap-12">
          {/* ── The wheel ── */}
          <div className="relative mx-auto aspect-square w-full max-w-[360px] sm:max-w-[420px] md:max-w-[460px]">
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
            <div className="pointer-events-none absolute left-1/2 top-1/2 flex w-[27%] -translate-x-1/2 -translate-y-1/2 flex-col items-center text-center">
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
                  className="mj-eco-tab absolute flex w-[19%] -translate-x-1/2 -translate-y-1/2 flex-col items-center gap-1 rounded-mj-sm py-1"
                  style={SPOTS[i]}
                  data-on={i === active || undefined}
                >
                  <EcosystemIcon id={it.id} className="h-[19px] w-[19px] sm:h-[22px] sm:w-[22px]" />
                  <span className="text-[10px] font-semibold leading-[1.15] tracking-wide sm:text-[11.5px]">{it.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* ── The card: one line about the part, one link to it ── */}
          <div id="eco-panel" role="tabpanel" aria-labelledby={`eco-tab-${item.id}`}>
            <div className="card relative overflow-hidden px-4 py-4 sm:px-6 sm:py-5">
              <p className="flex flex-wrap items-center gap-x-3 gap-y-2">
                <span className="font-serif text-[16px] leading-tight text-ink-soft sm:text-[19px]">{item.lead}</span>
                <SplitFlap text={item.flap} />
              </p>
              <Link href={item.cta.href} className="mt-3 inline-flex items-center gap-1.5 text-[14.5px] font-semibold text-maroon underline-offset-4 hover:underline">
                {item.cta.label} <span aria-hidden="true">→</span>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

/**
 * A split-flap board spelling `text`. On first render it simply shows the word
 * (so the server and the browser agree); when the word changes, each tile
 * that differs shuffles through a few letters and settles, left to right.
 */
const FLAP_CHARS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ&'
function SplitFlap({ text }: { text: string }) {
  const target = text.padEnd(TILES, ' ')
  const [shown, setShown] = useState(target)
  const last = useRef(target)

  useEffect(() => {
    const from = last.current
    last.current = target
    if (from === target) return
    if (window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) { setShown(target); return }
    let step = 0
    const id = window.setInterval(() => {
      step++
      setShown(Array.from(target, (ch, i) => {
        if (ch === from[i] || step >= 3 + i * 1.4) return ch
        return FLAP_CHARS[(step * 7 + i * 5) % FLAP_CHARS.length]
      }).join(''))
      if (step >= 3 + TILES * 1.4) window.clearInterval(id)
    }, 50)
    return () => window.clearInterval(id)
  }, [target])

  return (
    <span className="mj-flaps">
      <span className="sr-only">{text}</span>
      {Array.from(shown, (ch, i) => (
        <span key={i} className="mj-flap" aria-hidden="true">
          <span key={ch}>{ch === ' ' ? '\u00a0' : ch}</span>
        </span>
      ))}
    </span>
  )
}
