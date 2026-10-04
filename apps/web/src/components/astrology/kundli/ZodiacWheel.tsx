import { RASHIS } from '@/lib/astrology/vedic/zodiac'

export type WheelMarker = {
  /** Sidereal longitude, degrees. */
  longitude: number
  label: string
  ring: 'inner' | 'outer'
  emphasis?: boolean
  title: string
}

type Props = {
  size?: number
  markers?: WheelMarker[]
  /** Draw a chord between the two emphasised markers (the two Moons). */
  connect?: boolean
  className?: string
  /** Purely decorative wheels are hidden from assistive technology. */
  decorative?: boolean
  label?: string
  theme?: 'dark' | 'light'
  /** Markers appear one after another (CSS only; off under reduced motion). */
  animateMarkers?: boolean
  /** Shade one rashi (0 = Mesha) in the sign band. */
  highlightRashi?: number
}

const TAU = Math.PI * 2

/**
 * The sidereal zodiac drawn with Mesha at the left (the traditional east point)
 * and signs running counter-clockwise. When markers are passed, each sits at
 * its calculated sidereal longitude — the only geometric claim this drawing
 * makes. Marker sizes and ring spacing are schematic.
 */
export function ZodiacWheel({ size = 320, markers = [], connect = false, className = '', decorative = false, label, theme = 'light', animateMarkers = false, highlightRashi }: Props) {
  const c = size / 2
  const rOuter = c - 4
  const rSign = c * 0.86
  const rNak = c * 0.74
  const rOuterRing = c * 0.62
  const rInnerRing = c * 0.44
  const gold = theme === 'dark' ? '#E4C572' : '#B98A2E'
  const ink = theme === 'dark' ? '#FFFAF0' : '#5A0E19'
  const faint = theme === 'dark' ? 'rgba(228,197,114,0.28)' : 'rgba(185,138,46,0.4)'

  // Longitude 0 at 9 o'clock, increasing counter-clockwise (screen y is down).
  const at = (lon: number, r: number) => {
    const a = Math.PI + (lon * TAU) / 360
    return { x: c + r * Math.cos(a), y: c - r * Math.sin(a) }
  }

  const emphasised = markers.filter(m => m.emphasis)
  const chord = connect && emphasised.length === 2
    ? [at(emphasised[0].longitude, emphasised[0].ring === 'inner' ? rInnerRing : rOuterRing), at(emphasised[1].longitude, emphasised[1].ring === 'inner' ? rInnerRing : rOuterRing)]
    : null

  return (
    <svg
      viewBox={`0 0 ${size} ${size}`}
      width="100%"
      className={className}
      {...(decorative ? { 'aria-hidden': true } : { role: 'img', 'aria-label': label ?? 'Sidereal zodiac wheel' })}
    >
      {highlightRashi != null && (() => {
        const r1 = rSign * 0.93
        const a = at(highlightRashi * 30, rOuter), b = at(highlightRashi * 30 + 30, rOuter)
        const d = at(highlightRashi * 30 + 30, r1), e = at(highlightRashi * 30, r1)
        // Counter-clockwise on screen is sweep 0, because screen y points down.
        return <path d={`M ${a.x} ${a.y} A ${rOuter} ${rOuter} 0 0 0 ${b.x} ${b.y} L ${d.x} ${d.y} A ${r1} ${r1} 0 0 1 ${e.x} ${e.y} Z`} fill="#7A1220" fillOpacity={0.85} stroke={gold} strokeWidth={1.2} />
      })()}
      <circle cx={c} cy={c} r={rOuter} fill="none" stroke={gold} strokeOpacity={0.55} strokeWidth={1} />
      <circle cx={c} cy={c} r={rSign * 0.93} fill="none" stroke={faint} strokeWidth={1} />
      <circle cx={c} cy={c} r={rNak - c * 0.04} fill="none" stroke={faint} strokeWidth={0.75} />
      {markers.length > 0 && (
        <>
          <circle cx={c} cy={c} r={rOuterRing} fill="none" stroke={faint} strokeDasharray="2 4" strokeWidth={0.75} />
          <circle cx={c} cy={c} r={rInnerRing} fill="none" stroke={faint} strokeDasharray="2 4" strokeWidth={0.75} />
        </>
      )}

      {RASHIS.map((r, i) => {
        const p1 = at(i * 30, rOuter)
        const p2 = at(i * 30, rNak - c * 0.04)
        const t = at(i * 30 + 15, (rOuter + rSign * 0.93) / 2 - 1)
        return (
          <g key={r.slug}>
            <line x1={p1.x} y1={p1.y} x2={p2.x} y2={p2.y} stroke={faint} strokeWidth={1} />
            <text x={t.x} y={t.y} fill={ink} fillOpacity={0.85} fontSize={size * 0.04} textAnchor="middle" dominantBaseline="central" className="font-deva">
              {r.hi}
            </text>
          </g>
        )
      })}

      {Array.from({ length: 27 }, (_, i) => {
        const p1 = at((i * 360) / 27, rSign * 0.93)
        const p2 = at((i * 360) / 27, rNak - c * 0.04)
        return <line key={i} x1={p1.x} y1={p1.y} x2={p2.x} y2={p2.y} stroke={gold} strokeOpacity={0.35} strokeWidth={0.75} />
      })}

      {chord && (
        <line x1={chord[0].x} y1={chord[0].y} x2={chord[1].x} y2={chord[1].y} stroke={gold} strokeWidth={1.2} strokeDasharray="4 4" strokeOpacity={0.8} />
      )}

      {markers.map((m, i) => {
        const r = m.ring === 'inner' ? rInnerRing : rOuterRing
        const p = at(m.longitude, r)
        const rad = m.emphasis ? size * 0.042 : size * 0.032
        const fill = m.ring === 'inner' ? '#7A1220' : '#B98A2E'
        return (
          <g key={`${m.label}-${m.ring}-${i}`} className={animateMarkers ? 'kd-marker-in' : undefined} style={animateMarkers ? { animationDelay: `${200 + i * 140}ms` } : undefined}>
            <title>{m.title}</title>
            <circle cx={p.x} cy={p.y} r={rad} fill={fill} stroke={m.emphasis ? '#FFFAF0' : gold} strokeWidth={m.emphasis ? 1.6 : 0.8} />
            <text x={p.x} y={p.y} fill="#FFFAF0" fontSize={size * 0.03} fontWeight={600} textAnchor="middle" dominantBaseline="central">
              {m.label}
            </text>
          </g>
        )
      })}

      {markers.length === 0 && (
        <g aria-hidden="true">
          <circle cx={c} cy={c} r={c * 0.16} fill="none" stroke={gold} strokeOpacity={0.5} />
          {Array.from({ length: 8 }, (_, i) => {
            const a = (i * TAU) / 8
            return (
              <ellipse
                key={i}
                cx={c + Math.cos(a) * c * 0.1}
                cy={c + Math.sin(a) * c * 0.1}
                rx={c * 0.035}
                ry={c * 0.1}
                transform={`rotate(${(i * 360) / 8 + 90} ${c + Math.cos(a) * c * 0.1} ${c + Math.sin(a) * c * 0.1})`}
                fill={gold}
                fillOpacity={0.18}
                stroke={gold}
                strokeOpacity={0.5}
                strokeWidth={0.75}
              />
            )
          })}
        </g>
      )}
    </svg>
  )
}
