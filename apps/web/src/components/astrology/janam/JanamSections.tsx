/**
 * Janam Kundli report sections. Presentational; the dasha timeline reads the
 * current date, so the report that uses it is rendered client-side only.
 */
import type { JanamKundliResult } from '@/lib/astrology/types'
import { GANA_LABEL, NADI_LABEL, VARNA_LABEL, VASHYA_LABEL, YONI_LABEL } from '@/lib/astrology/rules/tables'
import { DIGNITY_LABEL } from '@/lib/astrology/vedic/divisions'
import { RASHIS, formatDegree } from '@/lib/astrology/vedic/zodiac'
import { grahaOf, grahaShort, nakshatraOf, rashiOf } from '../kundli/format'

const YEAR_MS = 365.25 * 86_400_000
const dateFmt = (iso: string) =>
  new Date(iso).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric', timeZone: 'Asia/Kolkata' })

export function currentMahadasha(result: JanamKundliResult, nowMs: number) {
  const d = result.dasha
  if (!d) return null
  const maha = d.mahadashas.find(m => Date.parse(m.start) <= nowMs && nowMs < Date.parse(m.end)) ?? null
  const antar = maha?.antardashas?.find(a => Date.parse(a.start) <= nowMs && nowMs < Date.parse(a.end)) ?? null
  return maha ? { maha, antar } : null
}

// ─── At a glance ─────────────────────────────────────────────────────────────

export function AtAGlance({ result, nowMs }: { result: JanamKundliResult; nowMs: number }) {
  const { chart, panchang, manglik } = result
  const sun = chart.planets.find(p => p.id === 'sun')!
  const cur = currentMahadasha(result, nowMs)
  const tiles: Array<[string, React.ReactNode, string?]> = [
    ['Lagna', chart.lagna ? <><span className="font-deva">{rashiOf(chart.lagna.rashi).hi}</span> {rashiOf(chart.lagna.rashi).name}</> : 'Needs birth time', chart.lagna ? formatDegree(chart.lagna.degreeInRashi) : undefined],
    ['Moon rashi', <><span className="font-deva">{rashiOf(chart.moon.rashi).hi}</span> {rashiOf(chart.moon.rashi).name}</>, `Lord ${grahaShort(chart.moon.rashiLord)}`],
    ['Nakshatra', nakshatraOf(chart.moon.nakshatra).name, chart.moon.pada ? `Pada ${chart.moon.pada} · lord ${grahaShort(chart.moon.nakshatraLord)}` : `Lord ${grahaShort(chart.moon.nakshatraLord)}`],
    ['Sun rashi', rashiOf(sun.rashi).name, 'Sidereal'],
    ['Manglik', manglik.label, undefined],
    ['Tithi', panchang ? panchang.tithi.name : 'Needs birth time', panchang ? panchang.vara.name.split(' ')[0] : undefined],
    ['Mahadasha now', cur ? `${grahaShort(cur.maha.lord)}` : result.dasha ? '—' : 'Needs birth time', cur ? `until ${dateFmt(cur.maha.end)}` : undefined],
  ]
  return (
    <dl className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-2.5">
      {tiles.map(([label, value, sub]) => (
        <div key={label} className="rounded-mj-sm border border-gold/25 bg-cosmic-mid/80 px-3 py-2.5 text-center">
          <dt className="text-[10px] uppercase tracking-[0.16em] text-gold-lt/80">{label}</dt>
          <dd className="mt-1 font-serif text-[17px] leading-tight text-cream">{value}</dd>
          {sub && <dd className="mt-0.5 text-[11px] text-paper-3/70">{sub}</dd>}
        </div>
      ))}
    </dl>
  )
}

// ─── Planet table ────────────────────────────────────────────────────────────

export function JanamPlanetTable({ result }: { result: JanamKundliResult }) {
  const { chart, navamsa, dignities } = result
  return (
    <div className="card overflow-x-auto">
      <table className="w-full min-w-[720px] text-[13.5px]">
        <caption className="sr-only">Sidereal positions of the nine grahas</caption>
        <thead>
          <tr className="border-b border-gold/30 text-left text-[11px] uppercase tracking-[0.12em] text-terra">
            {['Graha', 'Rashi', 'Degree', 'Nakshatra · Pada', 'Nakshatra lord', chart.timeKnown ? 'House' : 'From Moon', 'Dignity', 'Navamsa'].map(h => (
              <th key={h} scope="col" className="px-3 py-2.5 font-semibold">{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {chart.planets.map(p => {
            const d9 = navamsa.planets.find(n => n.id === p.id)!
            const dig = dignities.find(d => d.id === p.id)!.dignity
            return (
              <tr key={p.id} className="border-b border-gold/10 last:border-0">
                <th scope="row" className="px-3 py-2 text-left font-medium text-ink whitespace-nowrap">
                  {grahaShort(p.id)} <span className="font-deva text-ink-soft font-normal">{grahaOf(p.id).hi}</span>
                  {p.retrograde && p.id !== 'rahu' && p.id !== 'ketu' && <span className="ml-1 text-[11px] text-terra">(R)</span>}
                </th>
                <td className="px-3 py-2 text-ink">{rashiOf(p.rashi).name}</td>
                <td className="px-3 py-2 text-ink tabular-nums">{p.id === 'moon' && chart.moon.range ? `${formatDegree(p.degreeInRashi)} ≈` : formatDegree(p.degreeInRashi)}</td>
                <td className="px-3 py-2 text-ink">{nakshatraOf(p.nakshatra).name} · {p.id === 'moon' && chart.moon.pada == null ? '?' : p.pada}</td>
                <td className="px-3 py-2 text-ink">{grahaShort(nakshatraOf(p.nakshatra).lord)}</td>
                <td className="px-3 py-2 text-ink">{chart.timeKnown ? p.house : p.houseFromMoon}</td>
                <td className="px-3 py-2 text-ink">{dig ? DIGNITY_LABEL[dig] : '—'}</td>
                <td className="px-3 py-2 text-ink">
                  {d9.rashiIndex == null ? 'Uncertain' : RASHIS[d9.rashiIndex].name}
                  {d9.vargottama && <span className="ml-1.5 rounded-pill bg-gold/15 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-gold">Vargottama</span>}
                </td>
              </tr>
            )
          })}
          {chart.lagna && (
            <tr className="bg-paper-2/50">
              <th scope="row" className="px-3 py-2 text-left font-medium text-ink">Lagna</th>
              <td className="px-3 py-2 text-ink">{rashiOf(chart.lagna.rashi).name}</td>
              <td className="px-3 py-2 text-ink tabular-nums">{formatDegree(chart.lagna.degreeInRashi)}</td>
              <td className="px-3 py-2 text-ink">{nakshatraOf(chart.lagna.nakshatra).name} · {chart.lagna.pada}</td>
              <td className="px-3 py-2 text-ink">{grahaShort(nakshatraOf(chart.lagna.nakshatra).lord)}</td>
              <td className="px-3 py-2 text-ink">1</td>
              <td className="px-3 py-2 text-ink">—</td>
              <td className="px-3 py-2 text-ink">{navamsa.lagnaRashiIndex != null ? RASHIS[navamsa.lagnaRashiIndex].name : '—'}</td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  )
}

// ─── Moon attributes ─────────────────────────────────────────────────────────

export function MoonAttributes({ result }: { result: JanamKundliResult }) {
  const m = result.chart.moon
  const rows: Array<[string, React.ReactNode]> = [
    ['Janma rashi', <><span className="font-deva text-maroon">{rashiOf(m.rashi).hi}</span> {rashiOf(m.rashi).name} ({rashiOf(m.rashi).western}) · lord {grahaShort(m.rashiLord)}</>],
    ['Janma nakshatra', <><span className="font-deva text-maroon">{nakshatraOf(m.nakshatra).hi}</span> {nakshatraOf(m.nakshatra).name}{m.pada ? `, pada ${m.pada}` : ' (pada uncertain without birth time)'} · lord {grahaShort(m.nakshatraLord)}</>],
    ['Gana', GANA_LABEL[m.gana]],
    ['Yoni', YONI_LABEL[m.yoni]],
    ['Nadi', NADI_LABEL[m.nadi]],
    ['Varna', VARNA_LABEL[m.varna]],
    ['Vashya', VASHYA_LABEL[m.vashya]],
  ]
  return (
    <div className="card overflow-hidden">
      <dl className="divide-y divide-gold/10">
        {rows.map(([k, v]) => (
          <div key={k} className="grid grid-cols-[minmax(0,9rem)_1fr] gap-3 px-4 py-2.5 text-[14px]">
            <dt className="text-ink-soft font-medium">{k}</dt>
            <dd className="text-ink">{v}</dd>
          </div>
        ))}
      </dl>
    </div>
  )
}

// ─── Panchang at birth ───────────────────────────────────────────────────────

export function PanchangCard({ result }: { result: JanamKundliResult }) {
  const p = result.panchang
  if (!p) {
    return (
      <p className="rounded-mj-sm bg-info-soft text-info-fg px-4 py-3 text-[14px] max-w-3xl">
        Tithi, yoga, karana and vara all change during the day, so they need the birth time. The nakshatra above is
        what the date fixes.
      </p>
    )
  }
  const tz = result.chart.birth.timezone
  const sunrise = p.sunrise ? new Date(p.sunrise).toLocaleTimeString('en-IN', { hour: 'numeric', minute: '2-digit', timeZone: tz }) : null
  const items: Array<[string, string, string]> = [
    ['Tithi', p.tithi.name, `${p.tithi.paksha === 'shukla' ? 'Shukla' : 'Krishna'} paksha, tithi ${((p.tithi.number - 1) % 15) + 1} of 15`],
    ['Vara', p.vara.name, p.vara.beforeSunrise ? 'Born before sunrise, so the previous day’s vara' : `Lord ${grahaShort(p.vara.lord)}`],
    ['Nakshatra', nakshatraOf(result.chart.moon.nakshatra).name, `Lord ${grahaShort(result.chart.moon.nakshatraLord)}`],
    ['Yoga', p.yoga.name, `Yoga ${p.yoga.number} of 27`],
    ['Karana', p.karana.name, 'Half of the tithi'],
  ]
  return (
    <div>
      <div className="grid gap-3 grid-cols-2 sm:grid-cols-5">
        {items.map(([k, v, sub]) => (
          <div key={k} className="card px-4 py-3">
            <p className="text-[11px] uppercase tracking-[0.16em] text-terra">{k}</p>
            <p className="mt-1 font-serif text-maroon text-[18px] leading-tight">{v}</p>
            <p className="mt-1 text-[12px] text-ink-soft">{sub}</p>
          </div>
        ))}
      </div>
      {sunrise && <p className="mt-3 text-[13px] text-ink-soft">Sunrise at the birthplace that day: {sunrise}.</p>}
    </div>
  )
}

// ─── Vimshottari dasha ───────────────────────────────────────────────────────

const BAR = ['#7A1220', '#B98A2E', '#9B2233', '#D6A83C', '#5A0E19', '#E4C572', '#B34A24', '#E8912A', '#2E3A6E']

export function DashaTimeline({ result, nowMs }: { result: JanamKundliResult; nowMs: number }) {
  const d = result.dasha
  if (!d) {
    return (
      <p className="rounded-mj-sm bg-info-soft text-info-fg px-4 py-3 text-[14px] max-w-3xl">
        The Vimshottari dasha starts from the exact position of the Moon within its nakshatra, which moves about half a
        degree an hour. Without a birth time the starting balance — and every date after it — could be off by many
        months, so the dasha is not shown.
      </p>
    )
  }
  const birth = Date.parse(result.chart.birth.calculatedAtUtc)
  const end = Date.parse(d.mahadashas[8].end)
  const span = end - birth
  const cur = currentMahadasha(result, nowMs)
  const nowFrac = Math.max(0, Math.min(1, (nowMs - birth) / span))
  const age = (iso: string) => Math.max(0, (Date.parse(iso) - birth) / YEAR_MS)

  return (
    <div className="space-y-5">
      <p className="text-[15px] text-ink leading-relaxed max-w-3xl">
        At birth the Moon was in {nakshatraOf(result.chart.moon.nakshatra).name}, ruled by {grahaShort(d.balanceAtBirth.lord)}, so life began in
        the {grahaShort(d.balanceAtBirth.lord)} Mahadasha with {d.balanceAtBirth.years} years, {d.balanceAtBirth.months} months and{' '}
        {d.balanceAtBirth.days} days of it remaining.
      </p>

      <div className="relative" role="img" aria-label={`Mahadasha timeline from birth: ${d.mahadashas.map(m => `${grahaShort(m.lord)} until age ${age(m.end).toFixed(1)}`).join(', ')}`}>
        <div className="flex h-11 overflow-hidden rounded-mj-sm border border-gold/30">
          {d.mahadashas.map((m, i) => {
            const from = Math.max(birth, Date.parse(m.start))
            const w = ((Date.parse(m.end) - from) / span) * 100
            return (
              <div key={m.lord} className="flex items-center justify-center text-[11px] font-semibold text-cream border-r border-cream/40 last:border-0" style={{ width: `${w}%`, background: BAR[i] }} title={`${grahaShort(m.lord)}: ${dateFmt(m.start)} – ${dateFmt(m.end)}`}>
                {w > 4 ? grahaOf(m.lord).abbr : ''}
              </div>
            )
          })}
        </div>
        {nowMs > birth && nowMs < end && (
          <div className="absolute -top-2 bottom-[-8px] w-0.5 bg-ink" style={{ left: `${nowFrac * 100}%` }}>
            <span className="absolute -top-5 left-1/2 -translate-x-1/2 text-[10px] font-semibold uppercase tracking-wider text-ink whitespace-nowrap">Now</span>
          </div>
        )}
        <div className="mt-1.5 flex justify-between text-[11px] text-ink-soft"><span>Birth</span><span>Age 120</span></div>
      </div>

      <div className="card overflow-x-auto">
        <table className="w-full min-w-[520px] text-[14px]">
          <thead>
            <tr className="border-b border-gold/30 text-left text-[11px] uppercase tracking-[0.12em] text-terra">
              <th scope="col" className="px-4 py-2.5 font-semibold">Mahadasha</th>
              <th scope="col" className="px-4 py-2.5 font-semibold">From</th>
              <th scope="col" className="px-4 py-2.5 font-semibold">Until</th>
              <th scope="col" className="px-4 py-2.5 font-semibold">Age</th>
            </tr>
          </thead>
          <tbody>
            {d.mahadashas.map((m, i) => {
              const isNow = cur?.maha.lord === m.lord && cur.maha.start === m.start
              return (
                <tr key={m.lord} className={`border-b border-gold/10 last:border-0 align-top ${isNow ? 'bg-gold/10' : ''}`}>
                  <th scope="row" className="px-4 py-2.5 text-left font-medium text-ink">
                    <details open={isNow}>
                      <summary className="cursor-pointer">
                        {grahaShort(m.lord)} <span className="text-ink-soft font-normal">· {m.years} years</span>
                        {isNow && <span className="ml-2 rounded-pill bg-maroon px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-cream">Now</span>}
                      </summary>
                      <ul className="mt-2 mb-1 space-y-1 text-[12.5px] font-normal">
                        {m.antardashas!.map(a => {
                          const antarNow = isNow && cur?.antar?.lord === a.lord && cur.antar.start === a.start
                          return (
                            <li key={a.lord} className={antarNow ? 'text-maroon font-semibold' : 'text-ink-soft'}>
                              {grahaShort(m.lord)}–{grahaShort(a.lord)}: {dateFmt(a.start)} – {dateFmt(a.end)}{antarNow ? ' (now)' : ''}
                            </li>
                          )
                        })}
                      </ul>
                    </details>
                  </th>
                  <td className="px-4 py-2.5 text-ink whitespace-nowrap">{i === 0 ? `Birth (${dateFmt(result.chart.birth.calculatedAtUtc)})` : dateFmt(m.start)}</td>
                  <td className="px-4 py-2.5 text-ink whitespace-nowrap">{dateFmt(m.end)}</td>
                  <td className="px-4 py-2.5 text-ink whitespace-nowrap tabular-nums">{age(m.start).toFixed(1)}–{age(m.end).toFixed(1)}</td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
      <p className="text-[13px] text-ink-soft max-w-3xl">
        Open any Mahadasha to see its nine Antardashas. Dates use years of 365.25 days; some panchangs use other year
        lengths, so dates elsewhere can differ by days or weeks over a long period.
      </p>
    </div>
  )
}
