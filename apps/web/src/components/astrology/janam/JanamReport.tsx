'use client'

import { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import Link from 'next/link'
import { METHODOLOGY } from '@/lib/astrology/methodology'
import type { JanamKundliResult, PersonInput, Role } from '@/lib/astrology/types'
import { RASHIS } from '@/lib/astrology/vedic/zodiac'
import { KundliChart, NorthIndianChart } from '../kundli/KundliChart'
import { Disclaimer, ManglikCard, SectionTitle } from '../kundli/ReportSections'
import { ZodiacWheel } from '../kundli/ZodiacWheel'
import { PREFILL_KEY } from '../kundli/BirthDetailsCard'
import { fileSafe, printKundliReport } from '../kundli/printing'
import { formatAyanamsha, formatCoords, formatDateLong, formatTime12, grahaOf, grahaShort, nakshatraOf, rashiOf } from '../kundli/format'
import { AtAGlance, DashaTimeline, JanamPlanetTable, MoonAttributes, PanchangCard } from './JanamSections'
import { JanamPrintReport } from './JanamPrintReport'

const NAV = [
  ['jk-charts', 'Charts'], ['jk-planets', 'Planets'], ['jk-moon', 'Rashi & Nakshatra'], ['jk-panchang', 'Panchang'],
  ['jk-dasha', 'Dasha'], ['jk-manglik', 'Manglik'], ['jk-method', 'Method'], ['jk-actions', 'PDF & more'],
] as const

type Props = { result: JanamKundliResult; person: PersonInput; scenarioKey: string; onEdit: () => void; onNew: () => void }

export function JanamReport({ result, person, scenarioKey, onEdit, onNew }: Props) {
  const [mounted, setMounted] = useState(false)
  const [nowMs, setNowMs] = useState(0)
  const [includeBirthDetails, setIncludeBirthDetails] = useState(true)
  useEffect(() => { setMounted(true); setNowMs(Date.now()) }, [])

  const { chart, navamsa } = result
  const jump = (id: string) => (e: React.MouseEvent) => {
    e.preventDefault()
    const el = document.getElementById(id)
    el?.scrollIntoView({ behavior: 'instant' as ScrollBehavior, block: 'start' })
    el?.focus({ preventScroll: true })
  }

  const markers = [
    ...chart.planets.map(p => ({
      longitude: p.longitude,
      label: grahaOf(p.id).abbr,
      ring: 'outer' as const,
      emphasis: p.id === 'moon',
      title: `${grahaShort(p.id)} in ${rashiOf(p.rashi).name}, ${nakshatraOf(p.nakshatra).name}`,
    })),
    ...(chart.lagna ? [{ longitude: chart.lagna.longitude, label: 'La', ring: 'inner' as const, emphasis: true, title: `Lagna in ${rashiOf(chart.lagna.rashi).name}` }] : []),
  ]

  const d9First = navamsa.lagnaRashiIndex ?? navamsa.planets.find(p => p.id === 'moon')!.rashiIndex
  const d9Placements = navamsa.planets.filter(p => p.rashiIndex != null).map(p => ({ id: p.id, rashiIndex: p.rashiIndex! }))

  function sendToMatch(role: Role) {
    try {
      sessionStorage.setItem(PREFILL_KEY, JSON.stringify({
        role,
        draft: {
          name: person.name, dateOfBirth: person.dateOfBirth, timeOfBirth: person.timeOfBirth ?? '',
          timeUnknown: person.timeOfBirth == null, place: person.place,
        },
      }))
    } catch { /* storage unavailable — the match form simply starts empty */ }
    window.location.assign('/astrology/kundli-match#kundli-form')
  }

  return (
    <div className="space-y-12">
      <section className="kd-cosmic rounded-mj-lg overflow-hidden border border-gold/25" aria-labelledby="kd-result-title">
        <div className="kd-stars" aria-hidden="true" />
        <div className="relative px-4 py-7 sm:px-8 sm:py-9 grid gap-7 lg:grid-cols-[1fr_minmax(0,340px)] lg:items-center">
          <div>
            <p className="text-[11px] uppercase tracking-[0.3em] text-marigold">Janam Kundli · जन्म कुण्डली</p>
            <h2 id="kd-result-title" tabIndex={-1} className="mt-2 font-serif text-[30px] sm:text-[38px] text-cream leading-tight outline-none">{chart.name}</h2>
            <p className="mt-1 text-[14px] text-paper-3/80">
              {formatDateLong(chart.birth.localDate)}
              {chart.birth.localTime ? ` · ${formatTime12(chart.birth.localTime)}` : chart.moonWindow ? ` · time unknown (${chart.moonWindow.fromLocal}–${chart.moonWindow.toLocal} assumed window)` : ' · time unknown'}
              {' · '}{chart.birth.placeLabel}
            </p>
            <div className="mt-5"><AtAGlance result={result} nowMs={nowMs} /></div>
          </div>
          <div className="mx-auto w-full max-w-[340px]">
            <ZodiacWheel
              key={scenarioKey}
              size={340}
              markers={markers}
              animateMarkers
              label={`Sidereal zodiac with ${chart.name}'s nine grahas${chart.lagna ? ' and Lagna' : ''} at their calculated longitudes`}
            />
            <p className="mt-2 text-center text-[11px] text-paper-3/60">Planets at their calculated sidereal longitudes; spacing is illustrative.</p>
          </div>
        </div>
        <div className="kd-mithila-strip" aria-hidden="true" />
      </section>

      {(result.warnings.length > 0 || chart.notes.length > 0) && (
        <div className="rounded-mj border border-warning/40 bg-warning-soft px-5 py-4 max-w-3xl">
          <p className="text-[12px] uppercase tracking-[0.16em] text-warning-fg font-semibold mb-1.5">Please note</p>
          <ul className="space-y-1.5 text-[14px] text-ink leading-relaxed">
            {[...result.warnings, ...chart.notes].map(w => <li key={w}>{w}</li>)}
          </ul>
        </div>
      )}

      <nav aria-label="Report sections" className="-mx-1 overflow-x-auto">
        <ul className="flex gap-2 px-1 pb-1 min-w-max">
          {NAV.map(([id, label]) => <li key={id}><a href={`#${id}`} onClick={jump(id)} className="chip whitespace-nowrap">{label}</a></li>)}
        </ul>
      </nav>

      <section aria-labelledby="jk-charts" tabIndex={-1} className="outline-none">
        <SectionTitle id="jk-charts" eyebrow="1 · Charts" title="Lagna, Chandra and Navamsa charts">
          North Indian style: the top diamond is the 1st house and houses run counter-clockwise; numbers are rashis
          (1 = Mesha … 12 = Meena). ᴿ marks a retrograde graha.
        </SectionTitle>
        <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
          <div className="card p-4">
            <h3 className="font-serif text-maroon text-[19px]">Lagna Kundli <span className="text-ink-soft text-[13px]">(D1)</span></h3>
            <p className="text-[12px] text-ink-soft mb-2">{chart.lagna ? `Lagna ${rashiOf(chart.lagna.rashi).name} as the 1st house` : 'Needs the birth time — shown as Chandra Kundli'}</p>
            <KundliChart chart={chart} />
          </div>
          <div className="card p-4">
            <h3 className="font-serif text-maroon text-[19px]">Chandra Kundli</h3>
            <p className="text-[12px] text-ink-soft mb-2">The Moon’s rashi, {rashiOf(chart.moon.rashi).name}, as the 1st house</p>
            <KundliChart chart={chart} mode="chandra" />
          </div>
          <div className="card p-4 md:col-span-2 xl:col-span-1">
            <h3 className="font-serif text-maroon text-[19px]">Navamsa <span className="text-ink-soft text-[13px]">(D9)</span></h3>
            {d9First != null ? (
              <>
                <p className="text-[12px] text-ink-soft mb-2">
                  {navamsa.lagnaRashiIndex != null ? `Navamsa Lagna ${RASHIS[navamsa.lagnaRashiIndex].name}` : `Moon’s navamsa ${RASHIS[d9First].name} as the 1st house (no birth time)`}
                </p>
                <div className="md:max-w-[360px] xl:max-w-none mx-auto">
                  <NorthIndianChart
                    firstRashiIndex={d9First}
                    placements={d9Placements}
                    firstHouseLabel={navamsa.lagnaRashiIndex != null ? 'D9 LAGNA' : 'D9 MOON'}
                    description={`Navamsa chart with ${RASHIS[d9First].name} as the first house`}
                  />
                </div>
              </>
            ) : (
              <p className="mt-2 text-[14px] text-ink-soft">The Navamsa needs the birth time: without it neither the Lagna nor the Moon’s navamsa is certain.</p>
            )}
          </div>
        </div>
      </section>

      <section aria-labelledby="jk-planets" tabIndex={-1} className="outline-none">
        <SectionTitle id="jk-planets" eyebrow="2 · Planetary positions" title="The nine grahas">
          Sidereal positions (Lahiri). Vargottama marks a graha in the same sign in the Rashi and Navamsa charts.
        </SectionTitle>
        <JanamPlanetTable result={result} />
      </section>

      <section aria-labelledby="jk-moon" tabIndex={-1} className="outline-none">
        <SectionTitle id="jk-moon" eyebrow="3 · Janma rashi & nakshatra" title="Moon sign and birth star">
          The Moon’s sign and nakshatra are what Kundli matching, naming traditions and the dasha all start from.
        </SectionTitle>
        <div className="max-w-2xl"><MoonAttributes result={result} /></div>
      </section>

      <section aria-labelledby="jk-panchang" tabIndex={-1} className="outline-none">
        <SectionTitle id="jk-panchang" eyebrow="4 · Panchang at birth" title="Tithi, vara, nakshatra, yoga, karana" />
        <PanchangCard result={result} />
      </section>

      <section aria-labelledby="jk-dasha" tabIndex={-1} className="outline-none">
        <SectionTitle id="jk-dasha" eyebrow="5 · Vimshottari dasha" title="Planetary periods (Mahadasha & Antardasha)">
          The 120-year cycle of planetary periods used throughout North Indian astrology. It is a calendar of periods,
          not a prediction.
        </SectionTitle>
        <DashaTimeline result={result} nowMs={nowMs} />
      </section>

      <section aria-labelledby="jk-manglik" tabIndex={-1} className="outline-none">
        <SectionTitle id="jk-manglik" eyebrow="6 · Manglik" title="Manglik (Kuja) dosha">
          Mars counted from the Lagna and from the Moon, in houses {METHODOLOGY.manglik.houses.join(', ')}.
        </SectionTitle>
        <div className="max-w-2xl"><ManglikCard person={result.manglik} heading={chart.name} /></div>
      </section>

      <section aria-labelledby="jk-method" tabIndex={-1} className="outline-none">
        <SectionTitle id="jk-method" eyebrow="7 · Methodology" title={`How this was calculated — v${result.methodologyVersion}`} />
        <div className="card overflow-x-auto">
          <table className="w-full min-w-[520px] text-[14px]">
            <tbody>
              {([
                ['Zodiac & ayanamsha', `${METHODOLOGY.zodiac}, ${METHODOLOGY.ayanamsha.name} — ${formatAyanamsha(chart.ayanamsha)} for this birth`],
                ['Planetary positions', `${METHODOLOGY.ephemeris.library} ${METHODOLOGY.ephemeris.libraryVersion}; checked against NASA JPL DE421`],
                ['Rahu / Ketu', METHODOLOGY.nodes],
                ['Houses', METHODOLOGY.houses],
                ['Time zone', `${chart.birth.timezone}, UTC${chart.birth.utcOffset}`],
                ['Birthplace', `${formatCoords(chart.birth.latitude, chart.birth.longitude)}${chart.birth.placeSource === 'openstreetmap' ? ' (© OpenStreetMap contributors)' : chart.birth.placeSource === 'manual' ? ' (entered manually)' : ''}`],
                ['Navamsa', 'Nine parts of 3°20′ per rashi, starting signs per the classical rule'],
                ['Dasha', 'Vimshottari from the Moon’s nakshatra; years of 365.25 days'],
              ] as const).map(([k, v]) => (
                <tr key={k} className="border-b border-gold/10 last:border-0">
                  <th scope="row" className="px-4 py-2.5 text-left align-top font-medium text-ink-soft w-[26%]">{k}</th>
                  <td className="px-4 py-2.5 text-ink">{v}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="mt-3 text-[14px]"><Link href="#methodology" className="text-maroon underline underline-offset-2">Read the full methodology</Link></p>
      </section>

      <section aria-label="Disclaimer"><Disclaimer text={METHODOLOGY.janamKundli.disclaimer} /></section>

      <section aria-labelledby="jk-actions" tabIndex={-1} className="outline-none">
        <SectionTitle id="jk-actions" eyebrow="8 · Keep or use" title="Download, match or start again" />
        <div className="card p-5 sm:p-6 grid gap-6 md:grid-cols-2">
          <div>
            <h3 className="font-serif text-maroon text-[20px]">Download PDF</h3>
            <p className="mt-1 text-[14px] text-ink-soft leading-relaxed">An A4 Janam Kundli with all three charts, planets, panchang and dasha. Choose “Save as PDF” in the print dialog.</p>
            <label className="mt-3 flex items-start gap-2.5 cursor-pointer text-[14px] text-ink">
              <input type="checkbox" className="mt-1 h-[18px] w-[18px] accent-maroon" checked={includeBirthDetails} onChange={e => setIncludeBirthDetails(e.target.checked)} />
              Include the birth date, time and place
            </label>
            <button type="button" className="btn-primary mt-4" onClick={() => printKundliReport(`Janam-Kundli-${fileSafe(chart.name)}`)}>Download PDF</button>
          </div>
          <div>
            <h3 className="font-serif text-maroon text-[20px]">Use for Kundli Match</h3>
            <p className="mt-1 text-[14px] text-ink-soft leading-relaxed">
              Carry these birth details into Kundli Match. They stay in this browser tab — nothing is saved on our side.
            </p>
            <div className="mt-4 flex flex-wrap gap-2">
              <button type="button" className="btn-ghost" onClick={() => sendToMatch('bride')}>Use as the bride’s details</button>
              <button type="button" className="btn-ghost" onClick={() => sendToMatch('groom')}>Use as the groom’s details</button>
            </div>
            <p className="mt-3 text-[12px] text-ink-soft">
              There is no share link for a Janam Kundli: a full birth chart reveals the date and time of birth.
            </p>
          </div>
          <div className="md:col-span-2 pt-5 border-t border-gold/20 flex flex-wrap gap-3">
            <button type="button" className="btn-ghost" onClick={onEdit}>Edit birth details</button>
            <button type="button" className="btn-ghost" onClick={onNew}>Make another Kundli</button>
          </div>
        </div>
      </section>

      {mounted && createPortal(<JanamPrintReport result={result} includeBirthDetails={includeBirthDetails} nowMs={nowMs} />, document.body)}
    </div>
  )
}
