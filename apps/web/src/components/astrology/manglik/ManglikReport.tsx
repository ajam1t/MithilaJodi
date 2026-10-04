'use client'

import Link from 'next/link'
import { METHODOLOGY } from '@/lib/astrology/methodology'
import type { ManglikReading } from '@/lib/astrology/types'
import { ordinal } from '@/lib/astrology/rules/manglik'
import { DIGNITY_LABEL } from '@/lib/astrology/vedic/divisions'
import { RASHIS, formatDegree } from '@/lib/astrology/vedic/zodiac'
import { NorthIndianChart } from '../kundli/KundliChart'
import { Disclaimer, SectionTitle } from '../kundli/ReportSections'
import { ZodiacWheel } from '../kundli/ZodiacWheel'
import type { SingleReportProps } from '../single/SingleChartExperience'
import { carryTo } from '../single/carry'
import { formatDateLong, formatTime12 } from '../kundli/format'

const HOUSES = METHODOLOGY.manglik.houses as readonly number[]

/** The labels the `manglik` master list uses on member profiles. */
const PROFILE_LABEL: Record<'yes' | 'no' | 'anshik' | 'unknown', string> = {
  yes: 'Yes', no: 'No', anshik: 'Anshik (Partial)', unknown: 'Don’t Know',
}

const TONE: Record<ManglikReading['manglik']['status'], string> = {
  yes: 'bg-maroon text-cream border-gold/60',
  anshik: 'bg-warning-soft text-warning-fg border-warning/40',
  no: 'bg-success-soft text-success-fg border-success/40',
  incomplete: 'bg-info-soft text-info-fg border-info/40',
}

const SUMMARY: Record<ManglikReading['manglik']['status'], string> = {
  yes: 'Mars is in a Manglik house counted from both the Lagna and the Moon.',
  anshik: 'Mars is in a Manglik house by one of the two counts, not both.',
  no: 'Mars is not in a Manglik house by either count.',
  incomplete: 'Only the Moon-based count is possible without a birth time.',
}

export function ManglikReport({ result, person, scenarioKey, onEdit, onNew }: SingleReportProps<ManglikReading>) {
  const { chart, manglik: m } = result
  const mars = chart.planets.find(p => p.id === 'mars')!
  const marsOnly = [{ id: 'mars' as const, rashiIndex: mars.rashiIndex, retrograde: mars.retrograde }]

  const tiles: Array<[string, string]> = [
    ['Mars in', `${RASHIS[mars.rashiIndex].name}${chart.timeKnown ? ` ${formatDegree(mars.degreeInRashi)}` : ''}`],
    ['From the Lagna', m.marsHouseFromLagna ? `${ordinal(m.marsHouseFromLagna)} house` : 'Needs birth time'],
    ['From the Moon', `${ordinal(m.marsHouseFromMoon)} house`],
    ['Mars’s dignity', result.marsDignity ? DIGNITY_LABEL[result.marsDignity] : '—'],
    ['Motion', mars.retrograde ? 'Retrograde' : 'Direct'],
    ['Profile field', PROFILE_LABEL[m.masterValue]],
  ]

  const markers = [
    { longitude: mars.longitude, label: 'Ma', ring: 'outer' as const, emphasis: true, title: `Mars in ${RASHIS[mars.rashiIndex].name}` },
    ...(chart.timeKnown ? [{ longitude: chart.moon.longitude, label: 'Mo', ring: 'outer' as const, title: 'Moon' }] : []),
    ...(chart.lagna ? [{ longitude: chart.lagna.longitude, label: 'La', ring: 'inner' as const, title: 'Lagna' }] : []),
  ]

  return (
    <div className="space-y-12">
      <section className="kd-cosmic rounded-mj-lg overflow-hidden border border-gold/25" aria-labelledby="kd-result-title">
        <div className="kd-stars" aria-hidden="true" />
        <div className="relative px-4 py-7 sm:px-8 sm:py-9 grid gap-7 lg:grid-cols-[1fr_minmax(0,320px)] lg:items-center">
          <div>
            <p className="text-[11px] uppercase tracking-[0.3em] text-marigold">Manglik check · {chart.name}</p>
            <h2 id="kd-result-title" tabIndex={-1} className="mt-3 outline-none">
              <span className={`inline-flex rounded-pill border px-5 py-2 font-serif text-[26px] sm:text-[32px] leading-none ${TONE[m.status]}`}>{m.label}</span>
            </h2>
            <p className="mt-3 text-[16px] text-paper-3/90 max-w-xl">{SUMMARY[m.status]}</p>
            <p className="mt-1 text-[13px] text-paper-3/65">
              {formatDateLong(chart.birth.localDate)}
              {chart.birth.localTime ? ` · ${formatTime12(chart.birth.localTime)}` : ' · time unknown'} · {chart.birth.placeLabel}
            </p>
            <dl className="mt-5 grid grid-cols-2 sm:grid-cols-3 gap-2.5">
              {tiles.map(([k, v]) => (
                <div key={k} className="rounded-mj-sm border border-gold/25 bg-cosmic-mid/80 px-3 py-2.5">
                  <dt className="text-[10px] uppercase tracking-[0.16em] text-gold-lt/80">{k}</dt>
                  <dd className="mt-1 font-serif text-[16px] leading-tight text-cream">{v}</dd>
                </div>
              ))}
            </dl>
          </div>
          <div className="mx-auto w-full max-w-[320px]" key={scenarioKey}>
            <ZodiacWheel size={320} highlightRashi={mars.rashiIndex} markers={markers} label={`Mars in ${RASHIS[mars.rashiIndex].name}, shown on the sidereal zodiac`} />
          </div>
        </div>
        <div className="kd-mithila-strip" aria-hidden="true" />
      </section>

      {result.warnings.length > 0 && (
        <div className="rounded-mj border border-warning/40 bg-warning-soft px-5 py-4 max-w-3xl">
          <p className="text-[12px] uppercase tracking-[0.16em] text-warning-fg font-semibold mb-1.5">Please note</p>
          <ul className="space-y-1.5 text-[14px] text-ink leading-relaxed">{result.warnings.map(w => <li key={w}>{w}</li>)}</ul>
        </div>
      )}

      <section aria-labelledby="mg-how">
        <SectionTitle id="mg-how" eyebrow="1 · How it was worked out" title="Mars counted from the Lagna and from the Moon">
          The shaded houses are the Manglik houses — {HOUSES.join(', ')}. A chart is Manglik when Mars falls in one of
          them by both counts, Anshik (partial) by one count, and not Manglik by neither.
        </SectionTitle>
        <div className="grid gap-5 md:grid-cols-2">
          <div className="card p-4">
            <h3 className="font-serif text-maroon text-[19px]">Counted from the Lagna</h3>
            {chart.lagna ? (
              <>
                <p className="text-[13px] text-ink-soft mb-2">
                  Lagna {RASHIS[chart.lagna.rashiIndex].name} · Mars in the {ordinal(m.marsHouseFromLagna!)} house —{' '}
                  <strong className={m.fromLagna ? 'text-maroon' : 'text-success-fg'}>{m.fromLagna ? 'a Manglik house' : 'not a Manglik house'}</strong>
                </p>
                <NorthIndianChart firstRashiIndex={chart.lagna.rashiIndex} placements={marsOnly} firstHouseLabel="LAGNA" shadeHouses={[...HOUSES]}
                  description={`Houses counted from the Lagna ${RASHIS[chart.lagna.rashiIndex].name}, Manglik houses shaded, Mars in house ${m.marsHouseFromLagna}`} />
              </>
            ) : (
              <p className="mt-2 text-[14px] text-ink-soft leading-relaxed">
                The Lagna changes about every two hours, so this count needs the birth time. It is the count most families
                rely on — without it the status stays incomplete.
              </p>
            )}
          </div>
          <div className="card p-4">
            <h3 className="font-serif text-maroon text-[19px]">Counted from the Moon</h3>
            <p className="text-[13px] text-ink-soft mb-2">
              Moon in {RASHIS[chart.moon.rashiIndex].name} · Mars in the {ordinal(m.marsHouseFromMoon)} house —{' '}
              <strong className={m.fromMoon ? 'text-maroon' : 'text-success-fg'}>{m.fromMoon ? 'a Manglik house' : 'not a Manglik house'}</strong>
            </p>
            <NorthIndianChart firstRashiIndex={chart.moon.rashiIndex} placements={marsOnly} firstHouseLabel="MOON" shadeHouses={[...HOUSES]}
              description={`Houses counted from the Moon in ${RASHIS[chart.moon.rashiIndex].name}, Manglik houses shaded, Mars in house ${m.marsHouseFromMoon}`} />
          </div>
        </div>
        <p className="mt-4 max-w-3xl text-[15px] text-ink leading-relaxed">{m.explanation}</p>
      </section>

      <section aria-labelledby="mg-context">
        <SectionTitle id="mg-context" eyebrow="2 · Exceptions and context" title="What traditions also look at" />
        <div className="grid gap-4 md:grid-cols-2">
          <div className="card p-5">
            <h3 className="font-serif text-maroon text-[18px]">Traditional exceptions</h3>
            {m.exceptions.length ? (
              <ul className="mt-2 space-y-1.5 text-[14px] text-ink">{m.exceptions.map(e => <li key={e}>• {e}</li>)}</ul>
            ) : (
              <p className="mt-2 text-[14px] text-ink">
                {m.fromLagna || m.fromMoon ? 'None of the exceptions checked here (Mars in its own sign or exalted) apply.' : 'No Manglik placement, so no exception is needed.'}
              </p>
            )}
            <p className="mt-3 text-[12px] text-ink-soft">Exceptions are reported, never applied: the status above is unchanged by them.</p>
          </div>
          <div className="card p-5">
            <h3 className="font-serif text-maroon text-[18px]">For information only</h3>
            <ul className="mt-2 space-y-2 text-[14px] text-ink leading-relaxed">
              <li>
                <strong>Mars’s strength:</strong> in {RASHIS[mars.rashiIndex].name} Mars is{' '}
                {result.marsDignity ? DIGNITY_LABEL[result.marsDignity].toLowerCase() : '—'}
                {mars.retrograde ? ', and retrograde at birth' : ''}. Many pandits weigh this when judging how strong a dosha is.
              </li>
              <li>
                <strong>Counted from Venus:</strong> Mars is in the {ordinal(result.marsHouseFromVenus)} house
                {HOUSES.includes(result.marsHouseFromVenus) ? ' — a Manglik house by that count' : ' — not a Manglik house by that count'}.
                Some traditions add this third count; Mithila Jodi’s status uses the Lagna and the Moon only.
              </li>
            </ul>
          </div>
        </div>
      </section>

      <section aria-labelledby="mg-marriage">
        <SectionTitle id="mg-marriage" eyebrow="3 · Manglik and marriage" title="What families traditionally do with this" />
        <div className="max-w-3xl space-y-3 text-[15px] text-ink leading-relaxed">
          <p>
            Manglik status matters only when two charts are compared. Traditionally, two Manglik charts are considered
            to balance each other, which is why many families look for exactly that pairing. When only one chart is
            Manglik, families usually ask a pandit, who weighs the exceptions, the strength of Mars in each chart and the
            rest of the Kundli match.
          </p>
          <p>It is one consideration among many — never, on its own, a verdict on a marriage.</p>
        </div>
        <div className="mt-4 flex flex-wrap gap-2">
          <button type="button" className="btn-primary" onClick={() => carryTo('bride', person)}>Check a match — as the bride</button>
          <button type="button" className="btn-ghost" onClick={() => carryTo('groom', person)}>Check a match — as the groom</button>
        </div>
      </section>

      <section aria-labelledby="mg-profile">
        <SectionTitle id="mg-profile" eyebrow="4 · On your profile" title={`Profile field: “${PROFILE_LABEL[m.masterValue]}”`}>
          Mithila Jodi profiles record Manglik as Yes, No, Anshik (Partial) or Don’t Know. By this calculation the field
          would be “{PROFILE_LABEL[m.masterValue]}”{m.status === 'incomplete' ? ' until the birth time is known' : ''}.
          Members can update it under the horoscope section of their profile.
        </SectionTitle>
      </section>

      <section aria-label="Disclaimer"><Disclaimer text={METHODOLOGY.janamKundli.disclaimer} /></section>

      <section aria-labelledby="mg-next">
        <SectionTitle id="mg-next" eyebrow="5 · Next" title="Go further with the same details" />
        <div className="card p-5 sm:p-6">
          <div className="flex flex-wrap gap-2">
            <button type="button" className="btn-ghost" onClick={() => carryTo('janam', person)}>Make the full Janam Kundli</button>
            <button type="button" className="btn-ghost" onClick={() => carryTo('nakshatra', person)}>See the Nakshatra reading</button>
            <button type="button" className="btn-ghost" onClick={() => carryTo('rashi', person)}>See the Rashi reading</button>
          </div>
          <p className="mt-3 text-[13px] text-ink-soft">
            Details carry over within this browser tab only. <Link href="/blogs/horoscope-marriage/what-is-manglik" className="text-maroon underline underline-offset-2">Read: What is Manglik dosha?</Link>
          </p>
          <div className="mt-5 pt-5 border-t border-gold/20 flex flex-wrap gap-3">
            <button type="button" className="btn-ghost" onClick={onEdit}>Edit birth details</button>
            <button type="button" className="btn-ghost" onClick={onNew}>Check another chart</button>
          </div>
        </div>
      </section>
    </div>
  )
}
