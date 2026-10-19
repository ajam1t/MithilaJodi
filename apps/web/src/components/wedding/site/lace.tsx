/**
 * Lace artwork for Blush Lace Elegance — plain SVG, computed once and identical
 * on server and browser. Fine white lace with eyelets on blush, champagne gold
 * hairlines, small floral sprigs. Purely decorative: every caller hides it from
 * assistive technology, and nothing here carries a CSS filter (large filtered
 * layers exhaust graphics memory on iPhones).
 */

/** Server and browser trig can differ in the last digit — round so hydration matches. */
const r1 = (n: number) => Math.round(n * 10) / 10

const LACE = '#FFFFFF'
const GOLD = '#C8A96B'
const ROSE = '#E8C5CA'

/** A five-petal blossom with a dotted heart. */
function blossom(cx: number, cy: number, r: number): string {
  let d = ''
  for (let k = 0; k < 5; k++) {
    const a = (k / 5) * Math.PI * 2 - Math.PI / 2
    const a1 = a - 0.55, a2 = a + 0.55
    d += `M${r1(cx + Math.cos(a1) * r * 0.25)} ${r1(cy + Math.sin(a1) * r * 0.25)}C${r1(cx + Math.cos(a1) * r * 1.15)} ${r1(cy + Math.sin(a1) * r * 1.15)} ${r1(cx + Math.cos(a2) * r * 1.15)} ${r1(cy + Math.sin(a2) * r * 1.15)} ${r1(cx + Math.cos(a2) * r * 0.25)} ${r1(cy + Math.sin(a2) * r * 0.25)}`
  }
  return d
}

/**
 * The cover frame: an oval of lace scallops, each with an eyelet, a dotted inner
 * rule and blossoms at the four quarters. Drawn in a 600 × 800 box.
 */
const OVAL = (() => {
  const cx = 300, cy = 400, rx = 262, ry = 362, n = 64
  let scallops = '', eyelets = '', dots = '', sprigs = ''
  for (let i = 0; i < n; i++) {
    const a0 = (i / n) * Math.PI * 2, a1 = ((i + 1) / n) * Math.PI * 2, am = (a0 + a1) / 2
    const p0 = [cx + Math.cos(a0) * rx, cy + Math.sin(a0) * ry], p1 = [cx + Math.cos(a1) * rx, cy + Math.sin(a1) * ry]
    const out = [cx + Math.cos(am) * (rx + 26), cy + Math.sin(am) * (ry + 26)]
    scallops += `${i ? 'L' : 'M'}${r1(p0[0])} ${r1(p0[1])}Q${r1(out[0])} ${r1(out[1])} ${r1(p1[0])} ${r1(p1[1])}`
    const e = [cx + Math.cos(am) * (rx + 10), cy + Math.sin(am) * (ry + 10)]
    eyelets += `<circle cx="${r1(e[0])}" cy="${r1(e[1])}" r="3.2"/>`
    if (i % 2 === 0) { const d = [cx + Math.cos(a0) * (rx - 14), cy + Math.sin(a0) * (ry - 14)]; dots += `<circle cx="${r1(d[0])}" cy="${r1(d[1])}" r="1.6"/>` }
  }
  for (const a of [-Math.PI / 2, Math.PI / 2, 0, Math.PI]) {
    const x = cx + Math.cos(a) * (rx + 4), y = cy + Math.sin(a) * (ry + 4)
    sprigs += blossom(x, y, 16) + blossom(x - 26, y + (a === Math.PI / 2 ? -10 : 10) * (a === 0 || a === Math.PI ? 0 : 1), 9) + blossom(x + 26, y + (a === Math.PI / 2 ? -10 : 10) * (a === 0 || a === Math.PI ? 0 : 1), 9)
  }
  return { scallops: `${scallops}Z`, eyelets, dots, sprigs, inner: `M${cx - rx + 14} ${cy}a${rx - 14} ${ry - 14} 0 1 0 ${2 * (rx - 14)} 0a${rx - 14} ${ry - 14} 0 1 0 ${-2 * (rx - 14)} 0` }
})()

export function LaceOval({ className = '' }: { className?: string }) {
  return (
    <svg viewBox="-10 -10 620 820" className={className} aria-hidden="true" focusable="false" preserveAspectRatio="none">
      <path d={OVAL.scallops} fill={LACE} fillOpacity="0.92" stroke={ROSE} strokeWidth="1.4" />
      <path d={OVAL.inner} fill="none" stroke={GOLD} strokeWidth="1.2" />
      <g fill={ROSE}>{/* eyelets punched through the lace */}<g dangerouslySetInnerHTML={{ __html: OVAL.eyelets }} /></g>
      <g fill={GOLD} dangerouslySetInnerHTML={{ __html: OVAL.dots }} />
      <path d={OVAL.sprigs} fill={LACE} stroke={GOLD} strokeWidth="1.1" />
    </svg>
  )
}

/**
 * A lace edge between sections: scallops with eyelets and a tiny blossom on
 * every third, repeated across the width without stretching. `fill` is the
 * colour of the lace; the band sits on the section above it.
 */
export function LaceEdge({ fill = LACE, eyelet = ROSE, flip = false, id }: { fill?: string; eyelet?: string; flip?: boolean; id: string }) {
  return (
    <svg className="wd-lace-edge" width="100%" height="34" aria-hidden="true" focusable="false" style={flip ? { transform: 'scaleY(-1)' } : undefined}>
      <defs>
        <pattern id={id} width="48" height="34" patternUnits="userSpaceOnUse">
          <path d="M0 0H48V12Q36 34 24 22Q12 34 0 12Z" fill={fill} />
          <circle cx="12" cy="16" r="2.6" fill={eyelet} />
          <circle cx="36" cy="16" r="2.6" fill={eyelet} />
          <circle cx="24" cy="8" r="1.4" fill={eyelet} />
        </pattern>
      </defs>
      <rect width="100%" height="34" fill={`url(#${id})`} />
    </svg>
  )
}

/** Ribbon and bow line art for the darker bands, drawn in a 600 × 120 box. */
export function Ribbon({ className = '', color = '#FFFFFF' }: { className?: string; color?: string }) {
  return (
    <svg viewBox="0 0 600 120" className={className} aria-hidden="true" focusable="false" fill="none" stroke={color} strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
      <path d="M8 70C70 20 130 110 200 62S300 30 300 60" opacity="0.85" />
      <path d="M592 70C530 20 470 110 400 62S300 30 300 60" opacity="0.85" />
      {/* the bow */}
      <path d="M300 60C278 34 246 34 250 56 254 76 282 70 300 60ZM300 60C322 34 354 34 350 56 346 76 318 70 300 60Z" />
      <path d="M300 60C292 78 280 96 268 108M300 60C308 78 320 96 332 108" />
      <circle cx="300" cy="60" r="5" />
      {[[92, 56], [160, 84], [440, 84], [508, 56]].map(([x, y]) => <circle key={x} cx={x} cy={y} r="2.2" fill={color} stroke="none" />)}
    </svg>
  )
}

/** A small lace rosette (the veil's seal): petals of scallops around a ring. */
const ROSETTE = (() => {
  let petals = ''
  const n = 18
  for (let i = 0; i < n; i++) {
    const a = (i / n) * Math.PI * 2
    const [x, y] = [Math.cos(a) * 46, Math.sin(a) * 46]
    petals += `<circle cx="${r1(x)}" cy="${r1(y)}" r="11"/>`
  }
  return petals
})()

export function LaceRosette({ className = '' }: { className?: string }) {
  return (
    <svg viewBox="-62 -62 124 124" className={className} aria-hidden="true" focusable="false">
      <g fill="#FFFDFB" stroke={ROSE} strokeWidth="1.2" dangerouslySetInnerHTML={{ __html: ROSETTE }} />
      <circle r="44" fill="#FFFDFB" stroke={GOLD} strokeWidth="1.6" />
      <circle r="38" fill="none" stroke={GOLD} strokeWidth="0.8" strokeDasharray="1.4 3" />
    </svg>
  )
}
