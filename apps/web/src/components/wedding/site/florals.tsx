/**
 * The embossed ivory florals shared by the MJ Scratch & Reveal invitation: the
 * scratch card's flaps and the invitation's opening view. Plain path strings,
 * computed once and identical on server and browser.
 */

/** Server and browser trig can differ in the last digit — round so hydration matches. */
export const r1 = (n: number) => Math.round(n * 10) / 10

/** A many-petalled rose: rings of rounded petals around a small spiral heart. */
function rosePath(cx: number, cy: number, r: number): string {
  let d = ''
  for (let ring = 0; ring < 3; ring++) {
    const rr = r * (0.38 + ring * 0.31)
    const n = 5 + ring * 2
    const half = Math.PI / n
    for (let k = 0; k < n; k++) {
      const a = (k / n) * Math.PI * 2 + ring * 0.4
      const x1 = cx + Math.cos(a - half) * rr, y1 = cy + Math.sin(a - half) * rr
      const x2 = cx + Math.cos(a + half) * rr, y2 = cy + Math.sin(a + half) * rr
      const qx = cx + Math.cos(a) * rr * 1.42, qy = cy + Math.sin(a) * rr * 1.42
      d += `M${r1(x1)} ${r1(y1)}Q${r1(qx)} ${r1(qy)} ${r1(x2)} ${r1(y2)}`
    }
  }
  const s = r * 0.18
  return `${d}M${r1(cx - s)} ${r1(cy)}a${r1(s)} ${r1(s)} 0 1 1 ${r1(s * 1.4)} ${r1(s * 0.6)}a${r1(s * 0.6)} ${r1(s * 0.6)} 0 1 1 -${r1(s * 0.5)} -${r1(s * 0.9)}`
}

/** A leaf with its midrib, from (x, y) along `angle` (radians). */
function leafPath(x: number, y: number, len: number, angle: number): string {
  const ex = x + Math.cos(angle) * len, ey = y + Math.sin(angle) * len
  const nx = -Math.sin(angle) * len * 0.32, ny = Math.cos(angle) * len * 0.32
  const mx = (x + ex) / 2, my = (y + ey) / 2
  return `M${r1(x)} ${r1(y)}Q${r1(mx + nx)} ${r1(my + ny)} ${r1(ex)} ${r1(ey)}Q${r1(mx - nx)} ${r1(my - ny)} ${r1(x)} ${r1(y)}M${r1(x)} ${r1(y)}L${r1(mx + (ex - mx) * 0.6)} ${r1(my + (ey - my) * 0.6)}`
}

/** A Mithila lotus — the same five-petal form as the rest of the invitation. */
export function lotusPath(cx: number, cy: number, s: number): string {
  const p = (x: number, y: number) => `${r1(cx + x * s)} ${r1(cy + y * s)}`
  return [
    `M${p(0, 0)}C${p(-5, -6)} ${p(-5, -14)} ${p(0, -20)}C${p(5, -14)} ${p(5, -6)} ${p(0, 0)}Z`,
    `M${p(0, 0)}C${p(-9, -3)} ${p(-14, -9)} ${p(-15, -16)}C${p(-7, -15)} ${p(-2, -9)} ${p(0, 0)}Z`,
    `M${p(0, 0)}C${p(9, -3)} ${p(14, -9)} ${p(15, -16)}C${p(7, -15)} ${p(2, -9)} ${p(0, 0)}Z`,
    `M${p(-16, 3)}L${p(16, 3)}`,
  ].join('')
}

/** The embossed floral field, drawn once on a 400 × 800 portrait card. */
function floralField(): string {
  const parts: string[] = []
  const cluster = (x: number, y: number, r: number, flip: 1 | -1) => {
    parts.push(rosePath(x, y, r))
    parts.push(rosePath(x - r * 1.7, y - r * 0.35 * flip, r * 0.62), rosePath(x + r * 1.7, y - r * 0.35 * flip, r * 0.62))
    for (const [dx, a] of [[-1, 0.15], [1, Math.PI - 0.15], [-2.4, 0.6], [2.4, Math.PI - 0.6]] as const) {
      parts.push(leafPath(x + dx * r * 0.9, y + r * 0.55 * flip, r * 1.05, flip === 1 ? a : -a))
    }
    parts.push(leafPath(x, y - r * 1.05 * flip, r * 0.8, flip === 1 ? -Math.PI / 2 - 0.5 : Math.PI / 2 + 0.5))
    parts.push(leafPath(x, y - r * 1.05 * flip, r * 0.8, flip === 1 ? -Math.PI / 2 + 0.5 : Math.PI / 2 - 0.5))
  }
  cluster(200, 150, 34, 1)
  cluster(200, 668, 30, -1)
  // Climbing vines along both edges, leaf after leaf.
  for (const side of [-1, 1] as const) {
    const x0 = side === -1 ? 34 : 366
    parts.push(`M${x0} 230C${x0 + side * -22} 300 ${x0 + side * 18} 360 ${x0} 420S${x0 + side * -22} 520 ${x0} 590`)
    for (let i = 0; i < 6; i++) {
      const y = 250 + i * 60
      const out = i % 2 ? 1 : -1
      parts.push(leafPath(x0 + side * -4 * out, y, 22, side === -1 ? (out === 1 ? -0.5 : Math.PI + 0.5) : (out === 1 ? Math.PI + 0.5 : -0.5)))
    }
    parts.push(rosePath(x0, 214, 11), rosePath(x0, 606, 11))
  }
  // Corner sprigs and a lotus at the foot.
  for (const [x, y] of [[44, 54], [356, 54], [44, 760], [356, 760]] as const) parts.push(rosePath(x, y, 13))
  parts.push(lotusPath(200, 760, 1.5))
  return parts.join('')
}

export const FLORALS = floralField()

/** The floral field as a standalone, full-bleed embossed picture (the invitation's opening view). */
export function EmbossedFlorals({ className = '' }: { className?: string }) {
  return (
    <svg viewBox="0 0 400 800" preserveAspectRatio="xMidYMid slice" className={className} aria-hidden="true" focusable="false">
      <g fill="none" strokeLinecap="round" strokeLinejoin="round">
        <path d={FLORALS} stroke="#9C7B47" strokeOpacity="0.28" strokeWidth="1.6" transform="translate(0.9 1.2)" />
        <path d={FLORALS} stroke="#FFFFFF" strokeOpacity="0.95" strokeWidth="1.3" transform="translate(-0.6 -0.8)" />
        <path d={FLORALS} stroke="#C9A35A" strokeOpacity="0.45" strokeWidth="0.8" />
      </g>
    </svg>
  )
}
