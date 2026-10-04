'use client'

import { useId, useState } from 'react'
import Link from 'next/link'
import { METHODOLOGY } from '@/lib/astrology/methodology'
import type { BabyNamesReading, NameSyllable } from '@/lib/astrology/types'
import { nameStartsWith } from '@/lib/astrology/vedic/nameSyllable'
import { NAKSHATRA_INFO } from '@/lib/astrology/vedic/nakshatraInfo'
import { NAKSHATRAS, RASHIS } from '@/lib/astrology/vedic/zodiac'
import { Disclaimer, SectionTitle } from '../kundli/ReportSections'
import type { SingleReportProps } from '../single/SingleChartExperience'
import { carryTo } from '../single/carry'
import { formatDateLong, formatTime12, grahaShort } from '../kundli/format'

const key = (s: NameSyllable) => `${s.nakshatraIndex}-${s.pada}`

function NameChecker({ candidates, rashi }: { candidates: NameSyllable[]; rashi: NameSyllable[] }) {
  const id = useId()
  const [name, setName] = useState('')
  const trimmed = name.trim()
  const byPada = candidates.find(s => nameStartsWith(trimmed, s))
  const byRashi = byPada ? undefined : rashi.find(s => nameStartsWith(trimmed, s))

  return (
    <div className="card p-5 sm:p-6">
      <label htmlFor={id} className="field-label">Try a name</label>
      <input
        id={id}
        className="input kd-input"
        value={name}
        maxLength={40}
        autoComplete="off"
        placeholder="e.g. Himanshu or हिमांशु"
        onChange={e => setName(e.target.value)}
        aria-describedby={`${id}-result`}
      />
      <p id={`${id}-result`} role="status" aria-live="polite" className="mt-3 min-h-[3rem] text-[15px] leading-relaxed">
        {!trimmed ? (
          <span className="text-ink-soft">Type a name in English or Devanagari to see whether it starts with the child’s syllable.</span>
        ) : byPada ? (
          <span className="text-success-fg"><strong>✓ Yes.</strong> “{trimmed}” begins with {byPada.hi} ({byPada.en}) — the nakshatra-pada syllable, the traditional first choice.</span>
        ) : byRashi ? (
          <span className="text-warning-fg"><strong>◐ Rashi letter.</strong> “{trimmed}” begins with {byRashi.hi} ({byRashi.en}), one of the {RASHIS[Math.floor((byRashi.nakshatraIndex * 4 + byRashi.pada - 1) / 9)].name} rashi letters — accepted by many families, though not the pada syllable itself.</span>
        ) : (
          <span className="text-ink"><strong>✗ No.</strong> “{trimmed}” does not begin with the pada syllable or any of the rashi letters.</span>
        )}
      </p>
      <p className="mt-2 text-[12px] text-ink-soft">This is a first-sound check only — spellings vary, and the family’s own pandit has the final word.</p>
    </div>
  )
}

export function BabyNamesReport({ result, person, scenarioKey, onEdit, onNew }: SingleReportProps<BabyNamesReading>) {
  const { chart, candidates, rashiSyllables } = result
  const moon = chart.moon
  const nak = NAKSHATRAS[moon.nakshatraIndex]
  const primary = candidates.length === 1 ? candidates[0] : null
  const candidateKeys = new Set(candidates.map(key))

  return (
    <div className="space-y-12" key={scenarioKey}>
      <section className="kd-cosmic rounded-mj-lg overflow-hidden border border-gold/25" aria-labelledby="kd-result-title">
        <div className="kd-stars" aria-hidden="true" />
        <div className="relative px-4 py-8 sm:px-8 sm:py-10 text-center">
          <p className="text-[11px] uppercase tracking-[0.3em] text-marigold">Name syllable · नामाक्षर · {chart.name}</p>
          {primary ? (
            <h2 id="kd-result-title" tabIndex={-1} className="mt-4 outline-none">
              <span className="block font-deva text-gold-lt text-[88px] sm:text-[110px] leading-none">{primary.hi}</span>
              <span className="block mt-2 font-serif text-cream text-[30px] sm:text-[36px]">“{primary.en}”</span>
            </h2>
          ) : (
            <h2 id="kd-result-title" tabIndex={-1} className="mt-4 outline-none font-serif text-cream text-[28px] sm:text-[34px]">
              {candidates.map(c => c.en).join(' · ')}
              <span className="block mt-1 font-deva text-gold-lt text-[40px]">{candidates.map(c => c.hi).join(' · ')}</span>
            </h2>
          )}
          <p className="mt-4 text-[16px] text-paper-3/90">
            {primary
              ? `Pada ${primary.pada} of ${nak.name} nakshatra · Moon in ${RASHIS[moon.rashiIndex].name}`
              : `${nak.name} nakshatra — the pada needs the birth time, so each possible syllable is shown`}
          </p>
          <p className="mt-1 text-[13px] text-paper-3/65">
            {formatDateLong(chart.birth.localDate)}
            {chart.birth.localTime ? ` · ${formatTime12(chart.birth.localTime)}` : ' · time unknown'} · {chart.birth.placeLabel}
          </p>
          <dl className="mt-6 mx-auto max-w-2xl grid grid-cols-2 sm:grid-cols-4 gap-2.5 text-left">
            {([
              ['Nakshatra', nak.name],
              ['Pada', moon.pada ? String(moon.pada) : 'Needs time'],
              ['Rashi', RASHIS[moon.rashiIndex].name],
              ['Nakshatra lord', grahaShort(nak.lord)],
            ] as const).map(([k, v]) => (
              <div key={k} className="rounded-mj-sm border border-gold/25 bg-cosmic-mid/80 px-3 py-2.5">
                <dt className="text-[10px] uppercase tracking-[0.16em] text-gold-lt/80">{k}</dt>
                <dd className="mt-1 font-serif text-[16px] leading-tight text-cream">{v}</dd>
              </div>
            ))}
          </dl>
        </div>
        <div className="kd-mithila-strip" aria-hidden="true" />
      </section>

      {result.warnings.length > 0 && (
        <div className="rounded-mj border border-warning/40 bg-warning-soft px-5 py-4 max-w-3xl">
          <p className="text-[12px] uppercase tracking-[0.16em] text-warning-fg font-semibold mb-1.5">Please note</p>
          <ul className="space-y-1.5 text-[14px] text-ink leading-relaxed">{result.warnings.map(w => <li key={w}>{w}</li>)}</ul>
        </div>
      )}

      <section aria-labelledby="bn-check">
        <SectionTitle id="bn-check" eyebrow="1 · Check a name" title="Does a name you like fit?">
          Families usually start the name with the nakshatra-pada syllable; many also accept any of the rashi letters.
        </SectionTitle>
        <div className="max-w-2xl"><NameChecker candidates={candidates} rashi={rashiSyllables} /></div>
      </section>

      <section aria-labelledby="bn-padas">
        <SectionTitle id="bn-padas" eyebrow="2 · The four padas" title={`Syllables of ${nak.name}`}>
          The syllable depends on which quarter (pada) of the nakshatra the Moon was in.
        </SectionTitle>
        <div className="grid grid-cols-4 max-w-2xl overflow-hidden rounded-mj-sm border border-gold/30">
          {NAKSHATRA_INFO[nak.slug].syllables.map(([hi, en], i) => {
            const on = candidateKeys.has(`${moon.nakshatraIndex}-${i + 1}`)
            return (
              <div key={i} className={`px-2 py-4 text-center border-r border-gold/20 last:border-0 ${on ? 'bg-maroon text-cream' : 'bg-paper'}`}>
                <p className={`text-[10px] uppercase tracking-[0.14em] ${on ? 'text-gold-lt' : 'text-terra'}`}>Pada {i + 1}</p>
                <p className="font-deva text-[32px] leading-tight mt-1">{hi}</p>
                <p className="text-[15px] font-semibold">{en}</p>
              </div>
            )
          })}
        </div>
      </section>

      <section aria-labelledby="bn-rashi">
        <SectionTitle id="bn-rashi" eyebrow="3 · Rashi letters" title={`The nine letters of ${RASHIS[moon.rashiIndex].name}`}>
          The syllables of every pada in the Moon’s rashi. Some families choose from this wider set, especially when
          the pada syllable is hard to build a name on.
        </SectionTitle>
        <ul className="flex flex-wrap gap-2 max-w-3xl">
          {rashiSyllables.map(s => {
            const on = candidateKeys.has(key(s))
            return (
              <li key={key(s)} className={`rounded-mj-sm border px-3 py-2 text-center ${on ? 'border-maroon bg-maroon text-cream' : 'border-gold/30 bg-cream'}`}>
                <span className="block font-deva text-[22px] leading-tight">{s.hi}</span>
                <span className="block text-[13px] font-semibold">{s.en}</span>
                <span className={`block text-[10px] ${on ? 'text-paper-3' : 'text-ink-soft'}`}>{NAKSHATRAS[s.nakshatraIndex].name} {s.pada}</span>
              </li>
            )
          })}
        </ul>
      </section>

      <section aria-labelledby="bn-tradition">
        <SectionTitle id="bn-tradition" eyebrow="4 · Naming tradition" title="Naamkaran in Mithila families" />
        <div className="max-w-3xl space-y-3 text-[15px] text-ink leading-relaxed">
          <p>
            The naming ceremony (Naamkaran) is traditionally held on the eleventh or twelfth day after birth, though
            families often choose another auspicious day. The child’s Janma nakshatra is read from the birth time, and
            the name is chosen to begin with the syllable of its pada.
          </p>
          <p>
            Many Mithila families keep two names: a <em>rashi naam</em> that follows the syllable and is used in
            ceremonies and the kundli, and a <em>pukaar naam</em> for everyday use that need not. Both are equally
            common today.
          </p>
          <p>
            The syllables follow the Avakahada Chakra as most North Indian panchangs print it; some regional lists
            differ in a few places, so confirm with the family pandit.
          </p>
        </div>
      </section>

      <section aria-label="Disclaimer"><Disclaimer text={METHODOLOGY.janamKundli.disclaimer} /></section>

      <section aria-labelledby="bn-next">
        <SectionTitle id="bn-next" eyebrow="5 · Next" title="For the child’s records" />
        <div className="card p-5 sm:p-6">
          <div className="flex flex-wrap gap-2">
            <button type="button" className="btn-primary" onClick={() => carryTo('janam', person)}>Make the child’s Janam Kundli</button>
            <button type="button" className="btn-ghost" onClick={() => carryTo('nakshatra', person)}>See the Nakshatra reading</button>
            <button type="button" className="btn-ghost" onClick={() => carryTo('rashi', person)}>See the Rashi reading</button>
          </div>
          <p className="mt-3 text-[13px] text-ink-soft">
            Details carry over within this browser tab only. <Link href="/blogs/horoscope-marriage/what-is-nakshatra" className="text-maroon underline underline-offset-2">Read: What is Nakshatra?</Link>
          </p>
          <div className="mt-5 pt-5 border-t border-gold/20 flex flex-wrap gap-3">
            <button type="button" className="btn-ghost" onClick={onEdit}>Edit birth details</button>
            <button type="button" className="btn-ghost" onClick={onNew}>Another child</button>
          </div>
        </div>
      </section>
    </div>
  )
}
