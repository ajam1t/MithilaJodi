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

/** A five-petal blossom with a dotted heart. */
function blossomPath(cx: number, cy: number, r: number): string {
  let d = ''
  for (let k = 0; k < 5; k++) {
    const a = (k / 5) * Math.PI * 2 - Math.PI / 2
    const a1 = a - 0.55, a2 = a + 0.55
    d += `M${r1(cx + Math.cos(a1) * r * 0.25)} ${r1(cy + Math.sin(a1) * r * 0.25)}`
    d += `C${r1(cx + Math.cos(a1) * r * 1.15)} ${r1(cy + Math.sin(a1) * r * 1.15)} ${r1(cx + Math.cos(a2) * r * 1.15)} ${r1(cy + Math.sin(a2) * r * 1.15)} ${r1(cx + Math.cos(a2) * r * 0.25)} ${r1(cy + Math.sin(a2) * r * 0.25)}`
  }
  const c = r * 0.2
  return `${d}M${r1(cx - c)} ${r1(cy)}a${r1(c)} ${r1(c)} 0 1 0 ${r1(c * 2)} 0a${r1(c)} ${r1(c)} 0 1 0 -${r1(c * 2)} 0`
}

/**
 * A leafy spray: a gently curving stem from (x, y) along `angle`, leaves in
 * pairs along it and a blossom or bud at the tip. `bend` curls it sideways.
 */
function sprayPath(x: number, y: number, len: number, angle: number, bend: number, tip: 'blossom' | 'bud' | 'none' = 'blossom'): string {
  const ex = x + Math.cos(angle) * len, ey = y + Math.sin(angle) * len
  const nx = -Math.sin(angle), ny = Math.cos(angle)
  const qx = (x + ex) / 2 + nx * bend, qy = (y + ey) / 2 + ny * bend
  const at = (t: number) => ({
    x: (1 - t) * (1 - t) * x + 2 * (1 - t) * t * qx + t * t * ex,
    y: (1 - t) * (1 - t) * y + 2 * (1 - t) * t * qy + t * t * ey,
    a: Math.atan2(2 * (1 - t) * (qy - y) + 2 * t * (ey - qy), 2 * (1 - t) * (qx - x) + 2 * t * (ex - qx)),
  })
  const parts = [`M${r1(x)} ${r1(y)}Q${r1(qx)} ${r1(qy)} ${r1(ex)} ${r1(ey)}`]
  const pairs = Math.max(2, Math.round(len / 24))
  for (let i = 1; i <= pairs; i++) {
    const p = at(i / (pairs + 1))
    const size = len * 0.2 * (1 - (i / (pairs + 1)) * 0.45)
    parts.push(leafPath(p.x, p.y, size, p.a - 0.75), leafPath(p.x, p.y, size, p.a + 0.75))
  }
  if (tip === 'blossom') parts.push(blossomPath(ex, ey, len * 0.09 + 4))
  if (tip === 'bud') parts.push(`M${r1(ex)} ${r1(ey)}c-3-5-3-9 0-12 3 3 3 7 0 12Z`)
  return parts.join('')
}

/** A bouquet: a full peony between two roses, sprays fanning out, blossoms tucked in. `dir` 1 opens downward, -1 upward. */
function bouquet(cx: number, cy: number, s: number, dir: 1 | -1): string {
  const up = -Math.PI / 2 * dir
  const parts = [
    rosePath(cx, cy, 30 * s),
    rosePath(cx - 44 * s, cy - 12 * s * dir, 17 * s), rosePath(cx + 44 * s, cy - 12 * s * dir, 17 * s),
    blossomPath(cx - 24 * s, cy + 30 * s * dir, 9 * s), blossomPath(cx + 24 * s, cy + 30 * s * dir, 9 * s),
    blossomPath(cx, cy - 44 * s * dir, 8 * s),
  ]
  for (const side of [-1, 1] as const) {
    parts.push(
      sprayPath(cx + side * 50 * s, cy - 6 * s * dir, 120 * s, side === 1 ? up + 1.05 : up - 1.05 + Math.PI * 0, side * -26 * s * dir, 'blossom'),
      sprayPath(cx + side * 58 * s, cy + 6 * s * dir, 104 * s, side === 1 ? 0.18 * dir : Math.PI - 0.18 * dir, side * 20 * s * dir, 'bud'),
      sprayPath(cx + side * 20 * s, cy - 26 * s * dir, 96 * s, up + side * 0.5, side * -14 * s, 'blossom'),
      sprayPath(cx + side * 16 * s, cy + 26 * s * dir, 70 * s, -up + side * 0.7, side * 12 * s, 'bud'),
    )
  }
  return parts.join('')
}

/** The embossed floral field, drawn once on a 400 × 800 portrait card (flaps meet near y 376). */
function floralField(): string {
  const parts: string[] = []
  parts.push(bouquet(200, 158, 1, 1))
  parts.push(bouquet(200, 640, 1, -1))
  // Climbing sprays on the side flaps.
  for (const side of [-1, 1] as const) {
    const x = side === -1 ? 62 : 338
    parts.push(sprayPath(x, 650, 330, -Math.PI / 2, side * 22, 'blossom'))
    parts.push(rosePath(x + side * -6, 470, 13), blossomPath(x + side * 16, 380, 8), blossomPath(x + side * -14, 560, 7))
    parts.push(sprayPath(x + side * -4, 470, 64, side === -1 ? -0.5 : Math.PI + 0.5, side * 10, 'bud'))
    parts.push(sprayPath(x + side * -4, 560, 58, side === -1 ? 0.4 : Math.PI - 0.4, side * -8, 'blossom'))
  }
  // Corner blossoms and a lotus at the foot.
  for (const [x, y] of [[30, 34], [370, 34], [30, 770], [370, 770]] as const) parts.push(blossomPath(x, y, 9))
  parts.push(lotusPath(200, 776, 1.2))
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
