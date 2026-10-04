import { NAKSHATRAS, RASHIS } from '@/lib/astrology/vedic/zodiac'

type Props = { highlight: number | null; moonLongitude: number | null; size?: number; label: string }

const TAU = Math.PI * 2

/**
 * The 27 nakshatras as a ring (Ashwini at 9 o'clock, running counter-clockwise
 * like the zodiac wheel), the twelve rashis outside, the birth nakshatra
 * highlighted and — when the time is known — the Moon at its calculated
 * longitude.
 */
export function NakshatraWheel({ highlight, moonLongitude, size = 340, label }: Props) {
  const c = size / 2
  const rOut = c - 3
  const rRashi = c * 0.86
  const rNakOut = c * 0.8
  const rNakIn = c * 0.56
  const at = (lon: number, r: number) => {
    const a = Math.PI + (lon * TAU) / 360
    return { x: c + r * Math.cos(a), y: c - r * Math.sin(a) }
  }
  const arc = (from: number, to: number, r1: number, r2: number) => {
    const a = at(from, r2), b = at(to, r2), d = at(to, r1), e = at(from, r1)
    // Counter-clockwise on screen = sweep flag 0 because screen y points down.
    return `M ${a.x} ${a.y} A ${r2} ${r2} 0 0 0 ${b.x} ${b.y} L ${d.x} ${d.y} A ${r1} ${r1} 0 0 1 ${e.x} ${e.y} Z`
  }
  const span = 360 / 27

  return (
    <svg viewBox={`0 0 ${size} ${size}`} width="100%" role="img" aria-label={label}>
      <circle cx={c} cy={c} r={rOut} fill="#FFFAF0" fillOpacity={0.6} stroke="#B98A2E" strokeOpacity={0.6} />
      {RASHIS.map((r, i) => {
        const p1 = at(i * 30, rOut), p2 = at(i * 30, rRashi * 0.97)
        const t = at(i * 30 + 15, (rOut + rRashi * 0.97) / 2)
        return (
          <g key={r.slug}>
            <line x1={p1.x} y1={p1.y} x2={p2.x} y2={p2.y} stroke="#B98A2E" strokeOpacity={0.35} />
            <text x={t.x} y={t.y} fill="#5A0E19" fillOpacity={0.85} fontSize={size * 0.034} textAnchor="middle" dominantBaseline="central" className="font-deva">{r.hi}</text>
          </g>
        )
      })}
      <circle cx={c} cy={c} r={rRashi * 0.97} fill="none" stroke="#B98A2E" strokeOpacity={0.35} />

      {NAKSHATRAS.map((n, i) => {
        const on = i === highlight
        const mid = at(i * span + span / 2, (rNakOut + rNakIn) / 2)
        return (
          <g key={n.slug} className={on ? 'kd-nak-on' : undefined}>
            <title>{`${i + 1}. ${n.name}`}</title>
            <path d={arc(i * span, (i + 1) * span, rNakIn, rNakOut)} fill={on ? '#7A1220' : i % 2 ? '#F7EBD3' : '#FCF5E7'} stroke="#B98A2E" strokeOpacity={on ? 0.9 : 0.4} strokeWidth={on ? 1.5 : 0.75} />
            <text x={mid.x} y={mid.y} fill={on ? '#FFFAF0' : '#7A1220'} fillOpacity={on ? 1 : 0.75} fontSize={size * 0.032} fontWeight={on ? 700 : 500} textAnchor="middle" dominantBaseline="central">{i + 1}</text>
          </g>
        )
      })}

      {highlight != null && [1, 2, 3].map(p => {
        const lon = highlight * span + (p * span) / 4
        const a = at(lon, rNakIn), b = at(lon, rNakOut)
        return <line key={p} x1={a.x} y1={a.y} x2={b.x} y2={b.y} stroke="#E4C572" strokeOpacity={0.9} strokeDasharray="2 2" />
      })}

      {moonLongitude != null && (() => {
        const m = at(moonLongitude, rNakOut + c * 0.035)
        const inner = at(moonLongitude, rNakIn - c * 0.02)
        return (
          <g>
            <title>Moon at birth</title>
            <line x1={inner.x} y1={inner.y} x2={m.x} y2={m.y} stroke="#5A0E19" strokeWidth={1.4} />
            <circle cx={m.x} cy={m.y} r={size * 0.026} fill="#D6A83C" stroke="#5A0E19" strokeWidth={1.2} />
          </g>
        )
      })()}

      <circle cx={c} cy={c} r={rNakIn * 0.92} fill="#FFFAF0" stroke="#B98A2E" strokeOpacity={0.45} />
      <text x={c} y={c - size * 0.05} fill="#9B2233" fontSize={size * 0.085} textAnchor="middle" dominantBaseline="central" className="font-deva">{highlight != null ? NAKSHATRAS[highlight].hi : 'नक्षत्र'}</text>
      <text x={c} y={c + size * 0.05} fill="#2B211C" fontSize={size * 0.045} textAnchor="middle" dominantBaseline="central" style={{ fontFamily: 'Marcellus, serif' }}>{highlight != null ? NAKSHATRAS[highlight].name : '27 lunar mansions'}</text>
      {highlight != null && <text x={c} y={c + size * 0.11} fill="#6A5A4E" fontSize={size * 0.03} textAnchor="middle" dominantBaseline="central">{highlight + 1} of 27</text>}
    </svg>
  )
}
