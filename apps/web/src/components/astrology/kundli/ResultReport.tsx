'use client'

import { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import Link from 'next/link'
import { METHODOLOGY } from '@/lib/astrology/methodology'
import type { KundliMatchRequest, MatchResult } from '@/lib/astrology/types'
import { KundliChart } from './KundliChart'
import { MatchReveal } from './MatchReveal'
import { PrintReport } from './PrintReport'
import { Disclaimer, KootaBreakdown, ManglikCards, MoonProfiles, PlanetTable, RelationshipMap, SectionTitle } from './ReportSections'
import { ResultActions } from './ResultActions'
import { carryPair } from '../single/carry'
import { ZodiacWheel } from './ZodiacWheel'
import { formatAyanamsha, formatCoords, formatDateLong, formatTime12, grahaOf, grahaShort, nakshatraOf, points, rashiOf } from './format'

const BAND_READING: Record<string, string> = {
  challenging:
    'Fewer than 18 Guna is below the minimum most Ashtakoota traditions look for. Families usually ask a pandit to look at the specific kootas that scored low, and at the rest of both charts, before deciding anything.',
  moderate:
    '18 to 23 Guna meets the traditional minimum of 18. Many marriages are arranged in this range, usually after a pandit has looked at the low-scoring kootas and any doshas.',
  good: '24 to 31 Guna is traditionally regarded as a good match on the Ashtakoota measure.',
  'very-strong': '32 to 36 Guna is traditionally regarded as a very strong Ashtakoota match.',
}

const NAV = [
  ['kd-summary', 'Summary'], ['kd-kootas', '8 Kootas'], ['kd-manglik', 'Manglik'], ['kd-moon', 'Rashi & Nakshatra'],
  ['kd-charts', 'Charts'], ['kd-insights', 'Insights'], ['kd-method', 'Method'], ['kd-actions', 'PDF & Share'],
] as const

type Props = {
  result: MatchResult
  request: KundliMatchRequest
  scenario?: { brideSegment: number | null; groomSegment: number | null }
  onEdit: () => void
  onNew: () => void
}

export function ResultReport({ result, request, scenario, onEdit, onNew }: Props) {
  const [mounted, setMounted] = useState(false)
  const [includeBirthDetails, setIncludeBirthDetails] = useState(true)
  useEffect(() => setMounted(true), [])

  const names = { bride: result.bride.name, groom: result.groom.name }
  const people = [result.bride, result.groom]
  const jump = (id: string) => (e: React.MouseEvent) => {
    e.preventDefault()
    const el = document.getElementById(id)
    el?.scrollIntoView({ behavior: 'instant' as ScrollBehavior, block: 'start' })
    el?.focus({ preventScroll: true })
  }

  const wheelMarkers = people.flatMap(c =>
    c.planets.map(p => ({
      longitude: p.longitude,
      label: grahaOf(p.id).abbr,
      ring: c.role === 'bride' ? ('inner' as const) : ('outer' as const),
      emphasis: p.id === 'moon',
      title: `${c.name}: ${grahaShort(p.id)} in ${rashiOf(p.rashi).name}, ${nakshatraOf(p.nakshatra).name}`,
    })),
  )

  return (
    <div className="space-y-12">
      <MatchReveal key={`${result.computedAt}-${scenario?.brideSegment}-${scenario?.groomSegment}`} result={result} />

      <nav aria-label="Result sections" className="-mx-1 overflow-x-auto">
        <ul className="flex gap-2 px-1 pb-1 min-w-max">
          {NAV.map(([id, label]) => (
            <li key={id}><a href={`#${id}`} onClick={jump(id)} className="chip whitespace-nowrap">{label}</a></li>
          ))}
        </ul>
      </nav>

      <section aria-labelledby="kd-summary" tabIndex={-1} className="outline-none">
        <SectionTitle id="kd-summary" eyebrow="1 · Compatibility summary" title={`${points(result.total)} of 36 Guna — ${result.band.label}`} />
        <p className="text-[16px] text-ink leading-relaxed max-w-3xl">
          According to the traditional Ashtakoota methodology used here, {names.bride} and {names.groom} share{' '}
          {points(result.total)} of the 36 Guna. {BAND_READING[result.band.key]}
        </p>
        {result.warnings.length > 0 && (
          <div className="mt-5 rounded-mj border border-warning/40 bg-warning-soft px-5 py-4 max-w-3xl">
            <p className="text-[12px] uppercase tracking-[0.16em] text-warning-fg font-semibold mb-1.5">Please note</p>
            <ul className="space-y-1.5 text-[14px] text-ink leading-relaxed">
              {result.warnings.map(w => <li key={w}>{w}</li>)}
            </ul>
          </div>
        )}
      </section>

      <section aria-labelledby="kd-kootas" tabIndex={-1} className="outline-none">
        <SectionTitle id="kd-kootas" eyebrow="2 · Koota breakdown" title="The eight kootas">
          Each koota compares one traditional attribute of the two Moon charts. Read across: the bride’s value, the
          koota and its score, the groom’s value.
        </SectionTitle>
        <RelationshipMap kootas={result.kootas} names={names} />
        <div className="mt-6"><KootaBreakdown kootas={result.kootas} /></div>
      </section>

      <section aria-labelledby="kd-manglik" tabIndex={-1} className="outline-none">
        <SectionTitle id="kd-manglik" eyebrow="3 · Manglik analysis" title="Manglik (Kuja) dosha">
          Mars counted from the Lagna and from the Moon, in houses {METHODOLOGY.manglik.houses.join(', ')}.
        </SectionTitle>
        <ManglikCards people={result.manglik} names={names} pair={result.manglik.pair} />
      </section>

      <section aria-labelledby="kd-moon" tabIndex={-1} className="outline-none">
        <SectionTitle id="kd-moon" eyebrow="4 · Rashi & nakshatra" title="Moon signs and birth stars">
          These Moon attributes are the inputs to the Ashtakoota.
        </SectionTitle>
        <MoonProfiles moons={{ bride: result.bride.moon, groom: result.groom.moon }} names={names} showDegrees />
      </section>

      <section aria-labelledby="kd-charts" tabIndex={-1} className="outline-none">
        <SectionTitle id="kd-charts" eyebrow="5 · Kundli charts" title="Both birth charts">
          North Indian charts: the top diamond is the 1st house, and houses run counter-clockwise. Numbers are rashis
          (1 = Mesha … 12 = Meena). ᴿ marks a retrograde planet.
        </SectionTitle>
        <div className="grid gap-6 lg:grid-cols-2">
          {people.map(c => (
            <div key={c.role} className="card p-4 sm:p-5">
              <div className="flex items-baseline justify-between gap-3 mb-3">
                <h3 className="font-serif text-maroon text-[20px]">{c.name}</h3>
                <span className="text-[12px] uppercase tracking-[0.14em] text-ink-soft">{c.lagna ? `Lagna ${rashiOf(c.lagna.rashi).name}` : 'Chandra Kundli'}</span>
              </div>
              <div className="mx-auto max-w-[360px]"><KundliChart chart={c} /></div>
              <p className="mt-3 text-[13px] text-ink-soft">
                {formatDateLong(c.birth.localDate)}
                {c.birth.localTime ? `, ${formatTime12(c.birth.localTime)}` : ', time unknown'} · {c.birth.placeLabel}
              </p>
              {c.notes.map(n => <p key={n} className="mt-2 text-[13px] text-info-fg bg-info-soft rounded-mj-sm px-3 py-2">{n}</p>)}
              <details className="mt-3">
                <summary className="cursor-pointer text-[14px] font-semibold text-maroon min-h-[36px] flex items-center">Planet positions</summary>
                <div className="mt-2"><PlanetTable planets={c.planets} timeKnown={c.timeKnown} /></div>
              </details>
            </div>
          ))}
        </div>

        <div className="mt-6 kd-cosmic rounded-mj-lg overflow-hidden border border-gold/25 p-5 sm:p-7">
          <div className="kd-stars" aria-hidden="true" />
          <div className="grid gap-6 md:grid-cols-[minmax(0,380px)_1fr] md:items-center">
            <div className="mx-auto w-full max-w-[380px]">
              <ZodiacWheel
                size={380}
                markers={wheelMarkers}
                connect
                label={`Sidereal zodiac with ${names.bride}'s planets on the inner ring and ${names.groom}'s on the outer ring`}
              />
            </div>
            <div>
              <h3 className="font-serif text-maroon text-[22px]">Both charts on one sky</h3>
              <p className="mt-2 text-[14px] text-ink-soft leading-relaxed">
                The sidereal zodiac with {names.bride}’s planets on the inner ring (maroon) and {names.groom}’s on the
                outer ring (gold). Each marker sits at its calculated longitude; the dashed line joins the two Moons,
                whose relationship drives Bhakoot, Tara and Graha Maitri. Marker sizes and ring spacing are
                illustrative only.
              </p>
              <p className="mt-3 text-[13px] text-terra">
                Moons: {rashiOf(result.bride.moon.rashi).name} and {rashiOf(result.groom.moon.rashi).name} —{' '}
                {result.kootas.find(k => k.key === 'bhakoot')!.score === 7 ? 'not a Bhakoot dosha position' : 'a Bhakoot dosha position'}.
              </p>
            </div>
          </div>
        </div>
      </section>

      <section aria-labelledby="kd-insights" tabIndex={-1} className="outline-none">
        <SectionTitle id="kd-insights" eyebrow="6 · Compatibility insights" title="How tradition reads this match" />
        <ul className="space-y-3 max-w-3xl">
          {result.insights.map(i => (
            <li key={i} className="flex gap-3 text-[15px] text-ink leading-relaxed">
              <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-gold" aria-hidden="true" />{i}
            </li>
          ))}
        </ul>
        <p className="mt-5 max-w-3xl text-[15px] text-ink-soft leading-relaxed">
          In Mithila practice the Guna total is a starting point, not a verdict. A family pandit will usually weigh
          the doshas and their cancellations, the strength of Mars and the Moon, the Lagna of each chart and the
          families’ own judgement before giving advice.
        </p>
        <p className="mt-3 max-w-3xl text-[15px]">
          <button type="button" className="text-maroon underline underline-offset-2" onClick={() => carryPair('compatibility', { bride: request.bride, groom: request.groom })}>
            See the Lagna, 7th house, Navamsa and cross-chart factors in Compatibility
          </button>
        </p>
      </section>

      <section aria-labelledby="kd-method" tabIndex={-1} className="outline-none">
        <SectionTitle id="kd-method" eyebrow="7 · Methodology" title={`How this was calculated — v${result.methodologyVersion}`} />
        <div className="card overflow-x-auto">
          <table className="w-full min-w-[520px] text-[14px]">
            <tbody>
              {([
                ['Zodiac', METHODOLOGY.zodiac],
                ['Ayanamsha', `${METHODOLOGY.ayanamsha.name} — ${names.bride}: ${formatAyanamsha(result.bride.ayanamsha)}, ${names.groom}: ${formatAyanamsha(result.groom.ayanamsha)}`],
                ['Planetary positions', `${METHODOLOGY.ephemeris.library} ${METHODOLOGY.ephemeris.libraryVersion} (${METHODOLOGY.ephemeris.licence}); checked against NASA JPL DE421`],
                ['Rahu / Ketu', METHODOLOGY.nodes],
                ['Houses', METHODOLOGY.houses],
                ['Time zones', people.map(c => `${c.name}: ${c.birth.timezone}, UTC${c.birth.utcOffset}`).join(' · ')],
                ['Birthplaces', people.map(c => `${c.name}: ${formatCoords(c.birth.latitude, c.birth.longitude)}${c.birth.placeSource === 'openstreetmap' ? ' (© OpenStreetMap contributors)' : c.birth.placeSource === 'manual' ? ' (entered manually)' : ''}`).join(' · ')],
                ['Kootas', 'Moon rashi and nakshatra of each person; scores are never altered by cancellation rules'],
              ] as const).map(([k, v]) => (
                <tr key={k} className="border-b border-gold/10 last:border-0">
                  <th scope="row" className="px-4 py-2.5 text-left align-top font-medium text-ink-soft w-[26%]">{k}</th>
                  <td className="px-4 py-2.5 text-ink">{v}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="mt-3 text-[14px]"><Link href="#methodology" className="text-maroon underline underline-offset-2">Read the full methodology and the tables used</Link></p>
      </section>

      <section aria-label="Disclaimer"><Disclaimer text={METHODOLOGY.disclaimer} /></section>

      <section aria-labelledby="kd-actions" tabIndex={-1} className="outline-none">
        <SectionTitle id="kd-actions" eyebrow="9 · Keep or share" title="Download, share or start again" />
        <ResultActions
          request={request}
          scenario={scenario}
          names={names}
          includeBirthDetails={includeBirthDetails}
          onIncludeBirthDetails={setIncludeBirthDetails}
          onEdit={onEdit}
          onNew={onNew}
        />
      </section>

      {mounted && createPortal(<PrintReport result={result} includeBirthDetails={includeBirthDetails} />, document.body)}
    </div>
  )
}
