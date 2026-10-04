'use client'

import Link from 'next/link'
import { METHODOLOGY } from '@/lib/astrology/methodology'
import type { RashiReading } from '@/lib/astrology/types'
import { VARNA_LABEL, VASHYA_LABEL } from '@/lib/astrology/rules/tables'
import { DIGNITY_LABEL, dignityOf } from '@/lib/astrology/vedic/divisions'
import { BHAKOOT_NAME, QUALITY_LABEL, TATTVA_LABEL, padasInRashi, rashiAttributes, type BhakootRelation } from '@/lib/astrology/vedic/rashiInfo'
import { NAKSHATRAS, RASHIS, formatDegree } from '@/lib/astrology/vedic/zodiac'
import { KundliChart } from '../kundli/KundliChart'
import { Disclaimer, SectionTitle } from '../kundli/ReportSections'
import { ZodiacWheel } from '../kundli/ZodiacWheel'
import type { SingleReportProps } from '../single/SingleChartExperience'
import { carryTo } from '../single/carry'
import { formatAyanamsha, formatDateLong, formatTime12, grahaOf, grahaShort, nakshatraOf, points, rashiOf } from '../kundli/format'

export function RashiReport({ result, person, scenarioKey, onEdit, onNew }: SingleReportProps<RashiReading>) {
  const { chart, sun, nakshatraCertain } = result
  const moon = chart.moon
  const r = RASHIS[moon.rashiIndex]
  const attr = rashiAttributes(moon.rashiIndex)
  const moonDignity = dignityOf('moon', moon.rashiIndex)
  const tz = chart.birth.timezone
  const when = (iso: string) => new Date(iso).toLocaleString('en-IN', { day: 'numeric', month: 'short', year: 'numeric', hour: 'numeric', minute: '2-digit', timeZone: tz })
  const exactMoon = chart.timeKnown

  const tiles: Array<[string, string]> = [
    ['Rashi lord', grahaShort(r.lord)],
    ['Element', TATTVA_LABEL[attr.tattva]],
    ['Quality', QUALITY_LABEL[attr.quality]],
    ['Symbol', attr.symbol],
    ['Varna', VARNA_LABEL[moon.varna]],
    ['Moon here', moonDignity ? DIGNITY_LABEL[moonDignity] : '—'],
  ]

  const ranked = [...result.compatibility].sort((a, b) => b.bhakootPoints + b.grahaMaitriPoints - (a.bhakootPoints + a.grahaMaitriPoints) || a.rashiIndex - b.rashiIndex)

  return (
    <div className="space-y-12">
      <section className="kd-cosmic rounded-mj-lg overflow-hidden border border-gold/25" aria-labelledby="kd-result-title">
        <div className="kd-stars" aria-hidden="true" />
        <div className="relative px-4 py-7 sm:px-8 sm:py-9 grid gap-7 lg:grid-cols-[1fr_minmax(0,340px)] lg:items-center">
          <div>
            <p className="text-[11px] uppercase tracking-[0.3em] text-marigold">Janma rashi · Moon sign · {chart.name}</p>
            <h2 id="kd-result-title" tabIndex={-1} className="mt-2 font-serif text-[34px] sm:text-[44px] text-cream leading-tight outline-none">
              {r.name} <span className="font-deva text-gold-lt text-[30px] sm:text-[36px]">{r.hi}</span>
            </h2>
            <p className="mt-1 text-[16px] text-paper-3/85">
              {r.western} in Western terms · {exactMoon ? `Moon at ${formatDegree(moon.degreeInRashi)}` : 'Moon’s exact degree needs the birth time'}
              {nakshatraCertain ? ` · ${nakshatraOf(moon.nakshatra).name}${moon.pada ? ` pada ${moon.pada}` : ''}` : ''}
            </p>
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
          <div className="mx-auto w-full max-w-[340px]" key={scenarioKey}>
            <ZodiacWheel
              size={340}
              highlightRashi={moon.rashiIndex}
              markers={exactMoon ? [{ longitude: moon.longitude, label: 'Mo', ring: 'outer', emphasis: true, title: `Moon in ${r.name}` }] : []}
              label={`The twelve rashis with ${r.name} highlighted${exactMoon ? ' and the Moon at its calculated position' : ''}`}
            />
          </div>
        </div>
        <div className="kd-mithila-strip" aria-hidden="true" />
      </section>

      {(result.warnings.length > 0 || !nakshatraCertain) && (
        <div className="rounded-mj border border-warning/40 bg-warning-soft px-5 py-4 max-w-3xl">
          <p className="text-[12px] uppercase tracking-[0.16em] text-warning-fg font-semibold mb-1.5">Please note</p>
          <ul className="space-y-1.5 text-[14px] text-ink leading-relaxed">
            {!nakshatraCertain && <li>The Moon stayed in {r.name} all through that part of the day but changed nakshatra, so the rashi is certain and the nakshatra is not. The Nakshatra tool can ask which part of the day.</li>}
            {result.warnings.map(w => <li key={w}>{w}</li>)}
          </ul>
        </div>
      )}

      <section aria-labelledby="rs-signs">
        <SectionTitle id="rs-signs" eyebrow="1 · Vedic and Western signs" title="Why your “star sign” may look different">
          Indian astrology reads the sidereal zodiac, fixed to the stars; Western astrology reads the tropical zodiac,
          fixed to the seasons. The two are about {Math.round(chart.ayanamsha)}° apart today — the Lahiri ayanamsha.
        </SectionTitle>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {([
            ['Moon sign (Vedic)', r.name, 'Your Janma rashi — used for Kundli matching'],
            ['Sun sign (Vedic)', RASHIS[sun.siderealRashiIndex].name, 'Where the Sun was in the sidereal zodiac'],
            ['Sun sign (Western)', RASHIS[sun.tropicalRashiIndex].western, 'The “star sign” in Western horoscopes'],
            ['Lagna (rising sign)', chart.lagna ? rashiOf(chart.lagna.rashi).name : 'Needs birth time', 'The sign rising in the east at birth'],
          ] as const).map(([k, v, sub]) => (
            <div key={k} className="card px-4 py-3">
              <p className="text-[11px] uppercase tracking-[0.16em] text-terra">{k}</p>
              <p className="mt-1 font-serif text-maroon text-[20px] leading-tight">{v}</p>
              <p className="mt-1 text-[12px] text-ink-soft">{sub}</p>
            </div>
          ))}
        </div>
        <p className="mt-3 text-[14px] text-ink-soft max-w-3xl">
          {sun.siderealRashiIndex === sun.tropicalRashiIndex
            ? `Here both systems put the Sun in the same sign, ${RASHIS[sun.siderealRashiIndex].name} / ${RASHIS[sun.tropicalRashiIndex].western}.`
            : `The Western Sun sign is ${RASHIS[sun.tropicalRashiIndex].western}, but in the Vedic zodiac the Sun was in ${RASHIS[sun.siderealRashiIndex].name} (${RASHIS[sun.siderealRashiIndex].western}). Ayanamsha for this birth: ${formatAyanamsha(chart.ayanamsha)}.`}
        </p>
      </section>

      <section aria-labelledby="rs-window">
        <SectionTitle id="rs-window" eyebrow="2 · The Moon in this rashi" title={`When the Moon was in ${r.name}`} />
        <div className="grid gap-5 lg:grid-cols-2">
          <div className="card p-5 sm:p-6">
            <dl className="grid gap-3 sm:grid-cols-2">
              <div><dt className="text-[11px] uppercase tracking-[0.16em] text-terra">Entered</dt><dd className="mt-0.5 font-serif text-[18px] text-maroon">{when(result.window.start)}</dd></div>
              <div><dt className="text-[11px] uppercase tracking-[0.16em] text-terra">Left</dt><dd className="mt-0.5 font-serif text-[18px] text-maroon">{when(result.window.end)}</dd></div>
            </dl>
            <p className="mt-3 text-[14px] text-ink-soft leading-relaxed">
              Local time at the birthplace. The Moon spends about two and a half days in each rashi; anyone born in this
              window has {r.name} as their Moon sign.
            </p>
          </div>
          <div className="card p-5 sm:p-6">
            <p className="text-[11px] uppercase tracking-[0.16em] text-terra">Nakshatra padas in {r.name}</p>
            <ul className="mt-2 space-y-1.5">
              {padasInRashi(moon.rashiIndex).map(g => {
                const mine = nakshatraCertain && g.nakshatraIndex === moon.nakshatraIndex
                return (
                  <li key={g.nakshatraIndex} className={`flex items-baseline justify-between gap-3 rounded-mj-sm px-3 py-1.5 ${mine ? 'bg-maroon text-cream' : 'bg-paper'}`}>
                    <span className="font-serif text-[16px]"><span className="font-deva">{NAKSHATRAS[g.nakshatraIndex].hi}</span> {NAKSHATRAS[g.nakshatraIndex].name}</span>
                    <span className={`text-[13px] ${mine ? 'text-paper-3' : 'text-ink-soft'}`}>
                      {g.padas.length === 4 ? 'all 4 padas' : `pada ${g.padas.join(', ')}`}{mine && moon.pada ? ` · yours: ${moon.pada}` : ''}
                    </span>
                  </li>
                )
              })}
            </ul>
          </div>
        </div>
      </section>

      <section aria-labelledby="rs-compat">
        <SectionTitle id="rs-compat" eyebrow="3 · Moon-sign compatibility" title={`How the twelve Moon signs sit with ${r.name}`}>
          Two of the eight kootas — Bhakoot and Graha Maitri, 12 of the 36 points — depend only on the two Moon signs.
          This is a partial reading; the other 24 points need both nakshatras, so use{' '}
          <Link href="/astrology/kundli-match" className="text-maroon underline underline-offset-2">Kundli Match</Link> for a real comparison.
        </SectionTitle>
        <div className="card overflow-x-auto">
          <table className="w-full min-w-[600px] text-[14px]">
            <thead>
              <tr className="border-b border-gold/30 text-left text-[11px] uppercase tracking-[0.12em] text-terra">
                <th scope="col" className="px-4 py-2.5 font-semibold">Partner’s Moon sign</th>
                <th scope="col" className="px-4 py-2.5 font-semibold">Relationship</th>
                <th scope="col" className="px-4 py-2.5 font-semibold">Bhakoot</th>
                <th scope="col" className="px-4 py-2.5 font-semibold">Graha Maitri</th>
                <th scope="col" className="px-4 py-2.5 font-semibold w-[22%]">Of these 12</th>
              </tr>
            </thead>
            <tbody>
              {ranked.map(c => {
                const sum = c.bhakootPoints + c.grahaMaitriPoints
                return (
                  <tr key={c.rashiIndex} className={`border-b border-gold/10 last:border-0 ${c.rashiIndex === moon.rashiIndex ? 'bg-gold/10' : ''}`}>
                    <th scope="row" className="px-4 py-2 text-left font-normal text-ink whitespace-nowrap">
                      <span className="font-deva text-maroon">{RASHIS[c.rashiIndex].hi}</span> {RASHIS[c.rashiIndex].name}
                      <span className="text-ink-soft text-[12px]"> · {grahaShort(RASHIS[c.rashiIndex].lord)}</span>
                    </th>
                    <td className="px-4 py-2 text-ink">{BHAKOOT_NAME[c.relation as BhakootRelation]}</td>
                    <td className={`px-4 py-2 ${c.bhakootPoints ? 'text-ink' : 'text-error-fg font-semibold'}`}>{c.bhakootPoints} / 7</td>
                    <td className="px-4 py-2 text-ink">{points(c.grahaMaitriPoints)} / 5</td>
                    <td className="px-4 py-2">
                      <div className="flex items-center gap-2">
                        <div className="h-2 flex-1 rounded-full bg-paper-3 overflow-hidden" aria-hidden="true">
                          <div className="h-full rounded-full bg-gradient-to-r from-gold to-maroon" style={{ width: `${(sum / 12) * 100}%` }} />
                        </div>
                        <span className="text-[13px] text-ink tabular-nums w-9 text-right">{points(sum)}</span>
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </section>

      <section aria-labelledby="rs-chart">
        <SectionTitle id="rs-chart" eyebrow="4 · Chandra Kundli" title={`The chart from ${r.name}`}>
          The Moon’s rashi as the first house, with every planet placed from it — read alongside the Lagna chart in
          Mithila practice, and on its own when the birth time is unknown.
        </SectionTitle>
        <div className="grid gap-6 md:grid-cols-[minmax(0,360px)_1fr] items-start">
          <div className="card p-4"><KundliChart chart={chart} mode="chandra" /></div>
          <ul className="space-y-1.5 text-[14px]">
            {chart.planets.map(p => (
              <li key={p.id} className="flex justify-between gap-3 border-b border-gold/10 pb-1.5">
                <span className="text-ink">{grahaShort(p.id)} <span className="font-deva text-ink-soft">{grahaOf(p.id).hi}</span></span>
                <span className="text-ink-soft">{rashiOf(p.rashi).name} · house {p.houseFromMoon} from the Moon</span>
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section aria-labelledby="rs-about">
        <SectionTitle id="rs-about" eyebrow="5 · About this rashi" title={`${r.name} in tradition`} />
        <p className="max-w-3xl text-[15px] text-ink leading-relaxed">
          {r.name} ({r.hi}) is the {['first', 'second', 'third', 'fourth', 'fifth', 'sixth', 'seventh', 'eighth', 'ninth', 'tenth', 'eleventh', 'twelfth'][moon.rashiIndex]} sign
          of the zodiac, ruled by {grahaShort(r.lord)}. It is a {QUALITY_LABEL[attr.quality].toLowerCase()} {TATTVA_LABEL[attr.tattva].toLowerCase()} sign,
          {' '}{attr.parity.toLowerCase()}, associated with the {attr.direction.toLowerCase()} and symbolised by {attr.symbol.toLowerCase()}.
          For Kundli matching a Moon here gives {VARNA_LABEL[moon.varna]} Varna and {VASHYA_LABEL[moon.vashya]} Vashya.
        </p>
        <p className="mt-3 text-[14px]">
          <Link href="/blogs/horoscope-marriage/what-is-rashi" className="text-maroon underline underline-offset-2">Read: What is Rashi?</Link>
        </p>
      </section>

      <section aria-label="Disclaimer"><Disclaimer text={METHODOLOGY.janamKundli.disclaimer} /></section>

      <section aria-labelledby="rs-next">
        <SectionTitle id="rs-next" eyebrow="6 · Next" title="Go further with the same details" />
        <div className="card p-5 sm:p-6">
          <p className="text-[14px] text-ink-soft">These carry the birth details over within this browser tab — nothing is saved on our side.</p>
          <div className="mt-4 flex flex-wrap gap-2">
            <button type="button" className="btn-primary" onClick={() => carryTo('janam', person)}>Make the full Janam Kundli</button>
            <button type="button" className="btn-ghost" onClick={() => carryTo('nakshatra', person)}>See the Nakshatra reading</button>
            <button type="button" className="btn-ghost" onClick={() => carryTo('bride', person)}>Kundli Match as the bride</button>
            <button type="button" className="btn-ghost" onClick={() => carryTo('groom', person)}>Kundli Match as the groom</button>
          </div>
          <div className="mt-5 pt-5 border-t border-gold/20 flex flex-wrap gap-3">
            <button type="button" className="btn-ghost" onClick={onEdit}>Edit birth details</button>
            <button type="button" className="btn-ghost" onClick={onNew}>Find another rashi</button>
          </div>
        </div>
      </section>
    </div>
  )
}
