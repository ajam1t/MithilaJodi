'use client'

/**
 * The opening: a sealed Mithila envelope the guest opens with a tap.
 *
 *   seal releases → flap swings open on its hinge → warm diya light rises
 *   from inside → the card slides out of the pocket (शुभ विवाह, the names,
 *   the date) → the envelope sinks away as the card grows to fill the screen
 *   and becomes the invitation's opening view.
 *
 * About three seconds after the tap. Once per browser session (a skip, an
 * "open again" control, and a plain fade for reduced motion). Everything is
 * CSS transforms and inline SVG — no video, no animation library.
 *
 * Positioning note: no ancestor of the card may carry a transform, filter or
 * perspective, so `position: fixed` can lift the card out of the envelope for
 * the final expansion. The flap uses the perspective() transform function on
 * itself for its 3D hinge for the same reason.
 */
import { useCallback, useEffect, useId, useRef, useState } from 'react'
import type { WeddingTheme } from '@/lib/wedding/themes'
import { translator, type Lang } from '@/lib/wedding/i18n'

type Phase = 'closed' | 'opening' | 'rise' | 'expand' | 'leaving' | 'done'

export const ENVELOPE_REPLAY_EVENT = 'wd-envelope-replay'

type Props = {
  theme: WeddingTheme
  lang: Lang
  bride: string
  groom: string
  /** Already-formatted date line for the card. */
  dateLine: string
  /** sessionStorage key; null in the builder preview, which never remembers. */
  storageKey: string | null
  /** Builder preview: the envelope lives inside the preview frame. */
  embedded?: boolean
  onDone?: () => void
}

// ─── Artwork ────────────────────────────────────────────────────────────────

const GOLD = '#C89B45'
const GOLD_LT = '#E7C877'
const MAROON = '#6E1024'

/** Ivory handmade paper: a warm gradient and a fine fibre noise. */
function PaperDefs({ id }: { id: string }) {
  return (
    <>
      <linearGradient id={`${id}-paper`} x1="0" y1="0" x2="0.3" y2="1">
        <stop offset="0" stopColor="#FFFBF1" />
        <stop offset="0.55" stopColor="#FBF1DE" />
        <stop offset="1" stopColor="#F3E3C4" />
      </linearGradient>
      <filter id={`${id}-fibre`} x="0" y="0" width="100%" height="100%">
        <feTurbulence type="fractalNoise" baseFrequency="0.85" numOctaves="2" seed="7" />
        <feColorMatrix values="0 0 0 0 0.45  0 0 0 0 0.33  0 0 0 0 0.2  0 0 0 0.09 0" />
        <feComposite in2="SourceGraphic" operator="in" />
      </filter>
    </>
  )
}

function SmallLotus({ x, y, s = 1, color = GOLD }: { x: number; y: number; s?: number; color?: string }) {
  return (
    <g transform={`translate(${x} ${y}) scale(${s})`} fill="none" stroke={color} strokeWidth="1.3" strokeLinecap="round">
      <path d="M0 0C-5-6-5-14 0-20 5-14 5-6 0 0Z" fill={color} fillOpacity="0.18" />
      <path d="M0 0C-9-3-14-9-15-16-7-15-2-9 0 0ZM0 0C9-3 14-9 15-16 7-15 2-9 0 0Z" />
      <path d="M-14 3H14" />
    </g>
  )
}

function Fish({ x, y, flip = false }: { x: number; y: number; flip?: boolean }) {
  return (
    <g transform={`translate(${x} ${y}) scale(${flip ? -0.55 : 0.55} 0.55)`} fill="none" stroke={GOLD} strokeWidth="2.2" strokeLinejoin="round">
      <path d="M-34 0C-22-18 14-20 30 0 14 20-22 18-34 0Z" fill={GOLD} fillOpacity="0.12" />
      <path d="M30 0 48-12 44 0 48 12Z" />
      <circle cx="-20" cy="-3" r="3" fill={GOLD} stroke="none" />
      {[-6, 4, 14].map(dx => <path key={dx} d={`M${dx}-10q5 10 0 20`} strokeWidth="1.4" />)}
    </g>
  )
}

/** A Madhubani triangle band along a line from (x1,y1) to (x2,y2). */
function Band({ x1, y1, x2, y2, n }: { x1: number; y1: number; x2: number; y2: number; n: number }) {
  const dx = (x2 - x1) / n, dy = (y2 - y1) / n
  const len = Math.hypot(dx, dy)
  const nx = -dy / len * 7, ny = dx / len * 7
  return (
    <g fill={GOLD} fillOpacity="0.5" stroke={GOLD} strokeWidth="0.7" strokeOpacity="0.8">
      {Array.from({ length: n }, (_, i) => {
        const ax = x1 + dx * i, ay = y1 + dy * i
        return <path key={i} d={`M${ax} ${ay}L${ax + dx / 2 + nx} ${ay + dy / 2 + ny}L${ax + dx} ${ay + dy}Z`} fillOpacity={i % 2 ? 0.55 : 0.15} />
      })}
    </g>
  )
}

/** The front pocket: side and bottom flaps folded over the card. */
function Pocket({ u }: { u: string }) {
  return (
    <svg viewBox="0 0 600 440" preserveAspectRatio="none" className="wd-env-layer wd-env-pocket" aria-hidden="true">
      <defs>
        <PaperDefs id={`${u}pk`} />
        <linearGradient id={`${u}pk-fold`} x1="0" y1="1" x2="0" y2="0"><stop offset="0" stopColor="#E9D3AA" stopOpacity="0.55" /><stop offset="1" stopColor="#FFF8EA" stopOpacity="0" /></linearGradient>
      </defs>
      <path d="M0 0 300 252 600 0V440H0Z" fill={`url(#${u}pk-paper)`} />
      <path d="M0 0 300 252 600 0V440H0Z" fill="#000" filter={`url(#${u}pk-fibre)`} />
      {/* the bottom flap, a shade deeper, overlapping the side flaps */}
      <path d="M0 440 300 232 600 440Z" fill={`url(#${u}pk-fold)`} />
      <path d="M0 440 300 232 600 440" fill="none" stroke="#D9BE8E" strokeWidth="1" />
      <path d="M0 0 300 252M600 0 300 252" fill="none" stroke="#E2CBA0" strokeWidth="0.8" />
      {/* Mithila border: a double gold rule inset along the edges */}
      <path d="M14 30V426H586V30" fill="none" stroke={GOLD} strokeWidth="1.2" strokeOpacity="0.85" />
      <path d="M22 44V418H578V44" fill="none" stroke={GOLD} strokeWidth="0.6" strokeOpacity="0.6" strokeDasharray="2 4" />
      <Band x1={46} y1={418} x2={300} y2={254} n={16} />
      <Band x1={300} y1={254} x2={554} y2={418} n={16} />
      <SmallLotus x={52} y={400} s={1.1} />
      <SmallLotus x={548} y={400} s={1.1} />
      <Fish x={268} y={392} flip />
      <Fish x={332} y={392} />
    </svg>
  )
}

/** The flap: ivory outside with its border; the maroon Madhubani liner inside. */
function Flap({ u }: { u: string }) {
  return (
    <div className="wd-env-flap" aria-hidden="true">
      <svg viewBox="0 0 600 262" preserveAspectRatio="none" className="wd-env-face">
        <defs>
          <PaperDefs id={`${u}fl`} />
        </defs>
        <path d="M0 0H600L300 252Z" fill={`url(#${u}fl-paper)`} />
        <path d="M0 0H600L300 252Z" fill="#000" filter={`url(#${u}fl-fibre)`} />
        <path d="M0 0H600L300 252Z" fill="none" stroke="#D8BE8F" strokeWidth="1" />
        <path d="M34 12H566L300 236Z" fill="none" stroke={GOLD} strokeWidth="1.2" strokeOpacity="0.85" />
        <Band x1={50} y1={18} x2={292} y2={222} n={15} />
        <Band x1={308} y1={222} x2={550} y2={18} n={15} />
        {/* rays from the seal */}
        {Array.from({ length: 9 }, (_, i) => {
          const a = Math.PI * (1.15 + (i * 0.7) / 8)
          return <path key={i} d={`M${300 + Math.cos(a) * 52} ${236 + Math.sin(a) * 52}L${300 + Math.cos(a) * 74} ${236 + Math.sin(a) * 74}`} stroke={GOLD} strokeOpacity="0.55" strokeWidth="1.2" strokeLinecap="round" />
        })}
      </svg>
      <svg viewBox="0 0 600 262" preserveAspectRatio="none" className="wd-env-face wd-env-face-back">
        <defs>
          <pattern id={`${u}fl-liner`} width="40" height="40" patternUnits="userSpaceOnUse">
            <path d="M20 8c3 4 3 9 0 13-3-4-3-9 0-13Z" fill={GOLD_LT} fillOpacity="0.35" />
            <circle cx="0" cy="0" r="1.6" fill={GOLD_LT} fillOpacity="0.4" />
            <circle cx="40" cy="40" r="1.6" fill={GOLD_LT} fillOpacity="0.4" />
          </pattern>
        </defs>
        <path d="M0 0H600L300 252Z" fill={MAROON} />
        <path d="M0 0H600L300 252Z" fill={`url(#${u}fl-liner)`} />
        <path d="M30 10H570L300 238Z" fill="none" stroke={GOLD_LT} strokeOpacity="0.6" strokeWidth="1.2" />
      </svg>
    </div>
  )
}

/** The inside of the envelope, seen once the flap opens. */
function Liner({ u }: { u: string }) {
  return (
    <svg viewBox="0 0 600 440" preserveAspectRatio="none" className="wd-env-layer wd-env-liner" aria-hidden="true">
      <defs>
        <pattern id={`${u}ln-pat`} width="44" height="44" patternUnits="userSpaceOnUse">
          <path d="M22 9c3 4 3 10 0 14-3-4-3-10 0-14ZM14 16c4 0 7 3 8 7-4 0-7-3-8-7Zm16 0c-1 4-4 7-8 7 1-4 4-7 8-7Z" fill={GOLD_LT} fillOpacity="0.32" />
        </pattern>
        <radialGradient id={`${u}ln-shade`} cx="50%" cy="0%" r="90%"><stop offset="0" stopColor="#000" stopOpacity="0" /><stop offset="1" stopColor="#000" stopOpacity="0.35" /></radialGradient>
      </defs>
      <rect width="600" height="440" fill={MAROON} />
      <rect width="600" height="440" fill={`url(#${u}ln-pat)`} />
      <rect width="600" height="440" fill={`url(#${u}ln-shade)`} />
    </svg>
  )
}

/** The wax seal with the pressed MJ monogram. */
function Seal({ u }: { u: string }) {
  return (
    <svg viewBox="-60 -60 120 120" className="h-full w-full" aria-hidden="true">
      <defs>
        <radialGradient id={`${u}sl-wax`} cx="38%" cy="32%" r="75%">
          <stop offset="0" stopColor="#B8323F" />
          <stop offset="0.55" stopColor="#8B1235" />
          <stop offset="1" stopColor="#5A0E19" />
        </radialGradient>
        <radialGradient id={`${u}sl-inner`} cx="50%" cy="45%" r="60%">
          <stop offset="0" stopColor="#7A1220" />
          <stop offset="1" stopColor="#5A0E19" />
        </radialGradient>
        <linearGradient id={`${u}sl-gold`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#F6E3A6" />
          <stop offset="0.5" stopColor="#D8B76A" />
          <stop offset="1" stopColor="#A87B2C" />
        </linearGradient>
      </defs>
      {/* the wax, with its irregular poured edge */}
      <path d="M0-56C10-57 18-52 26-50 35-47 43-41 47-32 52-23 57-14 56-3 56 8 51 16 47 25 42 35 35 43 25 48 16 53 7 57-3 56-14 56-22 51-31 47-40 42-47 34-51 25-55 16-57 6-56-4-56-15-51-23-47-32-42-41-34-47-25-51-17-54-9-56 0-56Z" fill={`url(#${u}sl-wax)`} />
      {/* pressed rim */}
      <circle r="41" fill={`url(#${u}sl-inner)`} />
      <circle r="41" fill="none" stroke="#3E0812" strokeOpacity="0.6" strokeWidth="2" />
      <circle r="38.5" fill="none" stroke={`url(#${u}sl-gold)`} strokeWidth="1.6" />
      <circle r="34" fill="none" stroke={`url(#${u}sl-gold)`} strokeWidth="0.7" strokeDasharray="1.2 2.4" />
      {/* a lotus over the monogram */}
      <g transform="translate(0 -21) scale(0.62)" fill={`url(#${u}sl-gold)`}>
        <path d="M0 0C-4-5-4-12 0-17 4-12 4-5 0 0Z" />
        <path d="M0 0C-8-2-12-8-13-14-6-13-2-8 0 0ZM0 0C8-2 12-8 13-14 6-13 2-8 0 0Z" />
      </g>
      {/* MJ, embossed: a dark offset beneath, gold on top, a light edge */}
      <text x="0" y="13" textAnchor="middle" fontSize="30" fontFamily="var(--font-marcellus), Georgia, serif" fill="#3E0812" opacity="0.7" dx="0.8" dy="1.2">MJ</text>
      <text x="0" y="13" textAnchor="middle" fontSize="30" fontFamily="var(--font-marcellus), Georgia, serif" fill={`url(#${u}sl-gold)`}>MJ</text>
      <path d="M-16 22H16" stroke={`url(#${u}sl-gold)`} strokeWidth="1" />
      {/* the soft highlight of light on wax */}
      <ellipse cx="-20" cy="-30" rx="14" ry="6" fill="#fff" opacity="0.18" transform="rotate(-30 -20 -30)" />
    </svg>
  )
}

// ─── The opening ────────────────────────────────────────────────────────────

const T = { flap: 200, flapBack: 560, glow: 450, rise: 900, expand: 1850, leave: 2650, done: 3050 }

export function Envelope({ theme, lang, bride, groom, dateLine, storageKey, embedded = false, onDone }: Props) {
  const t = translator(lang)
  /** Prefix for the artwork's SVG ids — the builder may show two previews at once. */
  const u = `e${useId().replace(/[^\w-]/g, '')}-`
  const [phase, setPhase] = useState<Phase>('closed')
  const [flapBehind, setFlapBehind] = useState(false)
  const overlay = useRef<HTMLDivElement>(null)
  const card = useRef<HTMLDivElement>(null)
  const timers = useRef<ReturnType<typeof setTimeout>[]>([])

  const remember = useCallback(() => {
    if (!storageKey) return
    try { sessionStorage.setItem(storageKey, '1') } catch { /* private mode — fine */ }
  }, [storageKey])

  const finish = useCallback(() => {
    timers.current.forEach(clearTimeout)
    setPhase('done')
    remember()
    onDone?.()
  }, [remember, onDone])

  // Already opened in this session: go straight to the invitation.
  useEffect(() => {
    if (!storageKey) return
    try { if (sessionStorage.getItem(storageKey)) setPhase('done') } catch { /* ignore */ }
  }, [storageKey])

  // While sealed, the page underneath neither scrolls nor takes focus.
  useEffect(() => {
    const content = overlay.current?.parentElement?.querySelector<HTMLElement>('.wd-content')
    const scroller = embedded ? overlay.current?.closest<HTMLElement>('[data-wd-scroll]') : document.documentElement
    if (phase === 'done') {
      content?.removeAttribute('inert')
      if (scroller) scroller.style.overflow = ''
      return
    }
    content?.setAttribute('inert', '')
    if (scroller) { scroller.scrollTop = 0; if (!embedded) window.scrollTo(0, 0); scroller.style.overflow = 'hidden' }
    return () => { content?.removeAttribute('inert'); if (scroller) scroller.style.overflow = '' }
  }, [phase, embedded])

  // "Open again"
  useEffect(() => {
    if (embedded) return
    const replay = () => {
      document.getElementById('wd-env-hide')?.remove()
      if (card.current) card.current.removeAttribute('style')
      setFlapBehind(false)
      setPhase('closed')
    }
    window.addEventListener(ENVELOPE_REPLAY_EVENT, replay)
    return () => window.removeEventListener(ENVELOPE_REPLAY_EVENT, replay)
  }, [embedded])

  useEffect(() => () => timers.current.forEach(clearTimeout), [])

  function open() {
    if (phase !== 'closed') return
    const reduced = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches
    if (reduced) {
      setPhase('leaving')
      timers.current.push(setTimeout(finish, 450))
      return
    }
    setPhase('opening')
    const at = (ms: number, fn: () => void) => timers.current.push(setTimeout(fn, ms))
    at(T.flapBack, () => setFlapBehind(true))
    at(T.rise, () => setPhase('rise'))
    at(T.expand, () => {
      const o = overlay.current?.getBoundingClientRect()
      const el = card.current
      if (!o || !el) return
      const r = el.getBoundingClientRect()
      // Lift the card out of the envelope at exactly where it is…
      Object.assign(el.style, {
        position: 'fixed', transition: 'none', transform: 'none', zIndex: '20',
        left: `${r.left - o.left}px`, top: `${r.top - o.top}px`, width: `${r.width}px`, height: `${r.height}px`,
      })
      void el.offsetWidth
      // …then let it grow to fill the screen.
      Object.assign(el.style, {
        transition: 'left 780ms cubic-bezier(.65,0,.3,1), top 780ms cubic-bezier(.65,0,.3,1), width 780ms cubic-bezier(.65,0,.3,1), height 780ms cubic-bezier(.65,0,.3,1), border-radius 780ms ease, box-shadow 780ms ease',
        left: '0px', top: '0px', width: `${o.width}px`, height: `${o.height}px`, borderRadius: '0px', boxShadow: 'none',
      })
      setPhase('expand')
    })
    at(T.leave, () => setPhase('leaving'))
    at(T.done, finish)
  }

  if (phase === 'done') return null

  const names = [bride || t('bridePlaceholder'), groom || t('groomPlaceholder')]
  return (
    <div
      ref={overlay}
      id={embedded ? undefined : 'wd-envelope'}
      className={`wd-env-overlay ${embedded ? 'wd-env-embedded' : ''}`}
      data-phase={phase}
      data-flap={flapBehind ? 'behind' : 'front'}
      style={{ background: theme.heroBg, color: theme.heroInk }}
      role="dialog"
      aria-modal="true"
      aria-label={t('invitation')}
    >
      <div className="wd-env-backdrop" aria-hidden="true" />
      <div className="wd-env-light" aria-hidden="true" />

      <div className="wd-env-wrap">
        <div className="wd-env" onClick={open}>
          <Liner u={u} />
          <div className="wd-env-glow" aria-hidden="true" />

          {/* The card waiting in the pocket. */}
          <div ref={card} className="wd-env-card" style={{ background: theme.heroBg, color: theme.heroInk }} aria-hidden={phase === 'closed'}>
            <div className="wd-env-card-frame" style={{ borderColor: `${theme.gold}aa` }} />
            <div className="wd-env-card-body">
              <p className="wd-env-reveal wd-env-r1 wd-deva" style={{ color: theme.gold }}>{t('shubhVivah')}</p>
              <p className="wd-env-reveal wd-env-r2 wd-display wd-env-names">
                <span>{names[0]}</span>
                <span className="wd-env-heart" aria-label={t('and')}>❤️</span>
                <span>{names[1]}</span>
              </p>
              {dateLine && <p className="wd-env-reveal wd-env-r3 wd-env-date">{dateLine}</p>}
            </div>
          </div>

          <Pocket u={u} />
          <Flap u={u} />

          <button type="button" className="wd-env-seal" onClick={e => { e.stopPropagation(); open() }} aria-label={t('openCta')}>
            <Seal u={u} />
          </button>
        </div>

        <div className="wd-env-hint">
          <p className="wd-deva wd-env-cta">{t('openCta')}</p>
          <p className="wd-env-sub">{t('openHint')}</p>
        </div>
      </div>

      <button type="button" className="wd-env-skip" onClick={finish}>{t('skip')}</button>
    </div>
  )
}
