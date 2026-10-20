'use client'

import { useEffect, useRef, useState, type ReactNode } from 'react'

/**
 * The calculation "ceremony" shown between pressing Calculate and the report.
 *
 * It starts the moment the request is sent and keeps its searching motion
 * going until the result arrives (the server usually answers in well under a
 * second), then plays a short landing sequence built from the real result —
 * the person's own planets, Moon, houses or syllables — and hands over to the
 * report. Nothing it shows is invented: before the result arrives it shows
 * only motion, never numbers.
 *
 * Always skippable. With prefers-reduced-motion it does not play at all: the
 * report appears as soon as the result does.
 */

export type CeremonyFrame = {
  /** Seconds since the ceremony began. */
  t: number
  /** 0→1 through the landing sequence, or null while still waiting for the result. */
  land: number | null
}

type Props = {
  /** The scene, drawn in a 600 × 600 SVG; called every frame. */
  scene: (f: CeremonyFrame) => ReactNode
  /** Caption while waiting, and once landed. */
  waiting: { hi: string; en: string }
  landed: { hi: string; en: string } | null
  /** True once the result is in hand (landing may begin). */
  ready: boolean
  onDone: () => void
  /** Landing length in seconds. */
  duration?: number
}

const MIN_SEARCH = 0.9
const HOLD = 0.85

export function prefersReducedMotion(): boolean {
  return typeof window !== 'undefined' && !!window.matchMedia?.('(prefers-reduced-motion: reduce)').matches
}

export function AstroCeremony({ scene, waiting, landed, ready, onDone, duration = 2.2 }: Props) {
  const [frame, setFrame] = useState<CeremonyFrame>({ t: 0, land: null })
  const start = useRef<number | null>(null)
  const landAt = useRef<number | null>(null)
  const readyRef = useRef(ready)
  const doneRef = useRef(false)
  const finish = useRef(onDone)
  finish.current = onDone
  readyRef.current = ready

  useEffect(() => {
    let raf = 0
    const tick = (now: number) => {
      if (start.current === null) start.current = now
      const t = (now - start.current) / 1000
      if (readyRef.current && landAt.current === null) landAt.current = Math.max(t, MIN_SEARCH)
      const land = landAt.current === null || t < landAt.current ? null : Math.min(1, (t - landAt.current) / duration)
      setFrame({ t, land })
      if (land === 1 && t - (landAt.current ?? 0) >= duration + HOLD) {
        if (!doneRef.current) { doneRef.current = true; finish.current() }
        return
      }
      raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [duration])

  const skip = () => { if (!doneRef.current && readyRef.current) { doneRef.current = true; finish.current() } }
  const cap = frame.land !== null && frame.land > 0.55 && landed ? landed : waiting

  return (
    <div className="kd-ceremony mx-auto max-w-2xl rounded-mj-lg border border-gold/40 bg-cream px-4 pb-5 pt-4 shadow-mj-sm sm:px-8 sm:pb-7 sm:pt-6" aria-busy={frame.land === null}>
      <div className="relative mx-auto aspect-square w-full max-w-[460px]">
        <svg viewBox="0 0 600 600" className="h-full w-full" role="img" aria-label={`${cap.en}`}>
          <defs>
            <radialGradient id="cer-sky" cx="50%" cy="42%" r="62%">
              <stop offset="0" stopColor="#2E3A6E" />
              <stop offset=".62" stopColor="#1A1F3D" />
              <stop offset="1" stopColor="#3A1020" />
            </radialGradient>
            <radialGradient id="cer-glow"><stop offset="0" stopColor="#FFE7A6" stopOpacity=".95" /><stop offset=".5" stopColor="#E9C977" stopOpacity=".35" /><stop offset="1" stopColor="#C49A48" stopOpacity="0" /></radialGradient>
            <radialGradient id="cer-dot"><stop offset="0" stopColor="#FFF6D8" /><stop offset=".55" stopColor="#E9C977" stopOpacity=".7" /><stop offset="1" stopColor="#C49A48" stopOpacity="0" /></radialGradient>
            <clipPath id="cer-window"><circle cx="300" cy="300" r="286" /></clipPath>
          </defs>
          {/* the sky window, framed in gold like an observatory porthole */}
          <circle cx="300" cy="300" r="296" fill="#FFFAF0" stroke="#C49A48" strokeWidth="3" />
          <circle cx="300" cy="300" r="286" fill="url(#cer-sky)" />
          <g clipPath="url(#cer-window)">{scene(frame)}</g>
          <circle cx="300" cy="300" r="286" fill="none" stroke="#E9C977" strokeWidth="1.2" strokeDasharray="2 6" opacity=".7" />
        </svg>
      </div>
      <div className="mt-4 min-h-[64px] text-center" aria-live="polite">
        <p key={cap.hi} className="kd-cer-cap font-deva text-[22px] leading-tight text-maroon sm:text-[26px]" lang="hi">{cap.hi}</p>
        <p key={cap.en} className="kd-cer-cap mt-1 text-[14px] text-ink-soft sm:text-[15px]">{cap.en}</p>
      </div>
      <div className="mt-2 flex justify-center">
        <button type="button" onClick={skip} disabled={!ready} className="text-[13px] font-medium text-maroon underline-offset-4 hover:underline disabled:opacity-40">
          {ready ? 'Skip to the result' : 'Calculating…'}
        </button>
      </div>
    </div>
  )
}

// ── Shared drawing helpers for the scenes ─────────────────────────────────────

export const C = 300
export const r1 = (n: number) => Math.round(n * 10) / 10
export const clamp = (v: number, a = 0, b = 1) => Math.max(a, Math.min(b, v))
export const seg = (u: number, a: number, b: number) => clamp((u - a) / (b - a))
export const eo = (x: number) => 1 - Math.pow(1 - x, 3)
export const eio = (x: number) => (x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2)
/** Point on a circle; 0° is the top, angles run clockwise. */
export const at = (r: number, deg: number) => {
  const a = ((deg - 90) * Math.PI) / 180
  return [r1(C + r * Math.cos(a)), r1(C + r * Math.sin(a))] as const
}

let s = 7
const rnd = () => (s = (s * 16807) % 2147483647) / 2147483647
/** A fixed field of stars, the same on every render. */
export const STARS = Array.from({ length: 90 }, () => ({ r: 20 + Math.sqrt(rnd()) * 270, a: rnd() * 360, size: 0.6 + rnd() * 1.8, tw: rnd() * 6.28 }))

/** The starfield, turned by `rot` degrees; `trail` (degrees) draws each star as an arc, for speed. */
export function Starfield({ rot, trail = 0, t, opacity = 1 }: { rot: number; trail?: number; t: number; opacity?: number }) {
  return (
    <g opacity={opacity}>
      {STARS.map((st, i) => {
        const a = st.a + rot
        const tw = 0.45 + 0.55 * (0.5 + 0.5 * Math.sin(t * 2 + st.tw))
        if (trail > 0.6) {
          const [x0, y0] = at(st.r, a - trail), [x1, y1] = at(st.r, a)
          return <path key={i} d={`M${x0} ${y0}A${r1(st.r)} ${r1(st.r)} 0 0 1 ${x1} ${y1}`} stroke="#FFF1C2" strokeOpacity={r1(tw * 0.8 * 10) / 10} strokeWidth={st.size} fill="none" strokeLinecap="round" />
        }
        const [x, y] = at(st.r, a)
        return <circle key={i} cx={x} cy={y} r={st.size * 1.3} fill="url(#cer-dot)" opacity={r1(tw * 10) / 10} />
      })}
    </g>
  )
}
