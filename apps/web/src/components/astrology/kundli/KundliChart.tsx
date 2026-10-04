import type { ChartData } from '@/lib/astrology/types'
import { RASHIS, type GrahaId } from '@/lib/astrology/vedic/zodiac'
import { grahaOf, grahaShort } from './format'

export type ChartPlacement = { id: GrahaId; rashiIndex: number; retrograde?: boolean }

type NorthIndianProps = {
  firstRashiIndex: number
  placements: ChartPlacement[]
  /** Small caption inside the 1st house, e.g. LAGNA, MOON, D9 LAGNA. */
  firstHouseLabel: string
  /** Opening phrase of the accessible description, e.g. "North Indian chart, Lagna Karka". */
  description: string
  size?: number
  theme?: 'paper' | 'print'
}

/**
 * North Indian (diamond) chart. Houses are fixed — the top diamond is always
 * the 1st house, running counter-clockwise — and the rashi numbers rotate with
 * the 1st house's sign. Purely presentational: placements come from the engine.
 */
export function NorthIndianChart({ firstRashiIndex, placements, firstHouseLabel, description, size = 320, theme = 'paper' }: NorthIndianProps) {
  const S = size
  const c = S / 2
  const q = S / 4
  const P = {
    TL: [0, 0], TR: [S, 0], BR: [S, S], BL: [0, S],
    T: [c, 0], R: [S, c], B: [c, S], L: [0, c], C: [c, c],
    q1: [q, q], q2: [3 * q, q], q3: [3 * q, 3 * q], q4: [q, 3 * q],
  } as const
  type K = keyof typeof P
  const HOUSES: Array<{ poly: K[]; content: [number, number]; num: [number, number] }> = [
    { poly: ['T', 'q2', 'C', 'q1'], content: [c, S * 0.25], num: [c, c - S * 0.075] },
    { poly: ['TL', 'T', 'q1'], content: [S * 0.25, S * 0.085], num: [S * 0.25, S * 0.2] },
    { poly: ['TL', 'q1', 'L'], content: [S * 0.085, S * 0.25], num: [S * 0.19, S * 0.25] },
    { poly: ['L', 'q1', 'C', 'q4'], content: [S * 0.25, c], num: [c - S * 0.075, c] },
    { poly: ['BL', 'L', 'q4'], content: [S * 0.085, S * 0.75], num: [S * 0.19, S * 0.75] },
    { poly: ['BL', 'q4', 'B'], content: [S * 0.25, S * 0.915], num: [S * 0.25, S * 0.8] },
    { poly: ['B', 'q4', 'C', 'q3'], content: [c, S * 0.75], num: [c, c + S * 0.075] },
    { poly: ['B', 'q3', 'BR'], content: [S * 0.75, S * 0.915], num: [S * 0.75, S * 0.8] },
    { poly: ['BR', 'q3', 'R'], content: [S * 0.915, S * 0.75], num: [S * 0.81, S * 0.75] },
    { poly: ['R', 'q3', 'C', 'q2'], content: [S * 0.75, c], num: [c + S * 0.075, c] },
    { poly: ['R', 'q2', 'TR'], content: [S * 0.915, S * 0.25], num: [S * 0.81, S * 0.25] },
    { poly: ['TR', 'q2', 'T'], content: [S * 0.75, S * 0.085], num: [S * 0.75, S * 0.2] },
  ]

  const houseOf = (rashiIndex: number) => ((rashiIndex - firstRashiIndex + 12) % 12) + 1
  const byHouse = new Map<number, string[]>()
  const spoken = new Map<number, string[]>()
  for (const p of placements) {
    const h = houseOf(p.rashiIndex)
    // Rahu and Ketu are always retrograde by definition; marking them adds noise.
    const retro = p.retrograde && p.id !== 'rahu' && p.id !== 'ketu'
    byHouse.set(h, [...(byHouse.get(h) ?? []), `${grahaOf(p.id).abbr}${retro ? 'ᴿ' : ''}`])
    spoken.set(h, [...(spoken.get(h) ?? []), `${grahaShort(p.id)}${retro ? ' (retrograde)' : ''}`])
  }

  const stroke = theme === 'print' ? '#7A1220' : '#B98A2E'
  const fs = S * 0.043
  const label =
    `${description}. ` +
    Array.from({ length: 12 }, (_, i) => i + 1)
      .map(h => `House ${h} (${RASHIS[(firstRashiIndex + h - 1) % 12].name}): ${(spoken.get(h) ?? ['empty']).join(', ')}`)
      .join('. ')

  return (
    <svg viewBox={`-2 -2 ${S + 4} ${S + 4}`} width="100%" className="kd-chart" role="img" aria-label={label}>
      <rect x={0} y={0} width={S} height={S} fill={theme === 'print' ? '#fff' : '#FFFAF0'} stroke={stroke} strokeWidth={1.6} />
      {HOUSES.map((h, i) => (
        <polygon
          key={i}
          className="kd-house"
          points={h.poly.map(k => P[k].join(',')).join(' ')}
          fill={i === 0 ? 'rgba(228,197,114,0.14)' : 'transparent'}
          stroke={stroke}
          strokeWidth={1}
        />
      ))}
      {HOUSES.map((h, i) => {
        const house = i + 1
        const labels = byHouse.get(house) ?? []
        const lines: string[] = []
        for (let k = 0; k < labels.length; k += 3) lines.push(labels.slice(k, k + 3).join(' '))
        const first = h.content[1] - ((lines.length - 1) * fs * 1.15) / 2
        return (
          <g key={`t${i}`}>
            <text x={h.num[0]} y={h.num[1]} fontSize={fs * 0.82} fill="#9B2233" textAnchor="middle" dominantBaseline="central" fontWeight={600}>
              {((firstRashiIndex + i) % 12) + 1}
            </text>
            {house === 1 && (
              <text x={c} y={S * 0.06} fontSize={fs * 0.72} fill="#6A5A4E" textAnchor="middle" dominantBaseline="central" letterSpacing="0.08em">
                {firstHouseLabel}
              </text>
            )}
            {lines.map((line, k) => (
              <text key={k} x={h.content[0]} y={first + k * fs * 1.15 + (house === 1 ? S * 0.025 : 0)} fontSize={fs} fill="#2B211C" textAnchor="middle" dominantBaseline="central" fontWeight={600}>
                {line}
              </text>
            ))}
          </g>
        )
      })}
    </svg>
  )
}

/**
 * The birth chart (D1). With a known birth time the 1st house is the Lagna;
 * otherwise — or when asked — it is drawn as a Chandra Kundli (the Moon's
 * rashi as the 1st house), and says so.
 */
export function KundliChart({ chart, mode, size, theme }: { chart: ChartData; mode?: 'lagna' | 'chandra'; size?: number; theme?: 'paper' | 'print' }) {
  const lagnaMode = (mode ?? 'lagna') === 'lagna' && chart.lagna != null
  const first = lagnaMode ? chart.lagna!.rashiIndex : chart.moon.rashiIndex
  return (
    <NorthIndianChart
      firstRashiIndex={first}
      placements={chart.planets.map(p => ({ id: p.id, rashiIndex: p.rashiIndex, retrograde: p.retrograde }))}
      firstHouseLabel={lagnaMode ? 'LAGNA' : 'MOON'}
      description={
        lagnaMode
          ? `North Indian chart, Lagna ${RASHIS[first].name}`
          : `Chandra Kundli with the Moon's rashi ${RASHIS[first].name} as the first house`
      }
      size={size}
      theme={theme}
    />
  )
}
