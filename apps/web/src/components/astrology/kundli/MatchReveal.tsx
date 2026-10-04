'use client'

import { useEffect, useMemo, useState } from 'react'
import type { ChartData, MatchResult } from '@/lib/astrology/types'
import { LazyCosmicBackdrop } from './LazyCosmicBackdrop'
import { ScoreRing } from './ScoreRing'
import { ZodiacWheel } from './ZodiacWheel'
import { ROLE_HI, ROLE_LABEL, nakshatraOf, points, rashiOf } from './format'

type Stage = 'intro' | 'charts' | 'align' | 'kootas' | 'score' | 'final'

const KOOTA_STEP_MS = 300
const KOOTAS_AT = 1700

/**
 * One table, one timer per row, all cleared together — the HeroCinematic
 * pattern. The result is already complete when this mounts; the sequence only
 * replays it, so Skip (or reduced motion) can show the real numbers at once.
 */
const TIMELINE: ReadonlyArray<{ stage: Stage; at: number }> = [
  { stage: 'charts', at: 60 },
  { stage: 'align', at: 950 },
  { stage: 'kootas', at: KOOTAS_AT },
  { stage: 'score', at: KOOTAS_AT + 8 * KOOTA_STEP_MS + 150 },
  { stage: 'final', at: KOOTAS_AT + 8 * KOOTA_STEP_MS + 900 },
]

function Medallion({ chart, side }: { chart: ChartData; side: 'bride' | 'groom' }) {
  const moon = chart.moon
  const markers = [
    { longitude: moon.longitude, label: 'Mo', ring: 'outer' as const, emphasis: true, title: `Moon — ${rashiOf(moon.rashi).name}, ${nakshatraOf(moon.nakshatra).name}` },
    ...(chart.lagna ? [{ longitude: chart.lagna.longitude, label: 'La', ring: 'inner' as const, title: `Lagna — ${rashiOf(chart.lagna.rashi).name}` }] : []),
  ]
  return (
    <div className={`kd-medallion kd-medallion-${side} flex flex-col items-center text-center`}>
      <div className="kd-mini-wheel w-[132px] sm:w-[168px]">
        <ZodiacWheel size={200} markers={markers} label={`${chart.name}'s Moon in ${rashiOf(moon.rashi).name}`} />
      </div>
      <p className="mt-2 text-[11px] uppercase tracking-[0.22em] text-gold-lt/80">
        <span className="font-deva normal-case tracking-normal text-[14px] mr-1">{ROLE_HI[side]}</span>{ROLE_LABEL[side]}
      </p>
      <p className="font-serif text-[20px] sm:text-[22px] text-cream leading-tight max-w-[12rem] truncate">{chart.name}</p>
      <p className="mt-1 text-[13px] text-paper-3/85">
        <span className="font-deva">{rashiOf(moon.rashi).hi}</span> {rashiOf(moon.rashi).name} · {nakshatraOf(moon.nakshatra).name}
      </p>
      <p className="text-[12px] text-paper-3/60">{chart.lagna ? `Lagna ${rashiOf(chart.lagna.rashi).name}` : 'Lagna needs birth time'}</p>
    </div>
  )
}

export function MatchReveal({ result, onFinished }: { result: MatchResult; onFinished?: () => void }) {
  const [stage, setStage] = useState<Stage>('intro')
  const [lit, setLit] = useState(0)
  const kootas = result.kootas
  const cumulative = useMemo(() => kootas.map((_, i) => kootas.slice(0, i + 1).reduce((s, k) => s + k.score, 0)), [kootas])

  useEffect(() => {
    const reduced = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false
    if (reduced) {
      setStage('final')
      setLit(8)
      return
    }
    const timers: ReturnType<typeof setTimeout>[] = []
    for (const { stage: s, at } of TIMELINE) timers.push(setTimeout(() => setStage(s), at))
    kootas.forEach((_, i) => timers.push(setTimeout(() => setLit(i + 1), KOOTAS_AT + i * KOOTA_STEP_MS)))
    return () => timers.forEach(clearTimeout)
  }, [kootas])

  useEffect(() => {
    if (stage === 'final') onFinished?.()
  }, [stage, onFinished])

  const skip = () => { setStage('final'); setLit(8) }
  const displayTotal = lit === 0 ? 0 : cumulative[lit - 1]
  const current = lit > 0 && lit <= 8 ? kootas[lit - 1] : null

  const caption: Record<Stage, string> = {
    intro: 'Kundli Match',
    charts: 'Placing both birth charts in the sidereal zodiac',
    align: `Bride’s Moon in ${rashiOf(result.bride.moon.rashi).name} · Groom’s Moon in ${rashiOf(result.groom.moon.rashi).name}`,
    kootas: current ? `${current.name}: ${points(current.score)} of ${current.maxScore}` : 'Evaluating the eight kootas',
    score: `${points(result.total)} of 36 Guna`,
    final: 'Kundli Match complete',
  }

  return (
    <section className="kd-cosmic kd-reveal rounded-mj-lg overflow-hidden border border-gold/25" data-stage={stage} aria-labelledby="kd-result-title">
      <div className="kd-stars" aria-hidden="true" />
      <LazyCosmicBackdrop intensity={stage === 'final' ? 'calm' : 'active'} />

      <div className="relative px-4 pt-6 pb-7 sm:px-8 sm:pt-8">
        <div className="text-center">
          <p className="text-[11px] uppercase tracking-[0.3em] text-marigold">Ashtakoota · Guna Milan</p>
          <h2 id="kd-result-title" tabIndex={-1} className="mt-2 font-serif text-[26px] sm:text-[32px] text-cream leading-tight outline-none">
            {result.bride.name} <span className="text-gold-lt">&amp;</span> {result.groom.name}
          </h2>
          <p className="kd-stage-caption mt-2 min-h-[1.5em] text-[14px] text-paper-3/85" aria-hidden="true">{caption[stage]}</p>
        </div>

        <div className="relative mt-4 grid grid-cols-2 gap-y-4 md:grid-cols-[1fr_auto_1fr] md:items-center">
          <svg className="kd-thread hidden md:block absolute inset-x-[12%] top-[34%] h-24 w-[76%] pointer-events-none" viewBox="0 0 600 100" preserveAspectRatio="none" aria-hidden="true">
            <path d="M0 50 C 150 -10, 450 110, 600 50" fill="none" stroke="#E4C572" strokeOpacity="0.55" strokeWidth="1.4" />
          </svg>
          <div className="order-1 md:order-none"><Medallion chart={result.bride} side="bride" /></div>
          <div className="order-3 col-span-2 md:order-none md:col-span-1">
            <ScoreRing kootas={kootas} displayTotal={displayTotal} litCount={lit} bandLabel={stage === 'final' || stage === 'score' ? result.band.label : undefined} />
          </div>
          <div className="order-2 md:order-none"><Medallion chart={result.groom} side="groom" /></div>
        </div>

        <div className="mt-6 flex flex-col items-center gap-2 text-center">
          {stage === 'final' ? (
            <p className="text-[14px] text-paper-3/85 max-w-xl">
              According to the traditional Ashtakoota methodology used here: <span className="text-gold-lt">{result.band.label}</span>. The full breakdown follows below.
            </p>
          ) : (
            <button type="button" onClick={skip} className="rounded-pill border border-gold/40 px-4 py-2 text-[13px] text-gold-lt hover:bg-gold/10 min-h-[40px]">
              Skip animation
            </button>
          )}
        </div>
      </div>
      <div className="kd-mithila-strip" aria-hidden="true" />
    </section>
  )
}
