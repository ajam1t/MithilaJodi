import type { ReactNode } from 'react'

/**
 * Madhubani-style SVG primitives for the biodata frames.
 *
 * Every piece is drawn in its own local coordinates and placed with a
 * transform, so a frame can position and scale it in millimetres. Flat fills
 * and outlines only — no gradients, patterns or ids — so any number of pages
 * can share them and print exactly as they appear on screen.
 */

const f = (n: number) => Math.round(n * 100) / 100
const deg = (vx: number, vy: number) => (Math.atan2(vy, vx) * 180) / Math.PI

// ── Small pieces ───────────────────────────────────────────────────────────

/** An almond leaf with a midrib, base at (x, y), pointing along `angle`. */
export function Leaf({ x, y, angle, len, fill, stroke }: {
  x: number; y: number; angle: number; len: number; fill: string; stroke: string
}) {
  const w = len * 0.36
  return (
    <g transform={`translate(${f(x)} ${f(y)}) rotate(${f(angle)})`}>
      <path
        d={`M0 0C${f(len * 0.3)} ${f(-w)} ${f(len * 0.72)} ${f(-w * 0.9)} ${f(len)} 0C${f(len * 0.72)} ${f(w * 0.9)} ${f(len * 0.3)} ${f(w)} 0 0Z`}
        fill={fill} stroke={stroke} strokeWidth={f(len * 0.05)}
      />
      <path d={`M${f(len * 0.08)} 0L${f(len * 0.82)} 0`} stroke={stroke} strokeWidth={f(len * 0.035)} opacity={0.75} />
    </g>
  )
}

export function Flower({ x, y, r, petal, center, stroke, petals = 5, rot = 0 }: {
  x: number; y: number; r: number; petal: string; center: string; stroke: string; petals?: number; rot?: number
}) {
  return (
    <g transform={`translate(${f(x)} ${f(y)}) rotate(${rot})`}>
      {Array.from({ length: petals }, (_, i) => (
        <ellipse
          key={i} cx={0} cy={f(-r * 0.55)} rx={f(r * 0.36)} ry={f(r * 0.56)}
          transform={`rotate(${f((i * 360) / petals)})`}
          fill={petal} stroke={stroke} strokeWidth={f(r * 0.07)}
        />
      ))}
      <circle r={f(r * 0.32)} fill={center} stroke={stroke} strokeWidth={f(r * 0.06)} />
      <circle r={f(r * 0.1)} fill={stroke} />
    </g>
  )
}

// ── Vines and bands ────────────────────────────────────────────────────────

export type VinePalette = {
  stem: string; leaf: string; leafAlt: string
  flowerA: string; flowerB: string; center: string; outline: string; berry?: string
}

/**
 * A flowering vine along a straight edge: a wavy stem with a flower on every
 * crest and leaves on the inside of each curve. Works along any direction.
 */
export function EdgeVine({ x1, y1, x2, y2, c, amp = 2.4, wave = 15, flowerR = 2.3, leafLen = 4.4 }: {
  x1: number; y1: number; x2: number; y2: number; c: VinePalette
  amp?: number; wave?: number; flowerR?: number; leafLen?: number
}) {
  const dx = x2 - x1, dy = y2 - y1, L = Math.hypot(dx, dy)
  const ux = dx / L, uy = dy / L, nx = -uy, ny = ux
  const n = Math.max(2, Math.round(L / (wave / 2)))
  const seg = L / n
  let d = `M${f(x1)} ${f(y1)}`
  const leaves: ReactNode[] = []
  const flowers: ReactNode[] = []

  for (let i = 0; i < n; i++) {
    const s = i % 2 === 0 ? 1 : -1
    const p0x = x1 + ux * seg * i, p0y = y1 + uy * seg * i
    const p2x = x1 + ux * seg * (i + 1), p2y = y1 + uy * seg * (i + 1)
    const cx = (p0x + p2x) / 2 + nx * amp * 2 * s
    const cy = (p0y + p2y) / 2 + ny * amp * 2 * s
    d += ` Q${f(cx)} ${f(cy)} ${f(p2x)} ${f(p2y)}`
    const at = (t: number) => ({
      x: (1 - t) * (1 - t) * p0x + 2 * (1 - t) * t * cx + t * t * p2x,
      y: (1 - t) * (1 - t) * p0y + 2 * (1 - t) * t * cy + t * t * p2y,
    })

    for (const [t, k] of [[0.18, -1], [0.82, 1]] as const) {
      const p = at(t)
      leaves.push(
        <Leaf key={`l${i}-${t}`} x={p.x} y={p.y} angle={deg(-s * nx * 0.8 + ux * 0.6 * k, -s * ny * 0.8 + uy * 0.6 * k)}
          len={leafLen} fill={k > 0 ? c.leaf : c.leafAlt} stroke={c.outline} />,
      )
    }
    const q = at(0.66)
    leaves.push(
      <Leaf key={`s${i}`} x={q.x} y={q.y} angle={deg(s * nx * 0.75 + ux * 0.66, s * ny * 0.75 + uy * 0.66)}
        len={leafLen * 0.7} fill={c.leaf} stroke={c.outline} />,
    )
    if (c.berry) {
      const b = at(0.36)
      leaves.push(<circle key={`b${i}`} cx={f(b.x + s * nx * 1.7)} cy={f(b.y + s * ny * 1.7)} r={0.6} fill={c.berry} stroke={c.outline} strokeWidth={0.15} />)
    }
    const cr = at(0.5)
    flowers.push(
      <Flower key={`f${i}`} x={cr.x + nx * s * flowerR * 0.8} y={cr.y + ny * s * flowerR * 0.8} r={flowerR}
        petal={Math.floor(i / 2) % 2 === 0 ? c.flowerA : c.flowerB} center={c.center} stroke={c.outline} rot={i * 17} />,
    )
  }

  return (
    <g>
      <path d={d} fill="none" stroke={c.stem} strokeWidth={0.65} strokeLinecap="round" />
      {leaves}
      {flowers}
    </g>
  )
}

/**
 * The Madhubani "bharni" band: alternating filled triangles along an edge.
 * Triangles point toward the side given by `inward` (+1 or -1 of the normal).
 */
export function TriangleBand({ x1, y1, x2, y2, depth, size, a, b, outline, inward = 1 }: {
  x1: number; y1: number; x2: number; y2: number; depth: number; size: number
  a: string; b: string; outline: string; inward?: 1 | -1
}) {
  const dx = x2 - x1, dy = y2 - y1, L = Math.hypot(dx, dy)
  const ux = dx / L, uy = dy / L, nx = -uy * inward, ny = ux * inward
  const n = Math.max(1, Math.round(L / size)), seg = L / n
  const base = (i: number) => [x1 + ux * seg * i, y1 + uy * seg * i] as const
  const apex = (i: number) => [x1 + ux * seg * (i + 0.5) + nx * depth, y1 + uy * seg * (i + 0.5) + ny * depth] as const
  const pts = (ps: ReadonlyArray<readonly [number, number]>) => ps.map(([x, y]) => `${f(x)},${f(y)}`).join(' ')
  const polys: ReactNode[] = []
  for (let i = 0; i < n; i++) {
    polys.push(<polygon key={`a${i}`} points={pts([base(i), base(i + 1), apex(i)])} fill={a} />)
    if (i < n - 1) polys.push(<polygon key={`b${i}`} points={pts([apex(i), base(i + 1), apex(i + 1)])} fill={b} />)
  }
  return (
    <g stroke="none">
      {polys}
      <path
        d={`M${f(x1)} ${f(y1)}L${f(x2)} ${f(y2)}M${f(x1 + nx * depth)} ${f(y1 + ny * depth)}L${f(x2 + nx * depth)} ${f(y2 + ny * depth)}`}
        stroke={outline} strokeWidth={0.4} fill="none"
      />
    </g>
  )
}

/** Dots along a line, alternating two colours. */
export function DotRow({ x1, y1, x2, y2, gap, r, a, b, outline }: {
  x1: number; y1: number; x2: number; y2: number; gap: number; r: number; a: string; b: string; outline: string
}) {
  const L = Math.hypot(x2 - x1, y2 - y1), n = Math.max(1, Math.round(L / gap))
  return (
    <g>
      {Array.from({ length: n + 1 }, (_, i) => (
        <circle key={i} cx={f(x1 + ((x2 - x1) * i) / n)} cy={f(y1 + ((y2 - y1) * i) / n)} r={r}
          fill={i % 2 ? b : a} stroke={outline} strokeWidth={0.15} />
      ))}
    </g>
  )
}

/** Small flowers spaced along a line, with a leaf pair between each. */
export function FlowerRow({ x1, y1, x2, y2, gap, r, a, b, leaf, center, outline }: {
  x1: number; y1: number; x2: number; y2: number; gap: number; r: number
  a: string; b: string; leaf: string; center: string; outline: string
}) {
  const dx = x2 - x1, dy = y2 - y1, L = Math.hypot(dx, dy), n = Math.max(1, Math.round(L / gap))
  const ux = dx / L, uy = dy / L, ang = deg(ux, uy)
  const items: ReactNode[] = []
  for (let i = 0; i <= n; i++) {
    const x = x1 + (dx * i) / n, y = y1 + (dy * i) / n
    if (i < n) {
      const mx = x + ux * (L / n) / 2, my = y + uy * (L / n) / 2
      items.push(<Leaf key={`la${i}`} x={mx} y={my} angle={ang + 150} len={r * 1.5} fill={leaf} stroke={outline} />)
      items.push(<Leaf key={`lb${i}`} x={mx} y={my} angle={ang - 30} len={r * 1.5} fill={leaf} stroke={outline} />)
    }
    items.push(<Flower key={`f${i}`} x={x} y={y} r={r} petal={i % 2 ? b : a} center={center} stroke={outline} petals={6} rot={i * 13} />)
  }
  return <g>{items}</g>
}

/** Rippling water lines between two x positions. */
export function Waves({ x1, x2, y, w = 8, h = 1.4, color, sw = 0.5, opacity = 1 }: {
  x1: number; x2: number; y: number; w?: number; h?: number; color: string; sw?: number; opacity?: number
}) {
  const n = Math.max(1, Math.round((x2 - x1) / w)), step = (x2 - x1) / n
  let d = `M${f(x1)} ${f(y)}`
  for (let i = 0; i < n; i++) d += ` q${f(step / 4)} ${f(i % 2 ? h : -h)} ${f(step / 2)} 0 t${f(step / 2)} 0`
  return <path d={d} fill="none" stroke={color} strokeWidth={sw} opacity={opacity} strokeLinecap="round" />
}

// ── Birds ──────────────────────────────────────────────────────────────────

export type PeacockPalette = {
  body: string; wing: string; wingEdge: string; tail: string
  eyeOuter: string; eyeMid: string; eyeInner: string
  beak: string; crest: string; outline: string; dots: string
}

/**
 * A Madhubani peacock facing right, anchored at its feet. The local drawing
 * spans roughly 90 × 90 units, so `s = 0.5` makes a bird about 45 mm across.
 */
export function Peacock({ x, y, s, flip = false, p }: { x: number; y: number; s: number; flip?: boolean; p: PeacockPalette }) {
  const o = p.outline
  const eyes: Array<[number, number, number, number]> = [
    [8.5, 84, 118, 1], [15.5, 76.5, 128, 1], [23.5, 69.5, 142, 0.95], [32, 64.5, 156, 0.82], [40.5, 61, 168, 0.66],
  ]
  return (
    <g transform={`translate(${f(x)} ${f(y)}) scale(${flip ? -s : s} ${s}) translate(-60 -78)`} strokeLinejoin="round" strokeLinecap="round">
      {/* tail */}
      <path d="M48 53C36 49 20 53 10 65C4 72 1.5 81 4.5 89C11 82 18 76 26 72C34 68 42 66 50 63Z" fill={p.tail} stroke={o} strokeWidth={1.1} />
      <path d="M48 58Q27 63 8 86M48 58Q31 60 15 78M48 58Q35 58 23 70M48 58Q39 57 32 64" fill="none" stroke={p.wingEdge} strokeWidth={0.7} />
      <path d="M44 51.5L42 48M38 51L35.5 47.5M32 52L29 49M26 54L22.5 51.5M20 57.5L16.5 55.5M14.5 62L11 60.5" fill="none" stroke={o} strokeWidth={0.6} />
      {eyes.map(([ex, ey, rot, k], i) => (
        <g key={i} transform={`translate(${ex} ${ey}) rotate(${rot}) scale(${k})`}>
          <ellipse rx={4.3} ry={3} fill={p.eyeOuter} stroke={o} strokeWidth={0.6} />
          <ellipse rx={2.8} ry={1.95} fill={p.eyeMid} />
          <ellipse rx={1.45} ry={1.05} fill={p.eyeInner} />
        </g>
      ))}
      {/* legs */}
      <path d="M57 63L55 77M65 62L66 77M51 78H59M62 78H70" fill="none" stroke={p.beak} strokeWidth={1.7} />
      {/* neck and head */}
      <path d="M63 41C64 31 69 22 75 16C79 12 86 12 86 18C86 23 79 27 76 34C74 39 74 43 72 46Z" fill={p.body} stroke={o} strokeWidth={1.1} />
      {/* body */}
      <path d="M45 55C43 41 57 33 69 39C79 45 77 61 63 65C53 68 46 63 45 55Z" fill={p.body} stroke={o} strokeWidth={1.1} />
      {[[67.5, 35], [70.5, 29], [73.5, 23.5], [76.5, 19.5], [58, 60], [62.5, 61.5], [54, 57]].map(([cx, cy], i) => (
        <circle key={i} cx={cx} cy={cy} r={0.9} fill={p.dots} />
      ))}
      {/* wing */}
      <path d="M49 51C53 43 65 41 71 49C69 58 59 62 51 60C48 57 48 54 49 51Z" fill={p.wing} stroke={o} strokeWidth={0.9} />
      <path d="M52 49.5q3 3 6 0q3 3 6 0q2.5 2.5 4.5 0M51 54.5q3 3 6 0q3 3 6 0q2 2 3.5 0" fill="none" stroke={p.wingEdge} strokeWidth={0.7} />
      {/* face */}
      <path d="M79.5 15.8Q82.3 13.3 85.2 15.4Q82.3 18.3 79.5 15.8Z" fill="#FFFDF5" stroke={o} strokeWidth={0.4} />
      <circle cx={82.4} cy={15.6} r={1.05} fill={o} />
      <path d="M85.6 16.4L92.2 18.2L85.6 20.2Z" fill={p.beak} stroke={o} strokeWidth={0.6} />
      {/* crest */}
      <path d="M80 12.6L76.5 4M80.6 12.4L80.6 2.8M81.2 12.6L85 4" fill="none" stroke={o} strokeWidth={0.8} />
      {[[76.5, 4], [80.6, 2.8], [85, 4]].map(([cx, cy], i) => (
        <circle key={i} cx={cx} cy={cy} r={1.45} fill={p.crest} stroke={o} strokeWidth={0.5} />
      ))}
    </g>
  )
}

export type ParrotPalette = { body: string; wing: string; tail: string; tip: string; beak: string; collar: string; outline: string; legs: string }

/** A perched parrot facing right, anchored at its feet; ~60 units across. */
export function Parrot({ x, y, s, flip = false, p }: { x: number; y: number; s: number; flip?: boolean; p: ParrotPalette }) {
  const o = p.outline
  return (
    <g transform={`translate(${f(x)} ${f(y)}) scale(${flip ? -s : s} ${s}) translate(-26 -33)`} strokeLinejoin="round" strokeLinecap="round">
      <path d="M15 26C7 33 -3 41 -14 47L-10.5 49.5C0 45 10 38 19 30Z" fill={p.tail} stroke={o} strokeWidth={0.9} />
      <path d="M-14 47L-10.5 49.5L-7.5 46Z" fill={p.tip} stroke={o} strokeWidth={0.6} />
      <path d="M-4 41.5L9 32.5M-8 45L6 35" fill="none" stroke={o} strokeWidth={0.45} opacity={0.7} />
      <path d="M24 30.5L22.5 34M29 30L30 34M20.5 34.5H25.5M27.5 34.5H32.5" fill="none" stroke={p.legs} strokeWidth={1.3} />
      <path d="M12 22C11 12 22 6 32 9C40 12 40 26 30 30.5C22 33.5 13 30 12 22Z" fill={p.body} stroke={o} strokeWidth={1} />
      <circle cx={35} cy={10} r={6.6} fill={p.body} stroke={o} strokeWidth={1} />
      <path d="M29.5 12.5Q33.5 18 39 15.5" fill="none" stroke={p.collar} strokeWidth={1.3} />
      <path d="M40.2 6.2C45 6 47.4 11 44.3 15.4C43.4 13.6 41.6 12.4 39.6 12.4Z" fill={p.beak} stroke={o} strokeWidth={0.8} />
      <circle cx={36.6} cy={8} r={1.45} fill="#FFFDF5" stroke={o} strokeWidth={0.4} />
      <circle cx={36.9} cy={8} r={0.7} fill={o} />
      <path d="M16 19C20 13 30 13 32 19C29 26 21 27 17 24Z" fill={p.wing} stroke={o} strokeWidth={0.8} />
      <path d="M19 19.5q2.5 2.4 5 0q2.5 2.4 5 0M18.5 23q2.5 2 5 0q2.2 2 4.4 0" fill="none" stroke={o} strokeWidth={0.45} />
    </g>
  )
}

// ── Lotus ──────────────────────────────────────────────────────────────────

export type LotusPalette = { dark: string; mid: string; light: string; sepal: string; outline: string }

/** A side-view lotus opening upward, base at (x, y); ~48 × 30 units. */
export function LotusSide({ x, y, s, p, rotate = 0 }: { x: number; y: number; s: number; p: LotusPalette; rotate?: number }) {
  const half = (
    <>
      <path d="M0 0C-9 2-19 1-24 -3C-15 -6 -6 -4 0 0Z" fill={p.sepal} stroke={p.outline} strokeWidth={0.7} />
      <path d="M0 0C-8 -1-17 -9-19 -20C-11 -18-4 -11 0 0Z" fill={p.dark} stroke={p.outline} strokeWidth={0.7} />
      <path d="M0 0C-5 -4-11 -14-9.5 -25C-4.5 -21-1 -12 0 0Z" fill={p.mid} stroke={p.outline} strokeWidth={0.7} />
      <path d="M-2.5 -2Q-11 -8-15.5 -16.5M-1.8 -3.5Q-6 -12-7.2 -20.5" fill="none" stroke={p.outline} strokeWidth={0.4} opacity={0.6} />
    </>
  )
  return (
    <g transform={`translate(${f(x)} ${f(y)}) rotate(${rotate}) scale(${s})`} strokeLinejoin="round">
      {half}
      <g transform="scale(-1 1)">{half}</g>
      <path d="M0 -29C5 -21 5 -8 0 0C-5 -8-5 -21 0 -29Z" fill={p.light} stroke={p.outline} strokeWidth={0.7} />
      <path d="M0 -4L0 -24" stroke={p.outline} strokeWidth={0.4} opacity={0.6} />
      <ellipse cx={0} cy={0.6} rx={6} ry={1.6} fill={p.sepal} stroke={p.outline} strokeWidth={0.6} />
    </g>
  )
}

/** A top-view lotus rosette (mandala), centred at (x, y), radius ~r. */
export function LotusRosette({ x, y, r, outer, inner, center, outline, sw = 0.3 }: {
  x: number; y: number; r: number; outer: string; inner: string; center: string; outline: string; sw?: number
}) {
  const petal = `M0 0C${f(r * 0.3)} ${f(-r * 0.3)} ${f(r * 0.3)} ${f(-r * 0.8)} 0 ${f(-r)}C${f(-r * 0.3)} ${f(-r * 0.8)} ${f(-r * 0.3)} ${f(-r * 0.3)} 0 0Z`
  return (
    <g transform={`translate(${f(x)} ${f(y)})`}>
      {Array.from({ length: 8 }, (_, i) => (
        <path key={`o${i}`} d={petal} transform={`rotate(${i * 45})`} fill={outer} stroke={outline} strokeWidth={sw} />
      ))}
      {Array.from({ length: 8 }, (_, i) => (
        <path key={`i${i}`} d={petal} transform={`rotate(${i * 45 + 22.5}) scale(0.66)`} fill={inner} stroke={outline} strokeWidth={sw} />
      ))}
      <circle r={f(r * 0.24)} fill={center} stroke={outline} strokeWidth={sw} />
      {Array.from({ length: 8 }, (_, i) => {
        const a = (i * Math.PI) / 4
        return <circle key={`d${i}`} cx={f(Math.cos(a) * r * 0.36)} cy={f(Math.sin(a) * r * 0.36)} r={f(r * 0.05)} fill={outline} />
      })}
    </g>
  )
}

/** A round lily pad with its notch, centred at (x, y). */
export function LilyPad({ x, y, rx, ry, fill, outline }: { x: number; y: number; rx: number; ry: number; fill: string; outline: string }) {
  return (
    <g transform={`translate(${f(x)} ${f(y)})`}>
      <path d={`M0 0L${f(rx * 0.95)} ${f(-ry * 0.3)}A${rx} ${ry} 0 1 0 ${f(rx * 0.95)} ${f(ry * 0.3)}Z`} fill={fill} stroke={outline} strokeWidth={0.4} />
      <path d={`M0 0L${f(-rx * 0.8)} 0M0 0L${f(-rx * 0.5)} ${f(-ry * 0.75)}M0 0L${f(-rx * 0.5)} ${f(ry * 0.75)}`} stroke={outline} strokeWidth={0.25} opacity={0.6} />
    </g>
  )
}

// ── Fish ───────────────────────────────────────────────────────────────────

export type FishPalette = { body: string; fin: string; scale: string; outline: string }

/** A Madhubani fish facing right, centred at (x, y); ~58 units long. */
export function Fish({ x, y, s, flip = false, rotate = 0, p }: {
  x: number; y: number; s: number; flip?: boolean; rotate?: number; p: FishPalette
}) {
  const o = p.outline
  return (
    <g transform={`translate(${f(x)} ${f(y)}) rotate(${rotate}) scale(${flip ? -s : s} ${s})`} strokeLinejoin="round" strokeLinecap="round">
      <path d="M-17 0C-22 -4-27 -10-31 -10.5C-27.5 -4-27.5 4-31 10.5C-27 10-22 4-17 0Z" fill={p.fin} stroke={o} strokeWidth={0.9} />
      <path d="M-4 -9C0 -16 6 -16 8.5 -10.5Z" fill={p.fin} stroke={o} strokeWidth={0.8} />
      <path d="M-2 9C1 14.5 6 14.5 7.5 9.5Z" fill={p.fin} stroke={o} strokeWidth={0.8} />
      <path d="M-18 0C-10 -11.5 8 -12.5 21 0C8 12.5-10 11.5-18 0Z" fill={p.body} stroke={o} strokeWidth={1} />
      {[-12, -6, 0, 6].flatMap(sx => [-4.5, 0, 4.5].map(sy => (
        <path key={`${sx}${sy}`} d={`M${sx} ${f(sy - 2)}q2.4 2 0 4`} fill="none" stroke={p.scale} strokeWidth={0.6} />
      )))}
      <path d="M11 -8.2C8 -3 8 3 11 8.2" fill="none" stroke={o} strokeWidth={0.8} />
      <circle cx={15} cy={-2} r={2.3} fill="#FFFDF5" stroke={o} strokeWidth={0.6} />
      <circle cx={15.4} cy={-2} r={1.1} fill={o} />
      <path d="M19.5 1.8q-1.4 1-2.8 0.4" fill="none" stroke={o} strokeWidth={0.6} />
    </g>
  )
}

// ── Sun and moon (kohbar) ──────────────────────────────────────────────────

export type SunPalette = { disc: string; rayA: string; rayB: string; lips: string; outline: string }

/** A Madhubani sun with a face, centred at (x, y); radius ~16 units with rays. */
export function SunFace({ x, y, s, p }: { x: number; y: number; s: number; p: SunPalette }) {
  const o = p.outline
  const rays = Array.from({ length: 16 }, (_, i) => {
    const a = (i * Math.PI) / 8, d = Math.PI / 16
    const pt = (ang: number, r: number) => `${f(Math.cos(ang) * r)},${f(Math.sin(ang) * r)}`
    return <polygon key={i} points={`${pt(a - d, 10.4)} ${pt(a, 16.5)} ${pt(a + d, 10.4)}`} fill={i % 2 ? p.rayB : p.rayA} stroke={o} strokeWidth={0.35} />
  })
  return (
    <g transform={`translate(${f(x)} ${f(y)}) scale(${s})`} strokeLinejoin="round" strokeLinecap="round">
      {rays}
      <circle r={10.6} fill={p.disc} stroke={o} strokeWidth={0.7} />
      <circle r={9} fill="none" stroke={p.rayA} strokeWidth={0.45} />
      <path d="M-5.2 -1.8q2.3 -2.1 4.5 0q-2.2 1.9 -4.5 0ZM0.7 -1.8q2.3 -2.1 4.5 0q-2.2 1.9 -4.5 0Z" fill="#FFFDF5" stroke={o} strokeWidth={0.4} />
      <circle cx={-2.9} cy={-1.8} r={0.8} fill={o} />
      <circle cx={2.9} cy={-1.8} r={0.8} fill={o} />
      <path d="M-5.4 -3.9q2.6 -1.6 5 -0.3M0.4 -4.2q2.4 -1.3 5 0.3" fill="none" stroke={o} strokeWidth={0.45} />
      <path d="M0 -1L-0.9 2.4L0.7 2.7" fill="none" stroke={o} strokeWidth={0.45} />
      <path d="M-2.7 4.7q2.7 2 5.4 0q-2.7 1 -5.4 0Z" fill={p.lips} stroke={o} strokeWidth={0.35} />
      <circle cx={0} cy={-5.6} r={0.75} fill={p.lips} />
    </g>
  )
}

/** A crescent moon with a face and stars, centred at (x, y). */
export function MoonFace({ x, y, s, fill, star, outline }: { x: number; y: number; s: number; fill: string; star: string; outline: string }) {
  const starPath = (sx: number, sy: number, r: number) =>
    `M${sx} ${f(sy - r)}L${f(sx + r * 0.3)} ${f(sy - r * 0.3)}L${f(sx + r)} ${sy}L${f(sx + r * 0.3)} ${f(sy + r * 0.3)}L${sx} ${f(sy + r)}L${f(sx - r * 0.3)} ${f(sy + r * 0.3)}L${f(sx - r)} ${sy}L${f(sx - r * 0.3)} ${f(sy - r * 0.3)}Z`
  return (
    <g transform={`translate(${f(x)} ${f(y)}) scale(${s})`} strokeLinejoin="round">
      <path d="M2 -13A13 13 0 0 0 2 13A18 18 0 0 1 2 -13Z" fill={fill} stroke={outline} strokeWidth={0.7} />
      <path d="M-8.5 -2.5q1.8 -1.5 3.6 0q-1.8 1.5 -3.6 0Z" fill="#FFFDF5" stroke={outline} strokeWidth={0.35} />
      <circle cx={-6.7} cy={-2.5} r={0.7} fill={outline} />
      <path d="M-9.5 3.2q1.6 1.5 3.4 0.5" fill="none" stroke={outline} strokeWidth={0.45} />
      <path d={`${starPath(9, -9, 2.6)}${starPath(12, 4, 1.8)}${starPath(6, 11, 1.5)}`} fill={star} stroke={outline} strokeWidth={0.3} />
    </g>
  )
}

/** A short leafy branch for a bird to perch on. */
export function Branch({ d, leaves, stem, leaf, outline }: {
  d: string; leaves: Array<[number, number, number]>; stem: string; leaf: string; outline: string
}) {
  return (
    <g>
      <path d={d} fill="none" stroke={stem} strokeWidth={0.9} strokeLinecap="round" />
      {leaves.map(([x, y, a], i) => <Leaf key={i} x={x} y={y} angle={a} len={4.6} fill={leaf} stroke={outline} />)}
    </g>
  )
}
