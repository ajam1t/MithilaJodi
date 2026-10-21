'use client'

import { useEffect, useRef, useState, type MouseEvent, type PointerEvent } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'

/**
 * The entrance to Mithila Jodi (/register before any step is chosen).
 *
 * One control, two ways in: a track with "Create account" at one end and
 * "Log in" at the other, and a diya in the middle. Tap either end — they are
 * ordinary links, reachable by keyboard and screen readers — or slide the diya
 * towards one. Above it an aripan, drawn in fine gold line, turns with the
 * diya and fills from the side it is moving to: maroon for joining, gold for
 * returning. On choosing, the aripan opens towards the viewer and the next
 * page follows.
 *
 * No auth logic lives here. prefers-reduced-motion keeps the layout and the
 * links but drops the drawing, the turning and the opening.
 */

const JOIN = '/register?start=1'
const LOGIN = '/login'

type Side = 'join' | 'login'

// ── The aripan: rice-flour floor art, as line ────────────────────────────────
const AC = 120
const r2 = (n: number) => Math.round(n * 100) / 100
const at = (r: number, deg: number) => {
  const a = ((deg - 90) * Math.PI) / 180
  return [r2(AC + r * Math.cos(a)), r2(AC + r * Math.sin(a))] as const
}
/** A full circle as a path, so pathLength (and the draw-in) works everywhere. */
const ring = (r: number) => `M${AC} ${AC - r}A${r} ${r} 0 1 1 ${AC} ${AC + r}A${r} ${r} 0 1 1 ${AC} ${AC - r}Z`
/** A petal from radius r0 to r1 along angle deg, w wide. */
function petal(r0: number, r1: number, deg: number, w: number) {
  const [x0, y0] = at(r0, deg), [x1, y1] = at(r1, deg)
  const mid = (r0 + r1) / 2
  const [lx, ly] = at(mid, deg - w), [rx, ry] = at(mid, deg + w)
  return `M${x0} ${y0}Q${lx} ${ly} ${x1} ${y1}Q${rx} ${ry} ${x0} ${y0}Z`
}
const BIG = Array.from({ length: 8 }, (_, i) => petal(30, 84, i * 45, 15))
const SMALL = Array.from({ length: 16 }, (_, i) => petal(92, 108, i * 22.5 + 11.25, 4.2))
const DOTS = Array.from({ length: 32 }, (_, i) => at(100, i * 11.25))
const SEEDS = Array.from({ length: 8 }, (_, i) => at(58, i * 45 + 22.5))

function Aripan({ p, open }: { p: number; open: boolean }) {
  // p: −1 (towards Create account) … 0 … +1 (towards Log in)
  const join = Math.max(0, -p), back = Math.max(0, p)
  return (
    <div className={`mj-entry-aripan ${open ? 'is-open' : ''}`} aria-hidden="true">
      <svg viewBox="0 0 240 240" className="h-full w-full overflow-visible">
        <defs>
          <linearGradient id="enLine" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0" stopColor="#D9B25A" />
            <stop offset=".55" stopColor="#B98A2E" />
            <stop offset="1" stopColor="#9B2233" />
          </linearGradient>
          <radialGradient id="enGlow">
            <stop offset="0" stopColor="#FFE7A6" stopOpacity=".85" />
            <stop offset=".6" stopColor="#F2C46A" stopOpacity=".18" />
            <stop offset="1" stopColor="#F2C46A" stopOpacity="0" />
          </radialGradient>
        </defs>
        <circle cx={AC} cy={AC} r="118" fill="url(#enGlow)" opacity={0.35 + 0.4 * Math.abs(p)} />
        {/* the outer rings turn with the diya */}
        <g style={{ transform: `rotate(${r2(p * 40)}deg)`, transformOrigin: '120px 120px' }} className="mj-entry-turn">
          <path d={ring(116)} className="mj-entry-draw" pathLength={1} stroke="url(#enLine)" strokeWidth="1" fill="none" style={{ animationDelay: '0ms' }} />
          {SMALL.map((d, i) => (
            <path key={i} d={d} className="mj-entry-draw" pathLength={1} stroke="url(#enLine)" strokeWidth="1.1" fill={i % 2 ? '#9B2233' : '#B98A2E'} fillOpacity={0.08 + 0.5 * (i % 2 ? join : back)} style={{ animationDelay: `${300 + i * 25}ms` }} />
          ))}
          {DOTS.map(([x, y], i) => <circle key={i} cx={x} cy={y} r="1.3" fill="#B98A2E" className="mj-entry-fade" style={{ animationDelay: `${700 + i * 12}ms` }} />)}
        </g>
        <g style={{ transform: `rotate(${r2(-p * 22)}deg)`, transformOrigin: '120px 120px' }} className="mj-entry-turn">
          <path d={ring(88)} className="mj-entry-draw" pathLength={1} stroke="url(#enLine)" strokeWidth="1" strokeDasharray="0.004 0.012" fill="none" />
          {BIG.map((d, i) => (
            <path key={i} d={d} className="mj-entry-draw" pathLength={1} stroke="url(#enLine)" strokeWidth="1.4" fill={i % 2 ? '#B98A2E' : '#9B2233'} fillOpacity={0.05 + 0.32 * (i % 2 ? back : join)} style={{ animationDelay: `${150 + i * 60}ms` }} />
          ))}
          {SEEDS.map(([x, y], i) => <circle key={i} cx={x} cy={y} r="2.6" fill="#9B2233" className="mj-entry-fade" style={{ animationDelay: `${900 + i * 40}ms` }} />)}
        </g>
        {/* the centre: a lotus with a pair of fish, Mithila's marks of good fortune */}
        <path d={ring(26)} className="mj-entry-draw" pathLength={1} stroke="#B98A2E" strokeWidth="1.2" fill="#FFFAF0" />
        <g className="mj-entry-fade" style={{ animationDelay: '1000ms' }}>
          <path d="M120 104c5 5 6 11 0 17-6-6-5-12 0-17Z" fill="#9B2233" />
          <path d="M120 121c-6-1-11-5-12-11 6 0 10 4 12 11Zm0 0c6-1 11-5 12-11-6 0-10 4-12 11Z" fill="#B8323F" />
          <path d="M106 129c4-3 9-3 12 0-3 3-8 3-12 0Zm28 0c-4-3-9-3-12 0 3 3 8 3 12 0Z" fill="none" stroke="#B98A2E" strokeWidth="1.3" strokeLinejoin="round" />
          <path d="M106 129l-3-2.4M106 129l-3 2.4M134 129l3-2.4M134 129l3 2.4" stroke="#B98A2E" strokeWidth="1.2" strokeLinecap="round" />
        </g>
      </svg>
    </div>
  )
}

function Diya() {
  return (
    <svg viewBox="0 0 32 32" className="h-7 w-7" aria-hidden="true">
      <path className="mj-entry-flame" d="M16 4.5c2.6 3 3.6 5.2 3.6 7a3.6 3.6 0 0 1-7.2 0c0-1.8 1-4 3.6-7Z" fill="#FFD27A" />
      <path d="M16 8.6c1 1.3 1.4 2.3 1.4 3a1.4 1.4 0 0 1-2.8 0c0-.7.4-1.7 1.4-3Z" fill="#FFF4D6" />
      <path d="M4.5 18.5h23c-.9 4.6-5.4 7.5-11.5 7.5S5.4 23.1 4.5 18.5Z" fill="#E9C977" />
      <path d="M8 21.4h16" stroke="#9B2233" strokeWidth="1.2" strokeLinecap="round" opacity=".55" />
    </svg>
  )
}

export function AuthWelcome() {
  const router = useRouter()
  const track = useRef<HTMLDivElement>(null)
  const drag = useRef<{ x0: number; max: number } | null>(null)
  const [x, setX] = useState(0)
  const [max, setMax] = useState(120)
  const [dragging, setDragging] = useState(false)
  const [leaving, setLeaving] = useState<Side | null>(null)

  useEffect(() => { router.prefetch(JOIN); router.prefetch(LOGIN) }, [router])

  const reduced = () => typeof window !== 'undefined' && !!window.matchMedia?.('(prefers-reduced-motion: reduce)').matches

  function go(side: Side) {
    if (leaving) return
    const href = side === 'join' ? JOIN : LOGIN
    if (reduced()) { router.push(href); return }
    setLeaving(side)
    setX(side === 'join' ? -max : max)
    window.setTimeout(() => router.push(href), 520)
  }

  /** The ends are real links; a plain click plays the opening first. */
  function onEnd(e: MouseEvent, side: Side) {
    if (e.metaKey || e.ctrlKey || e.shiftKey || e.button !== 0) return
    e.preventDefault()
    go(side)
  }

  function onDown(e: PointerEvent<HTMLDivElement>) {
    if (leaving || !track.current) return
    const w = track.current.getBoundingClientRect().width
    const m = w / 2 - 32
    setMax(m)
    drag.current = { x0: e.clientX - x, max: m }
    setDragging(true)
    e.currentTarget.setPointerCapture(e.pointerId)
  }
  function onMove(e: PointerEvent<HTMLDivElement>) {
    if (!drag.current) return
    const { x0, max: m } = drag.current
    setX(Math.max(-m, Math.min(m, e.clientX - x0)))
  }
  function onUp() {
    if (!drag.current) return
    const m = drag.current.max
    drag.current = null
    setDragging(false)
    if (x <= -m * 0.6) go('join')
    else if (x >= m * 0.6) go('login')
    else setX(0)
  }

  const p = max ? x / max : 0
  const join = Math.max(0, -p), back = Math.max(0, p)

  return (
    <div className={`mj-entry w-full max-w-[440px] ${leaving ? 'is-leaving' : ''}`}>
      <div className="relative mx-auto h-[178px] w-[178px] sm:h-[210px] sm:w-[210px]">
        <Aripan p={p} open={!!leaving} />
      </div>

      <div className="mj-entry-copy mt-3 text-center">
        <p className="font-deva text-[14px] text-terra" lang="mai">स्वागत अछि</p>
        <h1 className="mt-1 font-serif text-[24px] leading-[1.15] text-maroon sm:text-[32px]">
          A beautiful beginning
          <span className="block text-[#9A6F1E]">deserves the right connection.</span>
        </h1>
        <p className="mt-2 font-deva text-[16px] text-maroon/90 sm:text-[18px]" lang="mai">अहाँक अपन मिथिला, अहाँक अपन जोड़ी</p>
      </div>

      {/* ── The threshold: two ends, one diya ── */}
      <nav aria-label="Join or log in" className="mj-entry-copy mt-6">
        <div ref={track} className="mj-entry-track relative h-[72px] select-none rounded-full">
          {/* the trail of light behind the diya */}
          <span className="mj-entry-trail" style={{ left: '50%', width: `${Math.abs(x)}px`, transform: x < 0 ? 'translateX(-100%)' : undefined, background: x < 0 ? 'linear-gradient(270deg, rgba(155,34,51,.0), rgba(155,34,51,.9))' : 'linear-gradient(90deg, rgba(185,138,46,0), rgba(185,138,46,.85))' }} aria-hidden="true" />
          <Link href={JOIN} onClick={e => onEnd(e, 'join')} className="mj-entry-end left-0 pl-5 text-left sm:pl-6" data-lit={join > 0.05 || undefined} data-side="join">
            <span className="block text-[11px] uppercase tracking-[0.16em] text-terra/90" style={{ color: join > 0.55 ? '#FFF6E2' : undefined }}>New here</span>
            <span className="block font-serif leading-tight text-maroon" style={{ color: join > 0.55 ? '#FFFFFF' : undefined }}>Create account</span>
          </Link>
          <Link href={LOGIN} onClick={e => onEnd(e, 'login')} className="mj-entry-end right-0 pr-5 text-right sm:pr-6" data-lit={back > 0.05 || undefined} data-side="login">
            <span className="block text-[11px] uppercase tracking-[0.16em] text-terra/90" style={{ color: back > 0.55 ? '#FFF6E2' : undefined }}>Welcome back</span>
            <span className="block font-serif leading-tight text-maroon" style={{ color: back > 0.55 ? '#FFFFFF' : undefined }}>Log in</span>
          </Link>
          <div
            className={`mj-entry-knob ${dragging ? 'is-dragging' : ''}`}
            style={{ transform: `translate(calc(-50% + ${r2(x)}px), -50%)` }}
            onPointerDown={onDown}
            onPointerMove={onMove}
            onPointerUp={onUp}
            onPointerCancel={onUp}
            aria-hidden="true"
          >
            <span className="mj-entry-halo" />
            <Diya />
          </div>
        </div>
        <p className="mt-2.5 text-center text-[12px] text-ink-soft">Tap a side — or slide the diya</p>
      </nav>

      <ul className="mj-entry-copy mt-6 flex items-center justify-center gap-2.5 whitespace-nowrap text-[11.5px] text-ink-soft sm:gap-4 sm:text-[12.5px]" aria-label="Why it is safe">
        <li className="flex items-center gap-1.5">
          <svg viewBox="0 0 20 20" className="h-3.5 w-3.5" fill="none" stroke="#9B2233" strokeWidth="1.6" strokeLinejoin="round" aria-hidden="true"><path d="M10 2.5 16 5v4.6c0 3.7-2.5 6.6-6 7.9-3.5-1.3-6-4.2-6-7.9V5Z" /></svg>
          Private number
        </li>
        <li className="h-3 w-px bg-gold/50" aria-hidden="true" />
        <li className="flex items-center gap-1.5">
          <svg viewBox="0 0 20 20" className="h-3.5 w-3.5" fill="none" stroke="#9B2233" strokeWidth="1.6" strokeLinecap="round" aria-hidden="true"><rect x="4" y="9" width="12" height="8.5" rx="1.8" /><path d="M7 9V6.6a3 3 0 0 1 6 0V9" /></svg>
          OTP secured
        </li>
        <li className="h-3 w-px bg-gold/50" aria-hidden="true" />
        <li>Free to join</li>
      </ul>
    </div>
  )
}
