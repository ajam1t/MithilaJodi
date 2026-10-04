import { METHODOLOGY } from '@/lib/astrology/methodology'
import type { JanamKundliResult } from '@/lib/astrology/types'
import { GANA_LABEL, NADI_LABEL, VARNA_LABEL, YONI_LABEL } from '@/lib/astrology/rules/tables'
import { DIGNITY_LABEL } from '@/lib/astrology/vedic/divisions'
import { RASHIS, formatDegree } from '@/lib/astrology/vedic/zodiac'
import { KundliChart, NorthIndianChart } from '../kundli/KundliChart'
import { formatAyanamsha, formatCoords, formatDateLong, formatTime12, grahaShort, nakshatraOf, rashiOf } from '../kundli/format'
import { currentMahadasha } from './JanamSections'

const H = { fontFamily: 'Marcellus, serif', color: '#7A1220', fontSize: '13pt', margin: '12px 0 4px' } as const
const dateFmt = (iso: string) => new Date(iso).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric', timeZone: 'Asia/Kolkata' })

/** The A4 Janam Kundli behind "Download PDF". Hidden on screen; see kundli.css print rules. */
export function JanamPrintReport({ result, includeBirthDetails, nowMs }: { result: JanamKundliResult; includeBirthDetails: boolean; nowMs: number }) {
  const { chart, navamsa, panchang, dasha, manglik } = result
  const cell = 'border border-[#E4C572] px-2 py-1 text-left align-top'
  const computed = new Date(result.computedAt).toLocaleString('en-IN', { day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit', timeZone: 'Asia/Kolkata' })
  const d9First = navamsa.lagnaRashiIndex ?? navamsa.planets.find(p => p.id === 'moon')!.rashiIndex
  const cur = currentMahadasha(result, nowMs)

  return (
    <div id="kundli-print" aria-hidden="true">
      <style>{'@page { size: A4; margin: 12mm 12mm 14mm; }'}</style>
      <header style={{ borderBottom: '2px solid #B98A2E', paddingBottom: '8px', marginBottom: '12px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
        <div>
          <p style={{ fontFamily: 'Marcellus, serif', fontSize: '20pt', color: '#7A1220', margin: 0 }}>Mithila Jodi</p>
          <p style={{ margin: 0, fontSize: '9pt', color: '#6A5A4E' }}>जहाँ परम्परा मिले, प्रेम से · mithilajodi.com</p>
        </div>
        <div style={{ textAlign: 'right' }}>
          <p style={{ fontFamily: 'Marcellus, serif', fontSize: '14pt', color: '#7A1220', margin: 0 }}>Janam Kundli · जन्म कुण्डली</p>
          <p style={{ margin: 0, fontSize: '9pt', color: '#6A5A4E' }}>Calculated {computed} IST · Methodology v{result.methodologyVersion}</p>
        </div>
      </header>

      <p style={{ fontFamily: 'Marcellus, serif', fontSize: '16pt', margin: '0 0 2px' }}>{chart.name}</p>
      {includeBirthDetails && (
        <p style={{ margin: '0 0 8px', fontSize: '10pt' }}>
          {formatDateLong(chart.birth.localDate)} · {chart.birth.localTime ? `${formatTime12(chart.birth.localTime)} (UTC${chart.birth.utcOffset})` : 'time unknown'} · {chart.birth.placeLabel} ({formatCoords(chart.birth.latitude, chart.birth.longitude)})
        </p>
      )}

      <table className="w-full border-collapse kd-avoid-break" style={{ fontSize: '9.5pt', marginBottom: '8px' }}>
        <tbody>
          <tr>
            <th className={cell}>Lagna</th><td className={cell}>{chart.lagna ? `${rashiOf(chart.lagna.rashi).name} ${formatDegree(chart.lagna.degreeInRashi)}` : 'Not calculated (time unknown)'}</td>
            <th className={cell}>Moon rashi</th><td className={cell}>{rashiOf(chart.moon.rashi).name} (lord {grahaShort(chart.moon.rashiLord)})</td>
          </tr>
          <tr>
            <th className={cell}>Nakshatra</th><td className={cell}>{nakshatraOf(chart.moon.nakshatra).name}{chart.moon.pada ? `, pada ${chart.moon.pada}` : ''} (lord {grahaShort(chart.moon.nakshatraLord)})</td>
            <th className={cell}>Gana · Yoni · Nadi · Varna</th><td className={cell}>{GANA_LABEL[chart.moon.gana]} · {YONI_LABEL[chart.moon.yoni]} · {NADI_LABEL[chart.moon.nadi]} · {VARNA_LABEL[chart.moon.varna]}</td>
          </tr>
          <tr>
            <th className={cell}>Panchang</th>
            <td className={cell} colSpan={3}>{panchang ? `${panchang.tithi.name} · ${panchang.vara.name} · ${nakshatraOf(chart.moon.nakshatra).name} · ${panchang.yoga.name} yoga · ${panchang.karana.name} karana` : 'Needs the birth time'}</td>
          </tr>
          <tr>
            <th className={cell}>Manglik</th><td className={cell}>{manglik.label}</td>
            <th className={cell}>Ayanamsha (Lahiri)</th><td className={cell}>{formatAyanamsha(chart.ayanamsha)}</td>
          </tr>
        </tbody>
      </table>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '10px' }} className="kd-avoid-break">
        <div><p style={{ margin: '0 0 3px', fontSize: '10pt' }}><strong>Lagna Kundli (D1)</strong></p><KundliChart chart={chart} size={240} theme="print" /></div>
        <div><p style={{ margin: '0 0 3px', fontSize: '10pt' }}><strong>Chandra Kundli</strong></p><KundliChart chart={chart} mode="chandra" size={240} theme="print" /></div>
        <div>
          <p style={{ margin: '0 0 3px', fontSize: '10pt' }}><strong>Navamsa (D9)</strong></p>
          {d9First != null ? (
            <NorthIndianChart
              firstRashiIndex={d9First}
              placements={navamsa.planets.filter(p => p.rashiIndex != null).map(p => ({ id: p.id, rashiIndex: p.rashiIndex! }))}
              firstHouseLabel={navamsa.lagnaRashiIndex != null ? 'D9 LAGNA' : 'D9 MOON'}
              description="Navamsa chart"
              size={240}
              theme="print"
            />
          ) : <p style={{ fontSize: '9pt' }}>Needs the birth time.</p>}
        </div>
      </div>

      <h3 style={H}>Planetary positions</h3>
      <table className="w-full border-collapse" style={{ fontSize: '9pt' }}>
        <thead><tr>{['Graha', 'Rashi', 'Degree', 'Nakshatra · pada', chart.timeKnown ? 'House' : 'From Moon', 'Dignity', 'Navamsa'].map(h => <th key={h} className={cell}>{h}</th>)}</tr></thead>
        <tbody>
          {chart.planets.map(p => {
            const d9 = navamsa.planets.find(n => n.id === p.id)!
            const dig = result.dignities.find(d => d.id === p.id)!.dignity
            return (
              <tr key={p.id}>
                <th className={cell}>{grahaShort(p.id)}{p.retrograde && p.id !== 'rahu' && p.id !== 'ketu' ? ' (R)' : ''}</th>
                <td className={cell}>{rashiOf(p.rashi).name}</td>
                <td className={cell}>{formatDegree(p.degreeInRashi)}</td>
                <td className={cell}>{nakshatraOf(p.nakshatra).name} · {p.id === 'moon' && chart.moon.pada == null ? '?' : p.pada}</td>
                <td className={cell}>{chart.timeKnown ? p.house : p.houseFromMoon}</td>
                <td className={cell}>{dig ? DIGNITY_LABEL[dig] : '—'}</td>
                <td className={cell}>{d9.rashiIndex == null ? 'Uncertain' : RASHIS[d9.rashiIndex].name}{d9.vargottama ? ' (Vargottama)' : ''}</td>
              </tr>
            )
          })}
        </tbody>
      </table>

      <section className="kd-avoid-break">
        <h3 style={H}>Vimshottari Mahadasha</h3>
        {dasha ? (
          <>
            <p style={{ margin: '0 0 4px', fontSize: '9.5pt' }}>
              Balance at birth: {grahaShort(dasha.balanceAtBirth.lord)} {dasha.balanceAtBirth.years}y {dasha.balanceAtBirth.months}m {dasha.balanceAtBirth.days}d.
              {cur ? ` Running now: ${grahaShort(cur.maha.lord)} Mahadasha${cur.antar ? `, ${grahaShort(cur.antar.lord)} Antardasha` : ''}.` : ''}
            </p>
            <table className="w-full border-collapse" style={{ fontSize: '9pt' }}>
              <thead><tr><th className={cell}>Mahadasha</th><th className={cell}>From</th><th className={cell}>Until</th></tr></thead>
              <tbody>
                {dasha.mahadashas.map((m, i) => (
                  <tr key={m.lord}><th className={cell}>{grahaShort(m.lord)} ({m.years} y)</th><td className={cell}>{i === 0 ? 'Birth' : dateFmt(m.start)}</td><td className={cell}>{dateFmt(m.end)}</td></tr>
                ))}
              </tbody>
            </table>
          </>
        ) : <p style={{ fontSize: '9.5pt' }}>Not calculated: the dasha needs the exact birth time.</p>}
      </section>

      <section className="kd-avoid-break">
        <h3 style={H}>Manglik</h3>
        <p style={{ margin: 0, fontSize: '9.5pt' }}><strong>{manglik.label}.</strong> {manglik.explanation} {manglik.exceptions.join(' ')}</p>
      </section>

      {(result.warnings.length > 0 || chart.notes.length > 0) && (
        <section className="kd-avoid-break">
          <h3 style={{ ...H, fontSize: '12pt' }}>Notes on precision</h3>
          {[...result.warnings, ...chart.notes].map(w => <p key={w} style={{ margin: '2px 0', fontSize: '9pt' }}>• {w}</p>)}
        </section>
      )}

      <section className="kd-avoid-break" style={{ marginTop: '10px', fontSize: '8.5pt', color: '#4A3B33' }}>
        <h3 style={{ ...H, fontSize: '12pt', margin: '0 0 4px' }}>Methodology v{METHODOLOGY.version}</h3>
        <p style={{ margin: '2px 0' }}>Sidereal zodiac, {METHODOLOGY.ayanamsha.name} ayanamsha; {METHODOLOGY.nodes} {METHODOLOGY.houses} houses. Positions: {METHODOLOGY.ephemeris.library} {METHODOLOGY.ephemeris.libraryVersion}. Time zones: IANA database with historical offsets.</p>
        <p style={{ margin: '2px 0' }}>{METHODOLOGY.janamKundli.navamsa} {METHODOLOGY.janamKundli.dasha}</p>
        <p style={{ margin: '6px 0 0', padding: '6px 8px', border: '1px solid #E4C572' }}>{METHODOLOGY.janamKundli.disclaimer}</p>
      </section>
    </div>
  )
}
