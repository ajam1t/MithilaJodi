'use client'

import { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'

/**
 * The moment between pressing Log In and arriving: the page opens from the
 * button into a deep-maroon sky, and the visitor travels forward through a
 * tunnel of gold aripan rings with light streaming past. When the server says
 * yes, the tunnel flares to ivory and the next page (also ivory) follows; if it
 * says no, the portal closes back into the button and the form shows the error.
 *
 * It only reflects the request — it never delays it. `phase` comes from the
 * login form: 'travel' while the request is in flight, 'arrive' once it has
 * succeeded (the redirect is already under way), 'idle' otherwise.
 * Decorative and aria-hidden; the form's own button text carries the status.
 * prefers-reduced-motion: a plain fade with the words, no travel.
 */

export type PortalPhase = 'idle' | 'travel' | 'arrive'

const C = 100
const r2 = (n: number) => Math.round(n * 100) / 100
const at = (r: number, deg: number) => {
  const a = ((deg - 90) * Math.PI) / 180
  return [r2(C + r * Math.cos(a)), r2(C + r * Math.sin(a))] as const
}
function petals(n: number, r0: number, r1: number, w: number, off = 0) {
  return Array.from({ length: n }, (_, i) => {
    const deg = (i * 360) / n + off
    const [x0, y0] = at(r0, deg), [x1, y1] = at(r1, deg)
    const m = (r0 + r1) / 2
    const [lx, ly] = at(m, deg - w), [rx, ry] = at(m, deg + w)
    return `M${x0} ${y0}Q${lx} ${ly} ${x1} ${y1}Q${rx} ${ry} ${x0} ${y0}Z`
  }).join('')
}
/** Three ring designs, alternated down the tunnel. */
const RINGS = [
  { petals: petals(16, 78, 96, 5), dots: 32 },
  { petals: petals(8, 56, 92, 14, 22.5), dots: 24 },
  { petals: petals(24, 84, 96, 3.4), dots: 48 },
]
const TUNNEL = Array.from({ length: 8 }, (_, i) => ({ design: RINGS[i % 3], delay: -(i * 2.6) / 8, dir: i % 2 ? -1 : 1 }))
const STREAKS = Array.from({ length: 28 }, (_, i) => ({ a: (i * 360) / 28 + (i % 3) * 4, d: -((i * 7) % 11) / 11 * 1.1, w: 1 + (i % 3) * 0.5 }))

export function LoginPortal({ phase, origin }: { phase: PortalPhase; origin: { x: number; y: number } | null }) {
  // Rendered into <body>: an ancestor with a transform (the page's fade-in) would
  // otherwise trap a fixed overlay inside the card.
  const [mounted, setMounted] = useState(false)
  useEffect(() => setMounted(true), [])
  const on = phase !== 'idle'
  const style = { '--ox': `${origin?.x ?? 50}%`, '--oy': `${origin?.y ?? 70}%` } as React.CSSProperties
  if (!mounted) return null
  return createPortal(
    <div className={`mj-portal ${on ? 'is-on' : ''} ${phase === 'arrive' ? 'is-arrive' : ''}`} style={style} aria-hidden="true">
      <div className="mj-portal-sky">
        {/* light streaming past */}
        <div className="mj-portal-streaks">
          {STREAKS.map((s, i) => (
            <span key={i} style={{ transform: `rotate(${s.a}deg)`, animationDelay: `${s.d}s` }}><i style={{ width: `${s.w}px`, animationDelay: `${s.d}s` }} /></span>
          ))}
        </div>
        {/* the tunnel of aripan rings, coming towards the viewer */}
        <div className="mj-portal-tunnel">
          {TUNNEL.map((r, i) => (
            <svg key={i} viewBox="0 0 200 200" className="mj-portal-ring" style={{ animationDelay: `${r.delay}s` }}>
              <g className="mj-portal-spin" style={{ animationDirection: r.dir > 0 ? 'normal' : 'reverse' }}>
                <circle cx={C} cy={C} r="98" fill="none" stroke="#E9C977" strokeWidth=".6" strokeDasharray="1.5 4" />
                <path d={r.design.petals} fill="none" stroke="#E9C977" strokeWidth=".9" />
                {Array.from({ length: r.design.dots }, (_, k) => { const [x, y] = at(70, (k * 360) / r.design.dots); return <circle key={k} cx={x} cy={y} r=".9" fill="#FFE7A6" /> })}
              </g>
            </svg>
          ))}
        </div>
        {/* the far light, and the mark within it */}
        <div className="mj-portal-core">
          <span className="mj-portal-glow" />
          {/* The mark is maroon, so it sits on ivory — never recoloured. */}
          <span className="mj-portal-mark">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/logo-mark-128.webp" alt="" width={44} height={40} />
          </span>
        </div>
        <div className="mj-portal-words">
          <p className="font-deva text-[22px] text-[#FFE7A6]" lang="mai">स्वागत अछि</p>
          <p className="mt-1 text-[13px] tracking-[0.18em] uppercase text-[#F3E3C4]/80">{phase === 'arrive' ? 'Welcome home' : 'Opening your Mithila Jodi'}</p>
        </div>
      </div>
      <div className="mj-portal-flare" />
    </div>,
    document.body,
  )
}
