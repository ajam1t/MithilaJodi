'use client'

import Link from 'next/link'
import { METHODOLOGY } from '@/lib/astrology/methodology'
import type { ChartData, CompatibilityResult, Role } from '@/lib/astrology/types'
import type { Contact, HouseClass, SignRelation } from '@/lib/astrology/rules/compatibility'
import { ordinal } from '@/lib/astrology/rules/manglik'
import { RASHIS } from '@/lib/astrology/vedic/zodiac'
import { KundliChart, NorthIndianChart } from '../kundli/KundliChart'
import { Disclaimer, ManglikCards, RelationshipMap, SectionTitle } from '../kundli/ReportSections'
import type { PairReportProps } from '../pair/PairChartExperience'
import { carryPair } from '../single/carry'
import { formatDateLong, formatTime12, grahaShort, points } from '../kundli/format'

const ROLES = ['bride', 'groom'] as const
const other = (r: Role): Role => (r === 'bride' ? 'groom' : 'bride')
const sign = (i: number) => `${RASHIS[i].name}`

const CLASS_LABEL: Record<HouseClass, string> = {
  kendra: 'kendra (angular)', trikona: 'trikona (trine)', dusthana: 'dusthana (6/8/12)', upachaya: 'upachaya (growth)',
}
const classes = (c: HouseClass[]) => (c.length ? c.map(k => CLASS_LABEL[k]).join(', ') : 'none of the four groups')

const LORD_WORD = { friend: 'a friend', neutral: 'neutral', enemy: 'an enemy', same: 'the same planet' } as const

function relationText(r: SignRelation, a: string, b: string) {
  if (r.label === 'same') return `Both are ${sign(r.a)}, the same sign.`
  const counting = `${ordinal(r.aToB)} from ${a}’s, ${ordinal(r.bToA)} the other way (${r.label})`
  const lords = r.lords.aToB === 'same'
    ? 'both signs share a lord'
    : `${grahaShort(RASHIS[r.a].lord)} regards ${grahaShort(RASHIS[r.b].lord)} as ${LORD_WORD[r.lords.aToB]}; ${grahaShort(RASHIS[r.b].lord)} regards ${grahaShort(RASHIS[r.a].lord)} as ${LORD_WORD[r.lords.bToA]}`
  return `${sign(r.a)} and ${sign(r.b)}: ${b}’s is ${counting}. ${lords[0].toUpperCase()}${lords.slice(1)}.`
}

const TARGET: Record<Contact['target'], string> = { moon: 'Moon', lagna: 'Lagna', seventh: '7th house' }

const openInKundliMatch = (request: PairReportProps<CompatibilityResult>['request']) =>
  carryPair('kundli-match', { bride: request.bride, groom: request.groom })

export function CompatibilityReport({ result, request, onEdit, onNew }: PairReportProps<CompatibilityResult>) {
  const { match: m, comparison: c } = result
  const charts: Record<Role, ChartData> = { bride: m.bride, groom: m.groom }
  const names = { bride: m.bride.name, groom: m.groom.name }
  const bothTimes = m.bride.lagna != null && m.groom.lagna != null

  // Only facts the Kundli Match rules already establish go in the summary.
  const supportive: string[] = []
  const discuss: string[] = []
  ;(m.total >= 18 ? supportive : discuss).push(`${points(m.total)} of 36 Guna — ${m.band.label.toLowerCase()}.`)
  for (const k of m.kootas) {
    if (!k.dosha) continue
    discuss.push(
      `${k.dosha.name}${k.dosha.cancellations.length ? ` — a classical cancellation is noted: ${k.dosha.cancellations.join('; ')}` : ''}.`,
    )
  }
  const full = m.kootas.filter(k => k.score >= k.maxScore).map(k => k.name)
  if (full.length) supportive.push(`Full marks in ${full.join(', ')}.`)
  const mg = m.manglik
  const statuses = [mg.bride.status, mg.groom.status]
  if (statuses.includes('incomplete')) discuss.push('Manglik status is incomplete for a person whose birth time is unknown.')
  else if (statuses.every(s => s === 'no')) supportive.push('Neither chart is Manglik.')
  else if (statuses.every(s => s !== 'no')) supportive.push('Both charts carry Manglik — traditionally considered to balance each other.')
  else discuss.push('Only one chart is Manglik or Anshik Manglik.')

  return (
    <div className="space-y-12">
      <section className="kd-cosmic rounded-mj-lg overflow-hidden border border-gold/25" aria-labelledby="kd-result-title">
        <div className="kd-stars" aria-hidden="true" />
        <div className="relative px-4 py-7 sm:px-8 sm:py-9">
          <p className="text-[11px] uppercase tracking-[0.3em] text-terra">Compatibility · {names.bride} &amp; {names.groom}</p>
          <h2 id="kd-result-title" tabIndex={-1} className="mt-3 outline-none font-serif text-maroon text-[30px] sm:text-[40px] leading-tight">
            {points(m.total)} <span className="text-terra">/ 36 Guna</span>
            <span className="block text-[18px] sm:text-[20px] text-ink mt-1">{m.band.label}</span>
          </h2>
          <dl className="mt-5 grid grid-cols-2 lg:grid-cols-4 gap-2.5">
            {([
              ['Manglik', `${mg.bride.label} · ${mg.groom.label}`],
              ['Lagnas', c.lagna ? `${sign(c.lagna.a)} · ${sign(c.lagna.b)} (${c.lagna.label})` : 'Needs both birth times'],
              ['Moon signs', `${RASHIS[m.bride.moon.rashiIndex].name} · ${RASHIS[m.groom.moon.rashiIndex].name}`],
              ['Cross-chart contacts', `${c.contacts.length} found`],
            ] as const).map(([k, v]) => (
              <div key={k} className="rounded-mj-sm border border-gold/25 bg-white/75 px-3 py-2.5">
                <dt className="text-[10px] uppercase tracking-[0.16em] text-terra">{k}</dt>
                <dd className="mt-1 font-serif text-[15px] leading-tight text-maroon">{v}</dd>
              </div>
            ))}
          </dl>
          <div className="mt-6 grid gap-4 md:grid-cols-2">
            <div className="rounded-mj border border-success/40 bg-white/75 px-4 py-3.5">
              <h3 className="text-[12px] uppercase tracking-[0.16em] text-success-fg font-semibold">In the pair’s favour</h3>
              <ul className="mt-2 space-y-1.5 text-[14px] text-ink leading-relaxed">
                {supportive.length ? supportive.map(s => <li key={s}>✦ {s}</li>) : <li>Nothing the Ashtakoota and Manglik rules mark as favourable.</li>}
              </ul>
            </div>
            <div className="rounded-mj border border-marigold/50 bg-white/75 px-4 py-3.5">
              <h3 className="text-[12px] uppercase tracking-[0.16em] text-terra font-semibold">To discuss with a pandit</h3>
              <ul className="mt-2 space-y-1.5 text-[14px] text-ink leading-relaxed">
                {discuss.length ? discuss.map(s => <li key={s}>✦ {s}</li>) : <li>No dosha under the Ashtakoota and Manglik rules.</li>}
              </ul>
            </div>
          </div>
          <p className="mt-4 text-[13px] text-ink-soft max-w-3xl">
            This summary uses only the Ashtakoota and Manglik rules. The further factors below are shown for a pandit to
            weigh, and are never added into a score.
          </p>
        </div>
        <div className="kd-mithila-strip" aria-hidden="true" />
      </section>

      {m.warnings.length > 0 && (
        <div className="rounded-mj border border-warning/40 bg-warning-soft px-5 py-4 max-w-3xl">
          <p className="text-[12px] uppercase tracking-[0.16em] text-warning-fg font-semibold mb-1.5">Please note</p>
          <ul className="space-y-1.5 text-[14px] text-ink leading-relaxed">{m.warnings.map(w => <li key={w}>{w}</li>)}</ul>
        </div>
      )}

      <section aria-labelledby="cp-guna">
        <SectionTitle id="cp-guna" eyebrow="1 · Ashtakoota and Manglik" title="The foundation: Kundli Match">
          Exactly the result of the Kundli Match tool — same engine, same tables.
        </SectionTitle>
        <RelationshipMap kootas={m.kootas} names={names} />
        <div className="mt-6"><ManglikCards people={mg} names={names} pair={mg.pair} /></div>
        <p className="mt-4 text-[14px]">
          <button type="button" className="text-maroon underline underline-offset-2" onClick={() => openInKundliMatch(request)}>
            Open the full Kundli Match report — every koota explained, PDF and share link
          </button>
        </p>
      </section>

      <section aria-labelledby="cp-lagna">
        <SectionTitle id="cp-lagna" eyebrow="2 · Lagna and the 7th house" title="The rising signs and the house of marriage">
          The 7th house, counted from the Lagna, is the classical house of marriage. Where its lord sits is one of the
          first things a pandit looks at.
        </SectionTitle>
        {c.lagna && <p className="mb-4 max-w-3xl text-[15px] text-ink leading-relaxed">{relationText(c.lagna, names.bride, names.groom)}</p>}
        <div className="grid gap-4 md:grid-cols-2">
          {ROLES.map(r => {
            const s = c.seventhLord[r]
            return (
              <div key={r} className="card p-5">
                <h3 className="font-serif text-maroon text-[19px]">{names[r]}</h3>
                {s ? (
                  <dl className="mt-2 space-y-1.5 text-[14px] text-ink">
                    <div><dt className="inline text-ink-soft">Lagna: </dt><dd className="inline">{sign(charts[r].lagna!.rashiIndex)}</dd></div>
                    <div><dt className="inline text-ink-soft">7th house: </dt><dd className="inline">{sign(s.seventhSign)}, ruled by {grahaShort(s.lord)}</dd></div>
                    <div>
                      <dt className="inline text-ink-soft">{grahaShort(s.lord)} sits in: </dt>
                      <dd className="inline">{sign(s.lordSign)}, the {ordinal(s.lordHouse)} house — {classes(s.classes)}</dd>
                    </div>
                  </dl>
                ) : (
                  <p className="mt-2 text-[14px] text-ink-soft">The Lagna and 7th house need the birth time.</p>
                )}
              </div>
            )
          })}
        </div>
      </section>

      <section aria-labelledby="cp-d9">
        <SectionTitle id="cp-d9" eyebrow="3 · Navamsa (D9)" title="The marriage chart">
          The Navamsa is the divisional chart traditionally read for marriage. The D9 Lagna needs the birth time; the D9
          Moon needs the Moon’s pada to be certain.
        </SectionTitle>
        <div className="card overflow-x-auto">
          <table className="w-full min-w-[420px] text-[14px]">
            <thead>
              <tr className="border-b border-gold/20 text-left text-ink-soft">
                <th scope="col" className="px-4 py-2.5 font-medium">Navamsa of</th>
                {ROLES.map(r => <th key={r} scope="col" className="px-4 py-2.5 font-medium">{names[r]}</th>)}
              </tr>
            </thead>
            <tbody>
              {(['lagna', 'moon', 'venus'] as const).map(k => (
                <tr key={k} className="border-b border-gold/10 last:border-0">
                  <th scope="row" className="px-4 py-2.5 text-left font-medium text-ink">{k === 'lagna' ? 'Lagna' : grahaShort(k)}</th>
                  {ROLES.map(r => {
                    const v = c.navamsa[r][k]
                    return <td key={r} className="px-4 py-2.5 text-ink">{v == null ? <span className="text-ink-soft">—</span> : sign(v)}</td>
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <ul className="mt-4 max-w-3xl space-y-2 text-[15px] text-ink leading-relaxed">
          {c.navamsa.lagnaRelation && <li><strong>D9 Lagnas.</strong> {relationText(c.navamsa.lagnaRelation, names.bride, names.groom)}</li>}
          {c.navamsa.moonRelation && <li><strong>D9 Moons.</strong> {relationText(c.navamsa.moonRelation, names.bride, names.groom)}</li>}
        </ul>
      </section>

      <section aria-labelledby="cp-cross">
        <SectionTitle id="cp-cross" eyebrow="4 · In each other’s charts" title="Where one person’s Moon, Venus and Jupiter fall in the other’s chart">
          Counted from the partner’s Lagna. Kendras (1, 4, 7, 10) and trikonas (1, 5, 9) are traditionally the strong
          houses; dusthanas (6, 8, 12) the difficult ones.
        </SectionTitle>
        <div className="grid gap-5 md:grid-cols-2">
          {ROLES.map(from => {
            const to = other(from)
            const rows = c.cross.filter(x => x.from === from)
            const host = charts[to]
            return (
              <div key={from} className="card p-4 sm:p-5">
                <h3 className="font-serif text-maroon text-[19px]">{names[from]}’s planets in {names[to]}’s chart</h3>
                {host.lagna ? (
                  <>
                    <div className="mx-auto max-w-[300px] mt-2">
                      <NorthIndianChart
                        firstRashiIndex={host.lagna.rashiIndex}
                        firstHouseLabel="LAGNA"
                        size={300}
                        placements={rows.map(x => ({ id: x.planet, rashiIndex: x.sign, retrograde: false }))}
                        description={`${names[to]}’s houses from Lagna ${sign(host.lagna.rashiIndex)}, with ${names[from]}’s Moon, Venus and Jupiter`}
                      />
                    </div>
                    <ul className="mt-3 space-y-1 text-[14px] text-ink">
                      {rows.map(x => (
                        <li key={x.planet}><strong>{grahaShort(x.planet)}</strong> in {sign(x.sign)} — {names[to]}’s {ordinal(x.house!)} house, {classes(x.classes)}</li>
                      ))}
                    </ul>
                  </>
                ) : (
                  <p className="mt-2 text-[14px] text-ink-soft">Needs {names[to]}’s birth time, to know the houses.</p>
                )}
              </div>
            )
          })}
        </div>
      </section>

      <section aria-labelledby="cp-aspects">
        <SectionTitle id="cp-aspects" eyebrow="5 · Aspects across the charts" title="Which planets touch the partner’s Moon, Lagna and 7th house">
          Whole-sign drishti: Jupiter and Venus are benefic, Saturn and Mars malefic. Each aspects the 7th sign from
          itself; Mars also the 4th and 8th, Jupiter the 5th and 9th, Saturn the 3rd and 10th.
          {!bothTimes && ' Without a birth time only the Moon can be a target.'}
        </SectionTitle>
        <div className="grid gap-4 md:grid-cols-2">
          {ROLES.map(from => {
            const list = c.contacts.filter(k => k.from === from)
            return (
              <div key={from} className="card p-5">
                <h3 className="font-serif text-maroon text-[19px]">From {names[from]}’s chart to {names[other(from)]}’s</h3>
                {list.length ? (
                  <ul className="mt-2 space-y-1.5 text-[14px] text-ink">
                    {list.map(k => {
                      const benefic = k.planet === 'jupiter' || k.planet === 'venus'
                      return (
                        <li key={`${k.planet}-${k.target}`} className="flex gap-2">
                          <span className={`mt-1.5 h-2 w-2 shrink-0 rounded-full ${benefic ? 'bg-success' : 'bg-terra'}`} aria-hidden="true" />
                          <span>
                            <strong>{grahaShort(k.planet)}</strong> ({benefic ? 'benefic' : 'malefic'}){' '}
                            {k.kind === 'conjunction'
                              ? `sits in the sign of ${names[other(from)]}’s ${TARGET[k.target]}`
                              : `casts its ${ordinal(k.position)} aspect on ${names[other(from)]}’s ${TARGET[k.target]}`}
                          </span>
                        </li>
                      )
                    })}
                  </ul>
                ) : (
                  <p className="mt-2 text-[14px] text-ink-soft">No conjunction or aspect onto these points.</p>
                )}
              </div>
            )
          })}
        </div>
      </section>

      <section aria-labelledby="cp-charts">
        <SectionTitle id="cp-charts" eyebrow="6 · Both birth charts" title="The charts these facts come from">
          North Indian charts: the top diamond is the 1st house. Numbers are rashis (1 = Mesha … 12 = Meena).
        </SectionTitle>
        <div className="grid gap-6 lg:grid-cols-2">
          {ROLES.map(r => (
            <div key={r} className="card p-4 sm:p-5">
              <div className="flex items-baseline justify-between gap-3 mb-3">
                <h3 className="font-serif text-maroon text-[20px]">{names[r]}</h3>
                <span className="text-[12px] uppercase tracking-[0.14em] text-ink-soft">{charts[r].lagna ? `Lagna ${sign(charts[r].lagna!.rashiIndex)}` : 'Chandra Kundli'}</span>
              </div>
              <div className="mx-auto max-w-[340px]"><KundliChart chart={charts[r]} size={340} /></div>
              <p className="mt-3 text-[13px] text-ink-soft">
                {formatDateLong(charts[r].birth.localDate)}
                {charts[r].birth.localTime ? `, ${formatTime12(charts[r].birth.localTime!)}` : ', time unknown'} · {charts[r].birth.placeLabel}
              </p>
            </div>
          ))}
        </div>
      </section>

      <section aria-label="Disclaimer"><Disclaimer text={METHODOLOGY.disclaimer} /></section>

      <section aria-labelledby="cp-next">
        <SectionTitle id="cp-next" eyebrow="7 · Next" title="Keep, share or start again" />
        <div className="card p-5 sm:p-6">
          <button type="button" className="btn-primary" onClick={() => openInKundliMatch(request)}>Open in Kundli Match for PDF &amp; share</button>
          <p className="mt-3 text-[13px] text-ink-soft">
            Details carry over within this browser tab only. Methodology v{result.methodologyVersion} —{' '}
            <Link href="#methodology" className="text-maroon underline underline-offset-2">how every factor is worked out</Link>.
          </p>
          <div className="mt-5 pt-5 border-t border-gold/20 flex flex-wrap gap-3">
            <button type="button" className="btn-ghost" onClick={onEdit}>Edit birth details</button>
            <button type="button" className="btn-ghost" onClick={onNew}>Compare another pair</button>
          </div>
        </div>
      </section>
    </div>
  )
}
