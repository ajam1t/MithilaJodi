/**
 * Small self-contained Mithila/Madhubani line-art motifs for the biodata
 * document's corners and dividers. Each is one small <svg>, sized by width
 * only (height follows the viewBox), so it survives print and image export
 * the same way the rest of the document does — no external image request.
 */

/** A simple six-petal lotus, the recurring Mithila/Madhubani motif. */
export function LotusMotif({ size = 28, color }: { size?: number; color: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 40 40" aria-hidden="true">
      {[0, 30, 60, 90, 120, 150].map(a => (
        <ellipse
          key={a} cx="20" cy="20" rx="4.5" ry="15"
          fill="none" stroke={color} strokeWidth="1.3"
          transform={`rotate(${a} 20 20)`}
        />
      ))}
      <circle cx="20" cy="20" r="3" fill={color} opacity="0.75" />
    </svg>
  )
}

/** A paired fish motif — Mithila's emblem of good fortune, used sparingly. */
export function FishMotif({ size = 26, color }: { size?: number; color: string }) {
  return (
    <svg width={size} height={size * 0.6} viewBox="0 0 44 26" aria-hidden="true">
      <ellipse cx="18" cy="13" rx="14" ry="8" fill="none" stroke={color} strokeWidth="1.4" />
      <path d="M31 13 L42 6 L42 20 Z" fill="none" stroke={color} strokeWidth="1.4" />
      <circle cx="8" cy="10" r="1.4" fill={color} />
      <path d="M2 13 q 16 -8 24 -1" fill="none" stroke={color} strokeWidth="1" opacity="0.6" />
    </svg>
  )
}

/** A quarter-circle corner flourish — one or two thin arcs and a dot. */
export function CornerFlourish({ size = 34, color, rotate = 0 }: { size?: number; color: string; rotate?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 40 40" aria-hidden="true" style={{ transform: `rotate(${rotate}deg)` }}>
      <path d="M2 38 C2 16 16 2 38 2" fill="none" stroke={color} strokeWidth="1.3" opacity="0.8" />
      <path d="M2 28 C2 13 13 2 28 2" fill="none" stroke={color} strokeWidth="1" opacity="0.55" />
      <circle cx="9" cy="9" r="2.2" fill={color} opacity="0.75" />
    </svg>
  )
}

/** A short decorative vine used as a divider under the header. */
export function VineDivider({ width = 160, color }: { width?: number; color: string }) {
  const h = 14
  return (
    <svg width={width} height={h} viewBox={`0 0 ${width} ${h}`} aria-hidden="true">
      <path d={`M0 7 Q ${width * 0.25} ${h} ${width * 0.5} 7 T ${width} 7`} fill="none" stroke={color} strokeWidth="1.2" opacity="0.75" />
      <circle cx={width / 2} cy="7" r="2.4" fill={color} opacity="0.85" />
    </svg>
  )
}
