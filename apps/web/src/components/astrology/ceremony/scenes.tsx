'use client'

/**
 * One scene per tool for AstroCeremony. Each takes the real result and returns
 * what to draw at a frame, plus the caption to land on. Before the result
 * arrives a scene shows only motion; every position it lands on comes from the
 * calculation (planet longitudes, the Moon's nakshatra and rashi, the house of
 * Mars, the name syllables, the auspicious days).
 */
import type { ReactNode } from 'react'
import type {
  BabyNamesReading, ChartData, CompatibilityResult, JanamKundliResult, ManglikReading, NakshatraReading, RashiReading,
  VivahMuhuratResult,
} from '@/lib/astrology/types'
import { GRAHAS, NAKSHATRAS, RASHIS } from '@/lib/astrology/vedic/zodiac'
import { points } from '../kundli/format'
import { C, Starfield, at, eio, eo, r1, seg, type CeremonyFrame } from './AstroCeremony'

export type Scene = {
  draw: (f: CeremonyFrame) => ReactNode
  landed: { hi: string; en: string } | null
}

/** Landing length, matching AstroCeremony's default. */
const DUR = 2.2
const GOLD = '#E9C977', IVORY = '#FFFAF0', MAROON = '#7A1220'

/** Before the result: the sky turning slowly. Shared by every scene. */
const searching = (t: number, speed = 40) => <Starfield rot={-t * speed} trail={speed > 60 ? speed * 0.18 : 0} t={t} />

/** The 12 signs as a ring of Devanagari names; `lit` highlights one. */
function SignRing({ r, rot = 0, opacity = 1, lit = -1, litU = 0 }: { r: number; rot?: number; opacity?: number; lit?: number; litU?: number }) {
  return (
    <g opacity={opacity}>
      <circle cx={C} cy={C} r={r + 26} fill="none" stroke={GOLD} strokeOpacity=".55" strokeWidth="1.2" />
      <circle cx={C} cy={C} r={r - 26} fill="none" stroke={GOLD} strokeOpacity=".55" strokeWidth="1.2" />
      {RASHIS.map((s, i) => {
        const a0 = i * 30 + rot
        const [x0, y0] = at(r - 26, a0), [x1, y1] = at(r + 26, a0)
        const [tx, ty] = at(r, a0 + 15)
        const on = i === lit
        return (
          <g key={s.slug}>
            <path d={`M${x0} ${y0}L${x1} ${y1}`} stroke={GOLD} strokeOpacity=".4" strokeWidth="1" />
            {on && litU > 0 && <path d={arc(r, a0, a0 + 30, 52)} fill={GOLD} opacity={r1(0.35 * litU * 10) / 10} />}
            <text x={tx} y={ty + 7} textAnchor="middle" fontFamily="var(--font-rozha), 'Rozha One', serif" fontSize={on ? 21 : 17}
              fill={on && litU > 0 ? '#FFF6D8' : '#E8DCC4'} opacity={on || lit < 0 ? 1 : 0.7}>{s.hi}</text>
          </g>
        )
      })}
    </g>
  )
}
/** A ring band from a0 to a1 (degrees), `w` wide, centred on radius r. */
function arc(r: number, a0: number, a1: number, w: number) {
  const ro = r + w / 2, ri = r - w / 2
  const [x0, y0] = at(ro, a0), [x1, y1] = at(ro, a1), [x2, y2] = at(ri, a1), [x3, y3] = at(ri, a0)
  const big = a1 - a0 > 180 ? 1 : 0
  return `M${x0} ${y0}A${ro} ${ro} 0 ${big} 1 ${x1} ${y1}L${x2} ${y2}A${ri} ${ri} 0 ${big} 0 ${x3} ${y3}Z`
}
function Orb({ x, y, r, color = GOLD, glow = 1 }: { x: number; y: number; r: number; color?: string; glow?: number }) {
  return (
    <g>
      <circle cx={x} cy={y} r={r * 3.2} fill="url(#cer-glow)" opacity={r1(glow * 0.8 * 10) / 10} />
      <circle cx={x} cy={y} r={r} fill={color} stroke={IVORY} strokeWidth="1.5" />
    </g>
  )
}
/** North Indian chart (square, diagonals, inner diamond), drawn in by `u`. */
function NorthChart({ size, u, stroke = GOLD }: { size: number; u: number; stroke?: string }) {
  const h = size / 2, x0 = C - h, y0 = C - h, x1 = C + h, y1 = C + h
  const L = size * 4
  const dash = { strokeDasharray: L, strokeDashoffset: r1(L * (1 - eo(u))) }
  return (
    <g fill="none" stroke={stroke} strokeWidth="2" strokeLinejoin="round">
      <rect x={x0} y={y0} width={size} height={size} style={dash} />
      <path d={`M${x0} ${y0}L${x1} ${y1}M${x1} ${y0}L${x0} ${y1}`} style={{ strokeDasharray: L / 1.4, strokeDashoffset: r1((L / 1.4) * (1 - eo(seg(u, 0.15, 1)))) }} />
      <path d={`M${C} ${y0}L${x1} ${C}L${C} ${y1}L${x0} ${C}Z`} style={{ strokeDasharray: L, strokeDashoffset: r1(L * (1 - eo(seg(u, 0.3, 1)))) }} />
    </g>
  )
}
/** Centres of the 12 houses of a North Indian chart of the given size (house 1 top-centre, anticlockwise). */
function houseCentre(house: number, size: number): [number, number] {
  const q = size / 4
  const P: Array<[number, number]> = [[0, -1], [-1, -1.55], [-1.55, -1], [-1, 0], [-1.55, 1], [-1, 1.55], [0, 1], [1, 1.55], [1.55, 1], [1, 0], [1.55, -1], [1, -1.55]]
  const [dx, dy] = P[(house - 1 + 12) % 12]
  return [r1(C + dx * q), r1(C + dy * q)]
}
const deva = "var(--font-rozha), 'Rozha One', serif"

// ── Janam Kundli: the sky at your birth ──────────────────────────────────────
export function janamScene(result: JanamKundliResult | null): Scene {
  const chart = result?.chart
  return {
    draw: ({ t, land }) => {
      if (land === null || !chart) return searching(t, 140)                       // the sky rewinds…
      const slow = 140 * (1 - eo(seg(land, 0, 0.32)))                            // …and slows to the moment
      const ringU = seg(land, 0.18, 0.45)
      return (
        <g>
          <Starfield rot={-t * 40 - 200 * eo(seg(land, 0, 0.32))} trail={slow * 0.18} t={t} opacity={1 - 0.35 * ringU} />
          <SignRing r={232} opacity={eo(ringU)} />
          <NorthChart size={250} u={seg(land, 0.62, 1)} />
          {chart.planets.map((p, i) => {
            const u = eo(seg(land, 0.3 + i * 0.035, 0.62 + i * 0.035))
            // three orbits, so planets sharing a sign do not sit on top of each other
            const [x, y] = at((196 - (i % 3) * 24) * u, p.longitude)
            const g = GRAHAS.find(g => g.id === p.id)
            return (
              <g key={p.id} opacity={u}>
                <Orb x={x} y={y} r={p.id === 'moon' ? 7 : 5.5} color={p.id === 'moon' ? '#FFF6D8' : p.id === 'sun' ? '#FFC14D' : p.id === 'mars' ? '#E0503A' : GOLD} glow={u} />
                <text x={x} y={y - 12} textAnchor="middle" fontSize="12" fontWeight="600" fill="#FFF1C2" opacity={seg(land, 0.55, 0.7)}>{g?.abbr}</text>
              </g>
            )
          })}
          {chart.lagna && (() => {
            const u = seg(land, 0.55, 0.75)
            const [x, y] = at(262, chart.lagna!.longitude), [xi, yi] = at(246, chart.lagna!.longitude)
            return <g opacity={u}><path d={`M${xi} ${yi}L${x} ${y}`} stroke="#FFE7A6" strokeWidth="3" /><circle cx={x} cy={y} r="5" fill="#FFE7A6" /></g>
          })()}
        </g>
      )
    },
    landed: chart ? {
      hi: `${chart.lagna ? `लग्न ${RASHIS[chart.lagna.rashiIndex].hi} · ` : ''}चन्द्र ${RASHIS[chart.moon.rashiIndex].hi}`,
      en: `The sky at your birth${chart.lagna ? ` — Lagna ${RASHIS[chart.lagna.rashiIndex].name}` : ''}, Moon in ${NAKSHATRAS[chart.moon.nakshatraIndex].name}`,
    } : null,
  }
}

// ── Nakshatra: the Moon travels the 27 mansions ───────────────────────────────
export function nakshatraScene(result: NakshatraReading | null): Scene {
  const moon = result?.chart.moon
  const idx = moon?.nakshatraIndex ?? 0
  const span = 360 / 27
  return {
    draw: ({ t, land }) => {
      const ringOp = land === null ? 0.75 : 1
      const target = idx * span + span / 2
      // the Moon spins while waiting, then eases (one more lap) onto its nakshatra
      const startA = ((land === null ? t : t - land * DUR) * 160) % 360
      const moonA = land === null ? startA : startA + (((target - startA) % 360 + 360) % 360 + 360) * eio(seg(land, 0, 0.55))
      const [mx, my] = at(232, moonA)
      const lit = land === null ? 0 : seg(land, 0.5, 0.65)
      const con = land === null ? 0 : seg(land, 0.6, 1)
      return (
        <g>
          <Starfield rot={-t * 12} t={t} />
          <g opacity={ringOp}>
            <circle cx={C} cy={C} r={258} fill="none" stroke={GOLD} strokeOpacity=".5" />
            <circle cx={C} cy={C} r={206} fill="none" stroke={GOLD} strokeOpacity=".5" />
            {NAKSHATRAS.map((n, i) => {
              const [x0, y0] = at(206, i * span), [x1, y1] = at(258, i * span)
              return <g key={n.slug}>
                <path d={`M${x0} ${y0}L${x1} ${y1}`} stroke={GOLD} strokeOpacity=".35" />
                {i === idx && lit > 0 && <path d={arc(232, i * span, (i + 1) * span, 52)} fill={GOLD} opacity={r1(0.45 * lit * 10) / 10} />}
              </g>
            })}
          </g>
          <Orb x={mx} y={my} r={10} color="#FFF6D8" />
          {con > 0 && (
            <g>
              {/* a radiant star — symbolic, not a drawing of the nakshatra's stars */}
              <circle cx={C} cy={C - 30} r={r1(110 * eo(con))} fill="url(#cer-glow)" opacity=".55" />
              {Array.from({ length: 12 }, (_, k) => {
                const [x0, y0] = at(18, k * 30), [x1, y1] = at(18 + 46 * eo(con), k * 30)
                return <path key={k} d={`M${x0} ${r1(y0 - 30)}L${x1} ${r1(y1 - 30)}`} stroke="#FFE7A6" strokeWidth={k % 2 ? 1.2 : 2.2} strokeOpacity=".8" strokeLinecap="round" />
              })}
              <circle cx={C} cy={C - 30} r="9" fill="#FFF6D8" />
              <text x={C} y={C + 120} textAnchor="middle" fontFamily={deva} fontSize="40" fill="#FFF1C2" opacity={seg(con, 0.3, 0.8)}>{NAKSHATRAS[idx].hi}</text>
            </g>
          )}
        </g>
      )
    },
    landed: moon ? { hi: `${NAKSHATRAS[idx].hi} नक्षत्र${moon.pada ? ` · चरण ${moon.pada}` : ''}`, en: `Janma Nakshatra: ${NAKSHATRAS[idx].name}${moon.pada ? `, pada ${moon.pada}` : ''}` } : null,
  }
}

// ── Rashi: the zodiac wheel turns to your Moon sign ──────────────────────────
export function rashiScene(result: RashiReading | null): Scene {
  const ri = result?.chart.moon.rashiIndex ?? 0
  return {
    draw: ({ t, land }) => {
      // the wheel spins while waiting; on landing it eases so the Moon's sign sits at the top
      const end = -(ri * 30 + 15)
      const from = -(((land === null ? t : t - land * DUR) * 90) % 360)
      const rot = land === null ? from : from - ((((from - end) % 360) + 360) % 360 + 360) * eio(seg(land, 0, 0.6))
      const lit = land === null ? 0 : seg(land, 0.55, 0.75)
      const name = land === null ? 0 : seg(land, 0.62, 0.95)
      return (
        <g>
          <Starfield rot={-t * 10} t={t} />
          <SignRing r={226} rot={rot} lit={ri} litU={lit} />
          <path d={`M${C - 12} 30L${C} 52L${C + 12} 30Z`} fill="#FFE7A6" />
          {name > 0 && (
            <g opacity={name}>
              <circle cx={C} cy={C} r={r1(150 * eo(name))} fill="url(#cer-glow)" opacity=".5" />
              <text x={C} y={C + 22} textAnchor="middle" fontFamily={deva} fontSize="76" fill="#FFF1C2">{RASHIS[ri].hi}</text>
              <text x={C} y={C + 62} textAnchor="middle" fontSize="18" letterSpacing="4" fill={GOLD}>{RASHIS[ri].name.toUpperCase()}</text>
            </g>
          )}
        </g>
      )
    },
    landed: result ? { hi: `चन्द्र राशि: ${RASHIS[ri].hi}`, en: `Your Janma Rashi (Moon sign): ${RASHIS[ri].name} · ${RASHIS[ri].western}` } : null,
  }
}

// ── Manglik: Mars walks the twelve houses ────────────────────────────────────
const MANGLIK_HOUSES = [1, 2, 4, 7, 8, 12]
export function manglikScene(result: ManglikReading | null): Scene {
  const m = result?.manglik
  const fromLagna = m?.marsHouseFromLagna ?? null
  const house = fromLagna ?? m?.marsHouseFromMoon ?? 1
  const size = 380
  return {
    draw: ({ t, land }) => {
      // waiting: Mars circles the chart; landing: it steps house by house and stops in its house
      const steps = house - 1 + 12
      const stepU = land === null ? 0 : eio(seg(land, 0, 0.7))
      const pos = land === null ? (t * 3) % 12 : stepU * steps
      const cur = Math.floor(pos) % 12 + 1
      const [x0, y0] = houseCentre(cur, size), [x1, y1] = houseCentre((cur % 12) + 1, size)
      const fr = pos - Math.floor(pos)
      const mx = r1(x0 + (x1 - x0) * fr), my = r1(y0 + (y1 - y0) * fr)
      return (
        <g>
          <Starfield rot={-t * 8} t={t} opacity={0.7} />
          <NorthChart size={size} u={1} stroke="rgba(233,201,119,.7)" />
          {MANGLIK_HOUSES.map(h => {
            const [hx, hy] = houseCentre(h, size)
            const on = land !== null && land > 0.75 && h === house
            return <circle key={h} cx={hx} cy={hy} r={on ? 30 : 22} fill="none" stroke={on ? '#FFE7A6' : '#E0503A'} strokeOpacity={on ? 1 : 0.45} strokeWidth={on ? 3 : 1.5} strokeDasharray={on ? undefined : '3 4'} />
          })}
          {Array.from({ length: 12 }, (_, i) => {
            const [hx, hy] = houseCentre(i + 1, size)
            return <text key={i} x={hx} y={hy + 30} textAnchor="middle" fontSize="11" fill="#E8DCC4" opacity=".6">{i + 1}</text>
          })}
          <Orb x={mx} y={my} r={11} color="#E0503A" />
          <text x={mx} y={my + 4} textAnchor="middle" fontFamily={deva} fontSize="11" fill={IVORY}>मं</text>
        </g>
      )
    },
    landed: m ? {
      hi: `मंगल ${fromLagna !== null ? 'लग्न' : 'चन्द्र'} से भाव ${house} में`,
      en: `Mars in house ${house} from the ${fromLagna !== null ? 'Lagna' : 'Moon'} — ${m.label}`,
    } : null,
  }
}

// ── Baby Names: syllables gather out of the stars ────────────────────────────
export function babyScene(result: BabyNamesReading | null): Scene {
  const syl = result?.candidates ?? []
  const shown = syl.slice(0, 3)
  return {
    draw: ({ t, land }) => {
      const gather = land === null ? 0 : eo(seg(land, 0, 0.6))
      return (
        <g>
          <Starfield rot={-t * 14} t={t} opacity={1 - 0.4 * gather} />
          {land !== null && shown.map((s, k) => {
            const n = shown.length
            const tx = C + (k - (n - 1) / 2) * 170, ty = C + 10
            const sx = C + Math.cos(k * 2.1) * 260, sy = C + Math.sin(k * 2.1) * 260
            const u = eo(seg(land, 0.1 + k * 0.1, 0.65 + k * 0.1))
            const x = r1(sx + (tx - sx) * u), y = r1(sy + (ty - sy) * u)
            return (
              <g key={k} opacity={u}>
                <circle cx={x} cy={y - 26} r={r1(70 * u)} fill="url(#cer-glow)" opacity=".45" />
                <text x={x} y={y} textAnchor="middle" fontFamily={deva} fontSize={n > 1 ? 84 : 120} fill="#FFF1C2">{s.hi}</text>
                <text x={x} y={y + 42} textAnchor="middle" fontSize="18" letterSpacing="3" fill={GOLD}>{s.en.toUpperCase()}</text>
              </g>
            )
          })}
          {land !== null && <circle cx={C} cy={C} r={r1(40 + 220 * gather)} fill="none" stroke={GOLD} strokeOpacity={r1((1 - gather) * 0.8 * 10) / 10} />}
        </g>
      )
    },
    landed: shown.length ? {
      hi: `नामाक्षर: ${shown.map(s => s.hi).join(' · ')}`,
      en: shown.length > 1 ? `Name syllables for the possible padas: ${shown.map(s => s.en).join(', ')}` : `The name syllable for this nakshatra pada: “${shown[0].en}”`,
    } : null,
  }
}

// ── Compatibility: two charts meet ───────────────────────────────────────────
function MiniSky({ chart, cx, u, tint }: { chart: ChartData; cx: number; u: number; tint: string }) {
  const r = 150
  const pos = (lon: number, rr: number) => { const a = ((lon - 90) * Math.PI) / 180; return [r1(cx + rr * Math.cos(a)), r1(C + rr * Math.sin(a))] as const }
  const [mx, my] = pos(chart.moon.longitude, r * 0.78)
  const lg = chart.lagna ? pos(chart.lagna.longitude, r * 0.9) : null
  return (
    <g opacity={u}>
      <circle cx={cx} cy={C} r={r} fill={tint} fillOpacity=".12" stroke={GOLD} strokeOpacity=".7" strokeWidth="1.5" />
      <circle cx={cx} cy={C} r={r * 0.62} fill="none" stroke={GOLD} strokeOpacity=".35" strokeDasharray="2 5" />
      {Array.from({ length: 12 }, (_, i) => { const [x0, y0] = pos(i * 30, r * 0.62), [x1, y1] = pos(i * 30, r); return <path key={i} d={`M${x0} ${y0}L${x1} ${y1}`} stroke={GOLD} strokeOpacity=".3" /> })}
      <Orb x={mx} y={my} r={7} color="#FFF6D8" />
      {lg && <circle cx={lg[0]} cy={lg[1]} r="5" fill="#FFE7A6" />}
    </g>
  )
}
export function compatibilityScene(result: CompatibilityResult | null): Scene {
  const bride = result?.match.bride ?? null
  const groom = result?.match.groom ?? null
  const total = result?.match.total ?? 0
  return {
    draw: ({ t, land }) => {
      if (land === null || !bride || !groom) return (
        <g>{searching(t, 30)}
          <circle cx={C - 90 - Math.sin(t * 2) * 10} cy={C} r={140} fill="none" stroke={GOLD} strokeOpacity=".4" strokeDasharray="3 7" />
          <circle cx={C + 90 + Math.sin(t * 2) * 10} cy={C} r={140} fill="none" stroke={GOLD} strokeOpacity=".4" strokeDasharray="3 7" />
        </g>
      )
      const meet = eio(seg(land, 0, 0.5))
      const bx = r1(150 + (C - 70 - 150) * meet), gx = r1(450 + (C + 70 - 450) * meet)
      const thread = seg(land, 0.45, 0.8)
      const score = Math.round(total * eo(seg(land, 0.55, 0.95)) * 2) / 2
      const pos = (cx: number, lon: number, rr: number) => { const a = ((lon - 90) * Math.PI) / 180; return [r1(cx + rr * Math.cos(a)), r1(C + rr * Math.sin(a))] as const }
      const [b1, b2] = pos(bx, bride.moon.longitude, 117), [g1, g2] = pos(gx, groom.moon.longitude, 117)
      return (
        <g>
          <Starfield rot={-t * 10} t={t} opacity={0.8} />
          <MiniSky chart={bride} cx={bx} u={eo(seg(land, 0, 0.25))} tint="#E0503A" />
          <MiniSky chart={groom} cx={gx} u={eo(seg(land, 0, 0.25))} tint="#6F8FD8" />
          {thread > 0 && <path d={`M${b1} ${b2}Q${C} ${C - 160} ${g1} ${g2}`} fill="none" stroke="#FFE7A6" strokeWidth="2.4" style={{ strokeDasharray: 700, strokeDashoffset: r1(700 * (1 - eo(thread))) }} />}
          {land > 0.55 && (
            <g opacity={seg(land, 0.55, 0.7)}>
              <circle cx={C} cy={C + 175} r="54" fill="#1A1F3D" stroke={GOLD} strokeWidth="2" />
              <text x={C} y={C + 184} textAnchor="middle" fontSize="30" fontWeight="600" fill="#FFF1C2">{points(score)}</text>
              <text x={C} y={C + 206} textAnchor="middle" fontSize="11" fill={GOLD}>OF 36</text>
            </g>
          )}
        </g>
      )
    },
    landed: result ? { hi: 'दो कुण्डलियाँ, एक साथ', en: `Guna Milan ${points(total)} of 36 — then the Lagna, 7th house and Navamsa, compared` } : null,
  }
}

// ── Vivah Muhurat: the months turn and the shubh days light up ────────────────
export function vivahScene(result: VivahMuhuratResult | null): Scene {
  const byMonth = new Map<string, number[]>()
  // the same days the results list shows by default: those with a window that is not rikta
  const shown = (result?.days ?? []).filter(d => d.windows.some(w => !w.rikta))
  for (const d of shown) {
    const k = d.date.slice(0, 7)
    byMonth.set(k, [...(byMonth.get(k) ?? []), Number(d.date.slice(8, 10))])
  }
  const months = [...byMonth.entries()].slice(0, 6)
  const MN = ['जनवरी', 'फरवरी', 'मार्च', 'अप्रैल', 'मई', 'जून', 'जुलाई', 'अगस्त', 'सितम्बर', 'अक्टूबर', 'नवम्बर', 'दिसम्बर']
  const totalDays = shown.length
  return {
    draw: ({ t, land }) => {
      if (land === null || !months.length) {
        // waiting: calendar leaves flutter past
        return (
          <g>{searching(t, 16)}
            {[0, 1, 2].map(k => {
              const ph = (t * 0.9 + k / 3) % 1
              return <rect key={k} x={C - 110} y={C - 120} width="220" height="240" rx="14" fill={IVORY} fillOpacity={r1((1 - ph) * 0.25 * 10) / 10}
                stroke={GOLD} strokeOpacity={r1((1 - ph) * 10) / 10} transform={`rotate(${r1(-20 + ph * 40)} ${C} ${C + 200}) translate(${r1(ph * 120 - 60)} 0)`} />
            })}
          </g>
        )
      }
      // one page per month with auspicious days, flipping; the last stays
      const per = 0.75 / months.length
      const mi = Math.min(months.length - 1, Math.floor(land / per))
      const [key, days] = months[mi]
      const pu = seg(land, mi * per, mi * per + per * 0.9)
      const [y, m] = key.split('-').map(Number)
      const first = new Date(y, m - 1, 1).getDay(), dim = new Date(y, m, 0).getDate()
      return (
        <g>
          <Starfield rot={-t * 6} t={t} opacity={0.7} />
          <g transform={`translate(0 ${r1(14 * (1 - eo(seg(pu, 0, 0.3))))})`} opacity={seg(pu, 0, 0.2)}>
            <rect x={C - 190} y={C - 200} width="380" height="400" rx="20" fill={IVORY} stroke={GOLD} strokeWidth="2.5" />
            <text x={C} y={C - 150} textAnchor="middle" fontFamily={deva} fontSize="34" fill={MAROON}>{MN[m - 1]} {y}</text>
            {Array.from({ length: dim }, (_, i) => {
              const cell = first + i, col = cell % 7, row = Math.floor(cell / 7)
              const cx = C - 150 + col * 50, cy = C - 92 + row * 52
              const shubh = days.includes(i + 1)
              const bloom = shubh ? eo(seg(pu, 0.25 + (i / dim) * 0.4, 0.45 + (i / dim) * 0.4)) : 0
              return (
                <g key={i}>
                  {shubh && <circle cx={cx} cy={cy - 6} r={r1(20 * bloom)} fill="#E9C977" />}
                  {shubh && <circle cx={cx} cy={cy - 6} r={r1(30 * bloom)} fill="url(#cer-glow)" opacity=".6" />}
                  <text x={cx} y={cy} textAnchor="middle" fontSize="17" fontWeight={shubh ? 700 : 400} fill={shubh ? MAROON : '#9A8B78'}>{i + 1}</text>
                </g>
              )
            })}
          </g>
        </g>
      )
    },
    landed: result ? { hi: `${totalDays} शुभ विवाह तिथियाँ`, en: `${totalDays} auspicious wedding days found for ${result.place.label}` } : null,
  }
}

