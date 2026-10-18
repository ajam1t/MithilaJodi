'use client'

/**
 * The MJ Scratch & Reveal invitation's opening: a closed ivory envelope.
 *
 *   four flaps of embossed ivory paper meet under an ivory wax seal pressed
 *   with the gold Mithila Jodi monogram → a tap on the seal lifts it in a
 *   golden glow → the flaps fold open on warm light and gold sparks → the
 *   invitation underneath rises in and gold petals drift down over it.
 *
 * The date is not shown here — guests scratch it free in the invitation's
 * "The Date" section (ScratchDate). Once per browser session, like the classic
 * envelope (same storage key, pre-paint hide and "open again" event), with a
 * Skip and a plain fade for reduced motion. CSS and inline SVG only.
 *
 * While the envelope is closed the invitation's root carries `data-sealed`
 * (set by the server, so its opening animations wait instead of playing
 * unseen); opening removes it and sets `data-opened`, which starts the petals.
 */
import { useCallback, useEffect, useId, useRef, useState, type CSSProperties } from 'react'
import { translator, type Lang } from '@/lib/wedding/i18n'
import { ENVELOPE_REPLAY_EVENT, useSealedPage } from './Envelope'
import { FLORALS, r1 } from './florals'

type Phase = 'closed' | 'opening' | 'leaving' | 'done'

type Props = {
  lang: Lang
  /** sessionStorage key; null in the builder preview, which never remembers. */
  storageKey: string | null
  /** Builder preview: the envelope lives inside the preview frame. */
  embedded?: boolean
}

/** Timings (ms): the seal lifting and flaps folding, then the fade. */
const T = { open: 1500, leave: 450 }

/** Embossed paper: a soft shadow below, a white highlight above, and a gold line that warms in as it opens. */
function FloralArt({ id }: { id: string }) {
  return (
    <svg width="0" height="0" className="absolute" aria-hidden="true" focusable="false">
      <defs>
        <g id={id} fill="none" strokeLinecap="round" strokeLinejoin="round">
          <path d={FLORALS} stroke="#9C7B47" strokeOpacity="0.34" strokeWidth="1.7" transform="translate(0.9 1.2)" />
          <path d={FLORALS} stroke="#FFFFFF" strokeWidth="1.4" transform="translate(-0.6 -0.8)" />
          <path d={FLORALS} stroke="#EADCC2" strokeWidth="0.9" />
          <path d={FLORALS} stroke="currentColor" strokeWidth="0.8" />
        </g>
      </defs>
    </svg>
  )
}

/** The poured edge of the wax: a circle with a gentle irregular ripple. */
const WAX_EDGE = (() => {
  const n = 40
  const pts = Array.from({ length: n }, (_, i) => {
    const a = (i / n) * Math.PI * 2
    const r = 56 + Math.sin(i * 2.3) * 1.8 + Math.cos(i * 5.1) * 1.2
    return [r1(Math.cos(a) * r), r1(Math.sin(a) * r)] as const
  })
  return `M${pts.map(([x, y]) => `${x} ${y}`).join('L')}Z`
})()

/** An ivory wax seal with a pressed gold rim; the monogram sits on top as gold foil (CSS mask). */
function SealWax({ u }: { u: string }) {
  return (
    <svg viewBox="-60 -60 120 120" className="absolute inset-0 h-full w-full" aria-hidden="true" focusable="false">
      <defs>
        <radialGradient id={`${u}wax`} cx="38%" cy="32%" r="78%">
          <stop offset="0" stopColor="#FFFDF7" />
          <stop offset="0.55" stopColor="#F4E9D4" />
          <stop offset="1" stopColor="#DCC9A6" />
        </radialGradient>
        <radialGradient id={`${u}press`} cx="50%" cy="42%" r="62%">
          <stop offset="0" stopColor="#FBF4E6" />
          <stop offset="1" stopColor="#EADBBE" />
        </radialGradient>
        <linearGradient id={`${u}rim`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#F3DDA0" />
          <stop offset="0.5" stopColor="#C49A48" />
          <stop offset="1" stopColor="#9A7128" />
        </linearGradient>
      </defs>
      <path d={WAX_EDGE} fill={`url(#${u}wax)`} />
      {/* the pressed hollow, lit from the top left */}
      <circle r="42" fill={`url(#${u}press)`} />
      <circle r="42" fill="none" stroke="#B89A6A" strokeOpacity="0.55" strokeWidth="1.4" transform="translate(0.6 0.8)" />
      <circle r="42" fill="none" stroke="#FFFFFF" strokeOpacity="0.9" strokeWidth="1.2" transform="translate(-0.5 -0.7)" />
      <circle r="38" fill="none" stroke={`url(#${u}rim)`} strokeWidth="1.3" />
      <circle r="35.5" fill="none" stroke={`url(#${u}rim)`} strokeOpacity="0.8" strokeWidth="0.6" strokeDasharray="1 2.2" />
      <ellipse cx="-24" cy="-34" rx="15" ry="5" fill="#FFFFFF" opacity="0.55" transform="rotate(-30 -24 -34)" />
    </svg>
  )
}

/** Fixed spark directions for the opening (deterministic, so server and browser agree). */
const SPARKS = Array.from({ length: 16 }, (_, i) => {
  const a = (i / 16) * Math.PI * 2 + (i % 3) * 0.21
  const d = 100 + ((i * 37) % 80)
  return { dx: r1(Math.cos(a) * d), dy: r1(Math.sin(a) * d), delay: (i % 5) * 60 }
})

export function MjEnvelope({ lang, storageKey, embedded = false }: Props) {
  const t = translator(lang)
  const u = `m${useId().replace(/[^\w-]/g, '')}-`
  const [phase, setPhase] = useState<Phase>('closed')
  const overlay = useRef<HTMLDivElement>(null)
  const root = useRef<HTMLElement | null>(null)
  const timers = useRef<ReturnType<typeof setTimeout>[]>([])

  useSealedPage(overlay, phase, embedded)

  // Remember the invitation root once — the overlay unmounts when done.
  useEffect(() => { root.current = overlay.current?.closest<HTMLElement>('.wd') ?? null }, [])

  const finish = useCallback((opened: boolean) => {
    timers.current.forEach(clearTimeout)
    timers.current = []
    const r = root.current
    if (r) {
      r.removeAttribute('data-sealed')
      if (opened) r.setAttribute('data-opened', '')
    }
    setPhase('done')
    if (storageKey) try { sessionStorage.setItem(storageKey, '1') } catch { /* private mode — fine */ }
  }, [storageKey])

  function open() {
    if (phase !== 'closed') return
    const reduced = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches
    if (reduced) {
      setPhase('leaving')
      timers.current.push(setTimeout(() => finish(false), T.leave))
      return
    }
    setPhase('opening')
    // Let the invitation start rising as the flaps clear, not after the fade.
    timers.current.push(setTimeout(() => { root.current?.removeAttribute('data-sealed'); root.current?.setAttribute('data-opened', '') }, T.open - 300))
    timers.current.push(setTimeout(() => setPhase('leaving'), T.open))
    timers.current.push(setTimeout(() => finish(true), T.open + T.leave))
  }

  // Already opened in this session: straight to the invitation.
  useEffect(() => {
    if (!storageKey) return
    try { if (sessionStorage.getItem(storageKey)) finish(false) } catch { /* ignore */ }
  }, [storageKey, finish])

  // "Open again"
  useEffect(() => {
    if (embedded) return
    const replay = () => {
      document.getElementById('wd-env-hide')?.remove()
      timers.current.forEach(clearTimeout)
      timers.current = []
      const r = root.current
      if (r) { r.removeAttribute('data-opened'); r.setAttribute('data-sealed', '') }
      setPhase('closed')
    }
    window.addEventListener(ENVELOPE_REPLAY_EVENT, replay)
    return () => window.removeEventListener(ENVELOPE_REPLAY_EVENT, replay)
  }, [embedded])

  useEffect(() => () => timers.current.forEach(clearTimeout), [])

  if (phase === 'done') return null

  return (
    <div
      ref={overlay}
      id={embedded ? undefined : 'wd-envelope'}
      className="wd-mje"
      data-phase={phase}
      role="dialog"
      aria-modal="true"
      aria-label={t('invitation')}
    >
      <FloralArt id={`${u}art`} />

      <div className="wd-mje-flaps" aria-hidden="true">
        {(['left', 'right', 'bottom', 'top'] as const).map(f => (
          <div key={f} className={`wd-mje-wrap wd-mje-${f}`}>
            <div className="wd-mje-flap">
              <svg viewBox="0 0 400 800" preserveAspectRatio="xMidYMid slice" className="wd-mje-art"><use href={`#${u}art`} /></svg>
            </div>
          </div>
        ))}
      </div>
      {/* The fold edges: a soft shadow under each flap and a fine highlight on its edge. */}
      <svg className="wd-mje-seams" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true" focusable="false">
        <g fill="none">
          <path d="M0 0.6L50 47.6L100 0.6" stroke="rgba(110,75,25,0.09)" strokeWidth="7" vectorEffect="non-scaling-stroke" />
          <path d="M0 0.3L50 47.3L100 0.3" stroke="rgba(110,75,25,0.12)" strokeWidth="2.5" vectorEffect="non-scaling-stroke" />
          <path d="M0 100L50 47M100 100L50 47" stroke="rgba(110,75,25,0.1)" strokeWidth="3" vectorEffect="non-scaling-stroke" />
          <path d="M0 0L50 47L100 0M0 100L50 47L100 100" stroke="rgba(255,255,255,0.95)" strokeWidth="1" vectorEffect="non-scaling-stroke" />
          <path d="M0 0L50 47L100 0M0 100L50 47L100 100" stroke="rgba(185,138,46,0.35)" strokeWidth="0.6" vectorEffect="non-scaling-stroke" />
        </g>
      </svg>
      <div className="wd-mje-light" aria-hidden="true" />
      <div className="wd-mje-burst" aria-hidden="true">
        {SPARKS.map((s, i) => (
          <i key={i} style={{ '--dx': `${s.dx}px`, '--dy': `${s.dy}px`, animationDelay: `${s.delay}ms` } as CSSProperties} />
        ))}
      </div>

      <button type="button" className="wd-mje-seal" onClick={open} aria-label={t('openCta')}>
        <SealWax u={u} />
        <span className="wd-mje-mono" aria-hidden="true"><span /></span>
      </button>

      <p className={`wd-mje-hint ${/[ऀ-ॿ]/.test(t('openHint')) ? 'wd-deva' : ''}`} aria-hidden="true">{t('openHint')}</p>
      <button type="button" className="wd-mje-skip" onClick={() => finish(false)}>{t('skip')}</button>
    </div>
  )
}
