import { METHODOLOGY } from '@/lib/astrology/methodology'
import type { MatchResult } from '@/lib/astrology/types'
import { GANA_LABEL, NADI_LABEL, VARNA_LABEL, YONI_LABEL } from '@/lib/astrology/rules/tables'
import { KundliChart } from './KundliChart'
import { PlanetTable } from './ReportSections'
import { formatAyanamsha, formatCoords, formatDateLong, formatTime12, grahaShort, nakshatraOf, points, rashiOf } from './format'

/**
 * The A4 report behind "Download PDF". Hidden on screen; the print stylesheet
 * shows only this element. Same data as the screen, laid out for paper.
 */
export function PrintReport({ result, includeBirthDetails }: { result: MatchResult; includeBirthDetails: boolean }) {
  const people = [result.bride, result.groom]
  const computed = new Date(result.computedAt).toLocaleString('en-IN', { day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit', timeZone: 'Asia/Kolkata' })
  const cell = 'border border-[#E4C572] px-2 py-1 text-left align-top'

  return (
    <div id="kundli-print" aria-hidden="true">
      {/* Mounted only while a report is on screen, so it cannot affect other pages' printing. */}
      <style>{'@page { size: A4; margin: 12mm 12mm 14mm; }'}</style>
      <header style={{ borderBottom: '2px solid #B98A2E', paddingBottom: '8px', marginBottom: '12px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
        <div>
          <p style={{ fontFamily: 'Marcellus, serif', fontSize: '20pt', color: '#7A1220', margin: 0 }}>Mithila Jodi</p>
          <p style={{ margin: 0, fontSize: '9pt', color: '#6A5A4E' }}>जहाँ परम्परा मिले, प्रेम से · mithilajodi.com</p>
        </div>
        <div style={{ textAlign: 'right' }}>
          <p style={{ fontFamily: 'Marcellus, serif', fontSize: '14pt', color: '#7A1220', margin: 0 }}>Kundli Match Report</p>
          <p style={{ margin: 0, fontSize: '9pt', color: '#6A5A4E' }}>Calculated {computed} IST · Methodology v{result.methodologyVersion}</p>
        </div>
      </header>

      <section className="kd-avoid-break" style={{ display: 'flex', gap: '16px', alignItems: 'center', marginBottom: '12px' }}>
        <div style={{ border: '2px solid #B98A2E', borderRadius: '50%', width: '110px', height: '110px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
          <span style={{ fontFamily: 'Marcellus, serif', fontSize: '30pt', color: '#7A1220', lineHeight: 1 }}>{points(result.total)}</span>
          <span style={{ fontSize: '8pt', letterSpacing: '0.12em', color: '#6A5A4E' }}>OF 36 GUNA</span>
        </div>
        <div>
          <p style={{ fontFamily: 'Marcellus, serif', fontSize: '15pt', margin: 0 }}>{result.bride.name} (Bride) &amp; {result.groom.name} (Groom)</p>
          <p style={{ margin: '4px 0 0', fontSize: '11pt', color: '#7A1220' }}>{result.band.label} ({result.band.min}–{result.band.max})</p>
          <p style={{ margin: '4px 0 0', fontSize: '9.5pt' }}>{result.manglik.pair.summary}</p>
        </div>
      </section>

      {includeBirthDetails && (
        <table className="w-full border-collapse kd-avoid-break" style={{ marginBottom: '10px', fontSize: '9.5pt' }}>
          <thead><tr><th className={cell}></th><th className={cell}>Date of birth</th><th className={cell}>Time</th><th className={cell}>Place</th></tr></thead>
          <tbody>
            {people.map(c => (
              <tr key={c.role}>
                <th className={cell}>{c.name}</th>
                <td className={cell}>{formatDateLong(c.birth.localDate)}</td>
                <td className={cell}>{c.birth.localTime ? `${formatTime12(c.birth.localTime)} (UTC${c.birth.utcOffset})` : 'Unknown'}</td>
                <td className={cell}>{c.birth.placeLabel} · {formatCoords(c.birth.latitude, c.birth.longitude)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      <h3 style={{ fontFamily: 'Marcellus, serif', color: '#7A1220', fontSize: '13pt', margin: '8px 0 4px' }}>Ashtakoota — eight kootas</h3>
      <table className="w-full border-collapse" style={{ fontSize: '9pt' }}>
        <thead><tr><th className={cell}>Koota</th><th className={cell}>Bride</th><th className={cell}>Groom</th><th className={cell}>Score</th><th className={cell} style={{ width: '42%' }}>Reason</th></tr></thead>
        <tbody>
          {result.kootas.map(k => (
            <tr key={k.key} className="kd-avoid-break">
              <th className={cell}>{k.name}</th>
              <td className={cell}>{k.bride}</td>
              <td className={cell}>{k.groom}</td>
              <td className={cell}>{points(k.score)} / {k.maxScore}</td>
              <td className={cell}>{k.explanation}{k.dosha?.cancellations.length ? ` Cancellation noted: ${k.dosha.cancellations.join(' ')}` : ''}</td>
            </tr>
          ))}
          <tr><th className={cell} colSpan={3}>Total</th><td className={cell} colSpan={2}><strong>{points(result.total)} / 36</strong></td></tr>
        </tbody>
      </table>

      <section className="kd-avoid-break">
        <h3 style={{ fontFamily: 'Marcellus, serif', color: '#7A1220', fontSize: '13pt', margin: '12px 0 4px' }}>Manglik</h3>
        {people.map(c => {
          const m = result.manglik[c.role]
          return <p key={c.role} style={{ margin: '2px 0', fontSize: '9.5pt' }}><strong>{c.name}: {m.label}.</strong> {m.explanation} {m.exceptions.join(' ')}</p>
        })}
      </section>

      <section className="kd-avoid-break">
        <h3 style={{ fontFamily: 'Marcellus, serif', color: '#7A1220', fontSize: '13pt', margin: '12px 0 4px' }}>Rashi &amp; Nakshatra</h3>
        <table className="w-full border-collapse" style={{ fontSize: '9.5pt' }}>
          <thead><tr><th className={cell}></th>{people.map(c => <th key={c.role} className={cell}>{c.name}</th>)}</tr></thead>
          <tbody>
            {([
              ['Moon rashi (lord)', (c: typeof people[number]) => `${rashiOf(c.moon.rashi).name} (${grahaShort(c.moon.rashiLord)})`],
              ['Nakshatra (lord) · pada', (c: typeof people[number]) => `${nakshatraOf(c.moon.nakshatra).name} (${grahaShort(c.moon.nakshatraLord)}) · ${c.moon.pada ?? 'uncertain'}`],
              ['Gana · Yoni · Nadi', (c: typeof people[number]) => `${GANA_LABEL[c.moon.gana]} · ${YONI_LABEL[c.moon.yoni]} · ${NADI_LABEL[c.moon.nadi]}`],
              ['Varna', (c: typeof people[number]) => VARNA_LABEL[c.moon.varna]],
              ['Lagna', (c: typeof people[number]) => (c.lagna ? rashiOf(c.lagna.rashi).name : 'Not calculated (birth time unknown)')],
              ['Ayanamsha (Lahiri)', (c: typeof people[number]) => formatAyanamsha(c.ayanamsha)],
            ] as const).map(([label, f]) => (
              <tr key={label}><th className={cell}>{label}</th>{people.map(c => <td key={c.role} className={cell}>{f(c)}</td>)}</tr>
            ))}
          </tbody>
        </table>
      </section>

      <section className="kd-page-break">
        <h3 style={{ fontFamily: 'Marcellus, serif', color: '#7A1220', fontSize: '13pt', margin: '0 0 6px' }}>Birth charts (North Indian)</h3>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
          {people.map(c => (
            <div key={c.role} className="kd-avoid-break">
              <p style={{ margin: '0 0 4px', fontSize: '10pt' }}><strong>{c.name}</strong> — {c.lagna ? 'Lagna Kundli' : 'Chandra Kundli'}</p>
              <KundliChart chart={c} size={300} theme="print" />
              <div style={{ marginTop: '6px' }}><PlanetTable planets={c.planets} timeKnown={c.timeKnown} /></div>
            </div>
          ))}
        </div>
      </section>

      {result.warnings.length > 0 && (
        <section className="kd-avoid-break">
          <h3 style={{ fontFamily: 'Marcellus, serif', color: '#7A1220', fontSize: '12pt', margin: '12px 0 4px' }}>Notes on precision</h3>
          {result.warnings.map(w => <p key={w} style={{ margin: '2px 0', fontSize: '9pt' }}>• {w}</p>)}
        </section>
      )}

      <section className="kd-avoid-break" style={{ marginTop: '12px', fontSize: '8.5pt', color: '#4A3B33' }}>
        <h3 style={{ fontFamily: 'Marcellus, serif', color: '#7A1220', fontSize: '12pt', margin: '0 0 4px' }}>Methodology v{METHODOLOGY.version}</h3>
        <p style={{ margin: '2px 0' }}>Sidereal zodiac, {METHODOLOGY.ayanamsha.name} ayanamsha; {METHODOLOGY.nodes} {METHODOLOGY.houses} houses; North Indian chart. Planetary positions: {METHODOLOGY.ephemeris.library} {METHODOLOGY.ephemeris.libraryVersion}. Time zones: IANA database with historical offsets and daylight saving.</p>
        <p style={{ margin: '2px 0' }}>{METHODOLOGY.ashtakoota.cancellations}</p>
        <p style={{ margin: '2px 0' }}>Manglik: {METHODOLOGY.manglik.status}</p>
        <p style={{ margin: '6px 0 0', padding: '6px 8px', border: '1px solid #E4C572' }}>{METHODOLOGY.disclaimer}</p>
      </section>
    </div>
  )
}
