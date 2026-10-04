'use client'

import Link from 'next/link'
import { METHODOLOGY } from '@/lib/astrology/methodology'
import type { NakshatraReading, Role } from '@/lib/astrology/types'
import { GANA_LABEL, NADI_LABEL, YONI_LABEL } from '@/lib/astrology/rules/tables'
import { NAKSHATRA_INFO, nakshatraBounds } from '@/lib/astrology/vedic/nakshatraInfo'
import { RASHIS, formatDegree, rashiIndexOf } from '@/lib/astrology/vedic/zodiac'
import { Disclaimer, SectionTitle } from '../kundli/ReportSections'
import { PREFILL_KEY } from '../kundli/BirthDetailsCard'
import { SINGLE_PREFILL_KEY, type SingleReportProps } from '../single/SingleChartExperience'
import { formatDateLong, formatTime12, grahaShort, nakshatraOf, rashiOf } from '../kundli/format'
import { NakshatraWheel } from './NakshatraWheel'
import { ordinal } from '@/lib/astrology/rules/manglik'

const pos = (lon: number) => `${formatDegree(lon - rashiIndexOf(lon) * 30)} ${RASHIS[rashiIndexOf(lon)].name}`

export function NakshatraReport({ result, person, scenarioKey, onEdit, onNew }: SingleReportProps<NakshatraReading>) {
  const { chart } = result
  const moon = chart.moon
  const nak = nakshatraOf(moon.nakshatra)
  const info = NAKSHATRA_INFO[moon.nakshatra]
  const bounds = nakshatraBounds(moon.nakshatraIndex)
  const tz = chart.birth.timezone
  const when = (iso: string) => new Date(iso).toLocaleString('en-IN', { day: 'numeric', month: 'short', year: 'numeric', hour: 'numeric', minute: '2-digit', timeZone: tz })
  const draft = { name: person.name, dateOfBirth: person.dateOfBirth, timeOfBirth: person.timeOfBirth ?? '', timeUnknown: person.timeOfBirth == null, place: person.place }

  function carry(to: 'janam' | Role) {
    try {
      if (to === 'janam') sessionStorage.setItem(SINGLE_PREFILL_KEY, JSON.stringify(draft))
      else sessionStorage.setItem(PREFILL_KEY, JSON.stringify({ role: to, draft }))
    } catch { /* storage unavailable — the next form simply starts empty */ }
    window.location.assign(to === 'janam' ? '/astrology/janam-kundli#janam-form' : '/astrology/kundli-match#kundli-form')
  }

  const tiles: Array<[string, string]> = [
    ['Nakshatra lord', grahaShort(moon.nakshatraLord)],
    ['Deity', info.deity],
    ['Symbol', info.symbol],
    ['Gana', GANA_LABEL[moon.gana]],
    ['Yoni', YONI_LABEL[moon.yoni]],
    ['Nadi', NADI_LABEL[moon.nadi]],
  ]

  return (
    <div className="space-y-12">
      <section className="kd-cosmic rounded-mj-lg overflow-hidden border border-gold/25" aria-labelledby="kd-result-title">
        <div className="kd-stars" aria-hidden="true" />
        <div className="relative px-4 py-7 sm:px-8 sm:py-9 grid gap-7 lg:grid-cols-[1fr_minmax(0,340px)] lg:items-center">
          <div>
            <p className="text-[11px] uppercase tracking-[0.3em] text-marigold">Janma nakshatra · {chart.name}</p>
            <h2 id="kd-result-title" tabIndex={-1} className="mt-2 font-serif text-[34px] sm:text-[44px] text-cream leading-tight outline-none">
              {nak.name} <span className="font-deva text-gold-lt text-[28px] sm:text-[34px]">{nak.hi}</span>
            </h2>
            <p className="mt-1 text-[16px] text-paper-3/85">
              {moon.pada ? `Pada ${moon.pada}` : 'Pada uncertain without birth time'} · Moon in {rashiOf(moon.rashi).name} ({rashiOf(moon.rashi).western})
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
            <NakshatraWheel
              highlight={moon.nakshatraIndex}
              moonLongitude={chart.timeKnown ? moon.longitude : null}
              label={`The 27 nakshatras with ${nak.name}, number ${moon.nakshatraIndex + 1}, highlighted${chart.timeKnown ? ' and the Moon at its calculated position' : ''}`}
            />
          </div>
        </div>
        <div className="kd-mithila-strip" aria-hidden="true" />
      </section>

      {(result.warnings.length > 0 || chart.notes.length > 0) && (
        <div className="rounded-mj border border-warning/40 bg-warning-soft px-5 py-4 max-w-3xl">
          <p className="text-[12px] uppercase tracking-[0.16em] text-warning-fg font-semibold mb-1.5">Please note</p>
          <ul className="space-y-1.5 text-[14px] text-ink leading-relaxed">
            {[...result.warnings, ...chart.notes.filter(n => !/Other planets/.test(n))].map(w => <li key={w}>{w}</li>)}
          </ul>
        </div>
      )}

      <section aria-labelledby="nk-pada">
        <SectionTitle id="nk-pada" eyebrow="1 · Pada and name syllables" title={moon.pada ? `Pada ${moon.pada} — “${info.syllables[moon.pada - 1][1]}”` : 'The four padas'}>
          Each nakshatra has four padas of 3°20′. By tradition, a child’s name begins with the syllable of the pada
          the Moon was in at birth.
        </SectionTitle>
        <div className="card p-4 sm:p-6">
          <div className="relative grid grid-cols-4 overflow-hidden rounded-mj-sm border border-gold/30">
            {bounds.padas.map((p, i) => {
              const mine = moon.pada === i + 1
              const [hi, en] = info.syllables[i]
              return (
                <div key={i} className={`px-2 py-3 text-center border-r border-gold/20 last:border-0 ${mine ? 'bg-maroon text-cream' : 'bg-paper'}`}>
                  <p className={`text-[10px] uppercase tracking-[0.14em] ${mine ? 'text-gold-lt' : 'text-terra'}`}>Pada {i + 1}</p>
                  <p className="font-deva text-[26px] leading-tight mt-1">{hi}</p>
                  <p className="text-[14px] font-semibold">{en}</p>
                  <p className={`mt-1 text-[11px] ${mine ? 'text-paper-3/85' : 'text-ink-soft'}`}>{pos(p.start)}</p>
                </div>
              )
            })}
            {result.progress != null && (
              <div className="absolute top-0 bottom-0 w-0.5 bg-gold" style={{ left: `${result.progress * 100}%` }} aria-hidden="true">
                <span className="absolute -top-0 left-1/2 -translate-x-1/2 h-2 w-2 rounded-full bg-gold" />
              </div>
            )}
          </div>
          <p className="mt-3 text-[14px] text-ink leading-relaxed">
            {nak.name} spans {pos(bounds.start)} to {pos(bounds.end % 360 === 0 ? 359.9999 : bounds.end)}.
            {result.progress != null
              ? ` At birth the Moon was at ${pos(moon.longitude)}, ${Math.round(result.progress * 100)}% of the way through — in pada ${moon.pada}, whose navamsa is ${result.padaNavamsaIndex != null ? RASHIS[result.padaNavamsaIndex].name : '—'}.`
              : ' Without a birth time the pada — and so the name syllable — cannot be fixed; any of the padas the Moon crossed in that part of the day is possible.'}
          </p>
          <p className="mt-2 text-[13px] text-ink-soft">
            Syllables follow the Avakahada Chakra as most North Indian panchangs print it; some regional lists differ
            slightly.
          </p>
        </div>
      </section>

      <section aria-labelledby="nk-window">
        <SectionTitle id="nk-window" eyebrow="2 · The Moon in this nakshatra" title={`When the Moon was in ${nak.name}`} />
        <div className="card p-5 sm:p-6 max-w-3xl">
          <dl className="grid gap-3 sm:grid-cols-2">
            <div><dt className="text-[11px] uppercase tracking-[0.16em] text-terra">Entered</dt><dd className="mt-0.5 font-serif text-[18px] text-maroon">{when(result.window.start)}</dd></div>
            <div><dt className="text-[11px] uppercase tracking-[0.16em] text-terra">Left</dt><dd className="mt-0.5 font-serif text-[18px] text-maroon">{when(result.window.end)}</dd></div>
          </dl>
          <p className="mt-3 text-[14px] text-ink-soft leading-relaxed">
            Times are local to the birthplace ({tz === 'Asia/Kolkata' ? 'IST' : tz}). Anyone born in this window — in
            any city — has {nak.name} as their Janma nakshatra; this is the same moment a panchang prints as the
            nakshatra’s start and end.
          </p>
        </div>
      </section>

      <section aria-labelledby="nk-tara">
        <SectionTitle id="nk-tara" eyebrow="3 · Navatara" title="The nine taras from your nakshatra">
          Counting from the Janma nakshatra, the 27 nakshatras fall into nine taras. Families use this when choosing
          auspicious days; the same counting gives the Tara koota in Kundli matching.
        </SectionTitle>
        <div className="card overflow-x-auto">
          <table className="w-full min-w-[560px] text-[14px]">
            <thead>
              <tr className="border-b border-gold/30 text-left text-[11px] uppercase tracking-[0.12em] text-terra">
                <th scope="col" className="px-4 py-2.5 font-semibold">Tara</th>
                <th scope="col" className="px-4 py-2.5 font-semibold">Nakshatras</th>
                <th scope="col" className="px-4 py-2.5 font-semibold">Traditionally</th>
              </tr>
            </thead>
            <tbody>
              {result.navatara.map(t => (
                <tr key={t.tara} className="border-b border-gold/10 last:border-0">
                  <th scope="row" className="px-4 py-2.5 text-left font-medium text-ink whitespace-nowrap">{t.tara}. {t.name}</th>
                  <td className="px-4 py-2.5 text-ink">{t.nakshatras.map(s => nakshatraOf(s).name).join(' · ')}</td>
                  <td className="px-4 py-2.5">
                    <span className={`rounded-pill px-2.5 py-0.5 text-[12px] font-semibold ${t.auspicious ? 'bg-success-soft text-success-fg' : 'bg-error-soft text-error-fg'}`}>
                      {t.auspicious ? 'Favourable' : 'Unfavourable'}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section aria-labelledby="nk-about">
        <SectionTitle id="nk-about" eyebrow="4 · About this nakshatra" title={`${nak.name} in tradition`} />
        <p className="max-w-3xl text-[15px] text-ink leading-relaxed">
          {nak.name} ({nak.hi}) is the {ordinal(moon.nakshatraIndex + 1)} of the 27 nakshatras. In the Vimshottari scheme it is ruled by {grahaShort(moon.nakshatraLord)}, so a life that begins with the Moon here
          begins in the {grahaShort(moon.nakshatraLord)} Mahadasha. Its presiding deity is {info.deity} and its symbol is
          {' '}{info.symbol.toLowerCase()}. For Kundli matching it is {GANA_LABEL[moon.gana]} Gana, {YONI_LABEL[moon.yoni]} Yoni and
          {' '}{NADI_LABEL[moon.nadi]} Nadi.
        </p>
        <p className="mt-3 text-[14px]">
          <Link href="/blogs/horoscope-marriage/what-is-nakshatra" className="text-maroon underline underline-offset-2">Read: What is Nakshatra?</Link>
        </p>
      </section>

      <section aria-label="Disclaimer">
        <Disclaimer text={METHODOLOGY.janamKundli.disclaimer} />
      </section>

      <section aria-labelledby="nk-next">
        <SectionTitle id="nk-next" eyebrow="5 · Next" title="Go further with the same details" />
        <div className="card p-5 sm:p-6">
          <p className="text-[14px] text-ink-soft">These carry the birth details over within this browser tab — nothing is saved on our side.</p>
          <div className="mt-4 flex flex-wrap gap-2">
            <button type="button" className="btn-primary" onClick={() => carry('janam')}>Make the full Janam Kundli</button>
            <button type="button" className="btn-ghost" onClick={() => carry('bride')}>Kundli Match as the bride</button>
            <button type="button" className="btn-ghost" onClick={() => carry('groom')}>Kundli Match as the groom</button>
          </div>
          <div className="mt-5 pt-5 border-t border-gold/20 flex flex-wrap gap-3">
            <button type="button" className="btn-ghost" onClick={onEdit}>Edit birth details</button>
            <button type="button" className="btn-ghost" onClick={onNew}>Find another nakshatra</button>
          </div>
        </div>
      </section>
    </div>
  )
}
