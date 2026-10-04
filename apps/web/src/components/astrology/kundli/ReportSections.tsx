/**
 * Report sections shared by the live result and the public share page.
 * Presentational only — no hooks — so they render on the server too.
 */
import type { KootaResult, ManglikPerson, MoonProfile, PlanetPosition, Role } from '@/lib/astrology/types'
import { GANA_LABEL, NADI_LABEL, VARNA_LABEL, VASHYA_LABEL, YONI_LABEL } from '@/lib/astrology/rules/tables'
import { formatDegree } from '@/lib/astrology/vedic/zodiac'
import { ROLE_HI, ROLE_LABEL, grahaOf, grahaShort, nakshatraOf, points, rashiOf, tone } from './format'

export function SectionTitle({ id, eyebrow, title, children }: { id: string; eyebrow: string; title: string; children?: React.ReactNode }) {
  return (
    <div className="mb-6">
      <p className="eyebrow mb-2">{eyebrow}</p>
      <h2 id={id} className="font-serif text-maroon text-[26px] sm:text-[30px] leading-tight scroll-mt-28">{title}</h2>
      <div className="mt-3 h-px w-16 bg-gradient-to-r from-gold to-transparent" aria-hidden="true" />
      {children && <p className="mt-3 text-ink-soft text-[15px] leading-relaxed max-w-2xl">{children}</p>}
    </div>
  )
}

const TONE_STYLE = {
  full: 'bg-success-soft text-success-fg border-success/30',
  partial: 'bg-warning-soft text-warning-fg border-warning/30',
  zero: 'bg-error-soft text-error-fg border-error/30',
} as const

// ─── Two-chart relationship map ──────────────────────────────────────────────

/** Bride's value — koota and score — groom's value, one row per koota. */
export function RelationshipMap({ kootas, names }: { kootas: KootaResult[]; names: Record<Role, string> }) {
  return (
    <div className="card p-4 sm:p-6 overflow-hidden">
      <div className="grid grid-cols-[1fr_auto_1fr] gap-x-2 sm:gap-x-4 items-end pb-3 mb-2 border-b border-gold/25">
        <p className="text-left"><span className="font-deva text-maroon text-[15px]">{ROLE_HI.bride}</span> <span className="text-[12px] uppercase tracking-[0.14em] text-ink-soft">{names.bride}</span></p>
        <p className="text-[11px] uppercase tracking-[0.16em] text-terra text-center">Koota</p>
        <p className="text-right"><span className="text-[12px] uppercase tracking-[0.14em] text-ink-soft">{names.groom}</span> <span className="font-deva text-maroon text-[15px]">{ROLE_HI.groom}</span></p>
      </div>
      <ul className="divide-y divide-gold/10">
        {kootas.map(k => (
          <li key={k.key} className="kd-link grid grid-cols-[1fr_auto_1fr] gap-x-2 sm:gap-x-4 items-center py-2.5">
            <span className="text-left text-[13px] sm:text-[14px] text-ink leading-snug bg-cream pr-2">{k.bride}</span>
            <span className={`rounded-pill border px-2.5 sm:px-3 py-1 text-center text-[12px] sm:text-[13px] font-semibold whitespace-nowrap ${TONE_STYLE[tone(k.score, k.maxScore)]}`}>
              {k.name} {points(k.score)}/{k.maxScore}
            </span>
            <span className="text-right text-[13px] sm:text-[14px] text-ink leading-snug bg-cream pl-2">{k.groom}</span>
          </li>
        ))}
      </ul>
    </div>
  )
}

// ─── Koota cards ─────────────────────────────────────────────────────────────

export function KootaBreakdown({ kootas }: { kootas: KootaResult[] }) {
  return (
    <ol className="grid gap-3 sm:grid-cols-2">
      {kootas.map((k, i) => {
        const t = tone(k.score, k.maxScore)
        return (
          <li key={k.key} className="card p-4 sm:p-5 kd-avoid-break">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-[11px] uppercase tracking-[0.18em] text-ink-soft">Koota {i + 1} of 8</p>
                <h3 className="font-serif text-maroon text-[20px] leading-tight">{k.name}</h3>
              </div>
              <span className={`shrink-0 rounded-mj-sm border px-3 py-1.5 font-serif text-[20px] leading-none ${TONE_STYLE[t]}`}>
                {points(k.score)}<span className="text-[13px] opacity-70"> / {k.maxScore}</span>
              </span>
            </div>
            <div className="mt-2 h-1.5 rounded-full bg-paper-3 overflow-hidden" aria-hidden="true">
              <div className="h-full rounded-full bg-gradient-to-r from-gold to-maroon" style={{ width: `${(k.score / k.maxScore) * 100}%` }} />
            </div>
            <p className="mt-3 text-[13px] text-ink-soft italic leading-relaxed">{k.measures}</p>
            <dl className="mt-3 grid grid-cols-2 gap-2 text-[13px]">
              <div className="rounded-mj-sm bg-paper px-2.5 py-2"><dt className="text-[11px] uppercase tracking-[0.12em] text-terra">Bride</dt><dd className="text-ink leading-snug">{k.bride}</dd></div>
              <div className="rounded-mj-sm bg-paper px-2.5 py-2"><dt className="text-[11px] uppercase tracking-[0.12em] text-terra">Groom</dt><dd className="text-ink leading-snug">{k.groom}</dd></div>
            </dl>
            <p className="mt-3 text-[14px] text-ink leading-relaxed">{k.explanation}</p>
            {k.dosha && (
              <div className="mt-3 rounded-mj-sm border border-error/25 bg-error-soft/60 px-3 py-2.5">
                <p className="text-[13px] font-semibold text-error-fg">{k.dosha.name}</p>
                {k.dosha.cancellations.length > 0 ? (
                  <>
                    <ul className="mt-1 space-y-1 text-[13px] text-ink">
                      {k.dosha.cancellations.map(c => <li key={c}>• {c}</li>)}
                    </ul>
                    <p className="mt-1.5 text-[12px] text-ink-soft">The score above is unchanged — Mithila Jodi reports cancellations rather than applying them.</p>
                  </>
                ) : (
                  <p className="mt-1 text-[13px] text-ink">None of the classical cancellations checked here apply to this pair.</p>
                )}
              </div>
            )}
          </li>
        )
      })}
    </ol>
  )
}

// ─── Manglik ─────────────────────────────────────────────────────────────────

type ManglikView = Pick<ManglikPerson, 'status' | 'label' | 'marsRashi' | 'marsHouseFromLagna' | 'marsHouseFromMoon' | 'exceptions' | 'explanation'>

const MANGLIK_BADGE: Record<ManglikPerson['status'], string> = {
  yes: 'bg-error-soft text-error-fg border-error/30',
  anshik: 'bg-warning-soft text-warning-fg border-warning/30',
  no: 'bg-success-soft text-success-fg border-success/30',
  incomplete: 'bg-info-soft text-info-fg border-info/30',
}

export function ManglikCards({ people, names, pair }: { people: Record<Role, ManglikView>; names: Record<Role, string>; pair: { summary: string } }) {
  return (
    <div className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2">
        {(['bride', 'groom'] as const).map(role => {
          const p = people[role]
          return (
            <div key={role} className="card p-5 kd-avoid-break">
              <p className="text-[11px] uppercase tracking-[0.18em] text-ink-soft">{ROLE_LABEL[role]} · <span className="normal-case tracking-normal">{names[role]}</span></p>
              <p className={`mt-2 inline-flex rounded-pill border px-3 py-1 text-[13px] font-semibold ${MANGLIK_BADGE[p.status]}`}>{p.label}</p>
              <dl className="mt-4 grid grid-cols-3 gap-2 text-center">
                <div className="rounded-mj-sm bg-paper px-2 py-2"><dt className="text-[10px] uppercase tracking-[0.12em] text-terra">Mars in</dt><dd className="text-[14px] text-ink">{rashiOf(p.marsRashi).name}</dd></div>
                <div className="rounded-mj-sm bg-paper px-2 py-2"><dt className="text-[10px] uppercase tracking-[0.12em] text-terra">From Lagna</dt><dd className="text-[14px] text-ink">{p.marsHouseFromLagna ? `House ${p.marsHouseFromLagna}` : 'Needs time'}</dd></div>
                <div className="rounded-mj-sm bg-paper px-2 py-2"><dt className="text-[10px] uppercase tracking-[0.12em] text-terra">From Moon</dt><dd className="text-[14px] text-ink">House {p.marsHouseFromMoon}</dd></div>
              </dl>
              <p className="mt-3 text-[14px] text-ink leading-relaxed">{p.explanation}</p>
              {p.exceptions.length > 0 && (
                <ul className="mt-3 space-y-1 rounded-mj-sm bg-paper-2 px-3 py-2.5 text-[13px] text-ink">
                  {p.exceptions.map(e => <li key={e}>• {e}</li>)}
                </ul>
              )}
            </div>
          )
        })}
      </div>
      <div className="rounded-mj border border-gold/30 bg-paper-2/60 px-5 py-4">
        <p className="text-[11px] uppercase tracking-[0.18em] text-terra mb-1">Both charts together</p>
        <p className="text-[15px] text-ink leading-relaxed">{pair.summary}</p>
      </div>
    </div>
  )
}

// ─── Rashi & Nakshatra ───────────────────────────────────────────────────────

type MoonView = Pick<MoonProfile, 'rashi' | 'rashiLord' | 'nakshatra' | 'nakshatraLord' | 'varna' | 'vashya' | 'yoni' | 'gana' | 'nadi'> &
  Partial<Pick<MoonProfile, 'degreeInRashi' | 'pada' | 'range'>>

export function MoonProfiles({ moons, names, showDegrees }: { moons: Record<Role, MoonView>; names: Record<Role, string>; showDegrees: boolean }) {
  const rows: Array<[string, (m: MoonView) => React.ReactNode]> = [
    ['Moon rashi', m => <><span className="font-deva text-maroon">{rashiOf(m.rashi).hi}</span> {rashiOf(m.rashi).name} <span className="text-ink-soft">({rashiOf(m.rashi).western})</span></>],
    ['Rashi lord', m => grahaShort(m.rashiLord)],
    ...(showDegrees ? [['Moon degree', (m: MoonView) => (m.range ? `${formatDegree(m.degreeInRashi ?? 0)} (approx. — birth time unknown)` : formatDegree(m.degreeInRashi ?? 0))] as [string, (m: MoonView) => React.ReactNode]] : []),
    ['Nakshatra', m => <><span className="font-deva text-maroon">{nakshatraOf(m.nakshatra).hi}</span> {nakshatraOf(m.nakshatra).name}</>],
    ['Nakshatra lord', m => grahaShort(m.nakshatraLord)],
    ...(showDegrees ? [['Pada', (m: MoonView) => (m.pada ? String(m.pada) : 'Uncertain without birth time')] as [string, (m: MoonView) => React.ReactNode]] : []),
    ['Gana', m => GANA_LABEL[m.gana]],
    ['Yoni', m => YONI_LABEL[m.yoni]],
    ['Nadi', m => NADI_LABEL[m.nadi]],
    ['Varna', m => VARNA_LABEL[m.varna]],
    ['Vashya', m => VASHYA_LABEL[m.vashya]],
  ]
  return (
    <div className="card overflow-x-auto">
      <table className="w-full min-w-[520px] text-[14px]">
        <caption className="sr-only">Moon rashi, nakshatra and Ashtakoota attributes for both people</caption>
        <thead>
          <tr className="border-b border-gold/25 text-left">
            <th scope="col" className="px-4 py-3 text-[11px] uppercase tracking-[0.16em] text-terra font-semibold w-[30%]">Attribute</th>
            <th scope="col" className="px-4 py-3 font-serif text-maroon text-[16px] font-normal">{names.bride}</th>
            <th scope="col" className="px-4 py-3 font-serif text-maroon text-[16px] font-normal">{names.groom}</th>
          </tr>
        </thead>
        <tbody>
          {rows.map(([label, render]) => (
            <tr key={label} className="border-b border-gold/10 last:border-0">
              <th scope="row" className="px-4 py-2.5 text-left font-medium text-ink-soft">{label}</th>
              <td className="px-4 py-2.5 text-ink">{render(moons.bride)}</td>
              <td className="px-4 py-2.5 text-ink">{render(moons.groom)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

// ─── Planet table ────────────────────────────────────────────────────────────

export function PlanetTable({ planets, timeKnown }: { planets: PlanetPosition[]; timeKnown: boolean }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[480px] text-[13px]">
        <thead>
          <tr className="border-b border-gold/30 text-left text-[11px] uppercase tracking-[0.12em] text-terra">
            <th scope="col" className="py-2 pr-2 font-semibold">Planet</th>
            <th scope="col" className="py-2 pr-2 font-semibold">Rashi</th>
            <th scope="col" className="py-2 pr-2 font-semibold">Degree</th>
            <th scope="col" className="py-2 pr-2 font-semibold">Nakshatra · Pada</th>
            <th scope="col" className="py-2 pr-2 font-semibold">{timeKnown ? 'House' : 'From Moon'}</th>
          </tr>
        </thead>
        <tbody>
          {planets.map(p => (
            <tr key={p.id} className="border-b border-gold/10 last:border-0">
              <th scope="row" className="py-1.5 pr-2 text-left font-medium text-ink">
                {grahaShort(p.id)} <span className="font-deva text-ink-soft font-normal">{grahaOf(p.id).hi}</span>
                {p.retrograde && p.id !== 'rahu' && p.id !== 'ketu' && <span className="ml-1 text-[11px] text-terra" title="Retrograde">(R)</span>}
              </th>
              <td className="py-1.5 pr-2 text-ink">{rashiOf(p.rashi).name}</td>
              <td className="py-1.5 pr-2 text-ink tabular-nums">{formatDegree(p.degreeInRashi)}</td>
              <td className="py-1.5 pr-2 text-ink">{nakshatraOf(p.nakshatra).name} · {p.pada}</td>
              <td className="py-1.5 pr-2 text-ink">{timeKnown ? p.house : p.houseFromMoon}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

export function Disclaimer({ text }: { text: string }) {
  return (
    <div className="rounded-mj border border-gold/30 bg-paper-2/70 px-5 py-4 kd-avoid-break">
      <p className="text-[11px] uppercase tracking-[0.18em] text-terra mb-1">Please read</p>
      <p className="text-[14px] text-ink leading-relaxed">{text}</p>
    </div>
  )
}
