'use client'

/**
 * The "MJ Scratch to Reveal" opening — an alternative to the sealed envelope.
 *
 *   an ivory embossed card, closed by four folded flaps and the gold Mithila
 *   Jodi seal → the guest scratches three gold-foil tiles to uncover the
 *   wedding day, month and year → a golden shimmer once the date is free →
 *   a tap on the seal (or a moment's wait) folds the flaps open on warm light
 *   and the invitation underneath appears.
 *
 * The foil is a real scratch surface: each tile is a <canvas> painted with gold
 * and erased with `destination-out` strokes along the guest's finger, mouse or
 * pen. A tile counts as revealed once enough of its foil is gone (`threshold`),
 * and the rest dissolves. "Reveal without scratching" does the same for
 * keyboard and switch users; "Skip" goes straight to the invitation.
 *
 * Once per browser session, like the envelope (same storage key, same
 * pre-paint hide and "open again" event). Everything is CSS, inline SVG and
 * three small canvases — no video, no animation library. Without a usable
 * canvas the tiles fall back to a plain gold cover that opens with a tap.
 */
import { useCallback, useEffect, useId, useRef, useState, type CSSProperties, type PointerEvent as ReactPointerEvent } from 'react'
import { dateL, datePartsL, timeL, translator, weekdayL, type Lang } from '@/lib/wedding/i18n'
import { ENVELOPE_REPLAY_EVENT, useSealedPage } from './Envelope'
import { FLORALS, lotusPath, r1 } from './florals'

type Phase = 'sealed' | 'revealed' | 'opening' | 'leaving' | 'done'

type Props = {
  lang: Lang
  /** The saved wedding date (YYYY-MM-DD) and time (HH:MM); either may be empty in a draft. */
  date: string
  time: string
  /** sessionStorage key; null in the builder preview, which never remembers. */
  storageKey: string | null
  /** Builder preview: the opening lives inside the preview frame. */
  embedded?: boolean
  /** Share of a tile's foil (0–1) that must be scratched away before it reveals itself. */
  threshold?: number
}

/** Timings (ms): wait before opening on its own once the date is revealed, the flap fold, the fade. */
const T = { autoOpen: 3200, open: 1300, leave: 450 }

const BRAND_TAGLINE = 'जहाँ परंपरा मिले, प्रेम से'
const DEVANAGARI = /[ऀ-ॿ]/
const face = (text: string) => (DEVANAGARI.test(text) ? 'wd-deva' : 'wd-display')


// ─── Artwork ────────────────────────────────────────────────────────────────

/** Embossed paper: a soft shadow below, a white highlight above, and a gold line that warms in on reveal. */
function FloralArt({ id }: { id: string }) {
  return (
    <svg width="0" height="0" className="absolute" aria-hidden="true" focusable="false">
      <defs>
        <g id={id} fill="none" strokeLinecap="round" strokeLinejoin="round">
          <path d={FLORALS} stroke="#9C7B47" strokeOpacity="0.32" strokeWidth="1.6" transform="translate(0.9 1.2)" />
          <path d={FLORALS} stroke="#FFFFFF" strokeOpacity="0.95" strokeWidth="1.3" transform="translate(-0.6 -0.8)" />
          <path d={FLORALS} stroke="#E9DCC3" strokeWidth="0.9" />
          <path d={FLORALS} stroke="currentColor" strokeWidth="0.8" />
        </g>
      </defs>
    </svg>
  )
}

/** The gold seal, pressed with the official Mithila Jodi monogram. */
function Seal({ u }: { u: string }) {
  const scallops = Array.from({ length: 28 }, (_, i) => {
    const a = (i / 28) * Math.PI * 2
    return `${i ? 'L' : 'M'}${r1(Math.cos(a) * (i % 2 ? 54 : 58))} ${r1(Math.sin(a) * (i % 2 ? 54 : 58))}`
  }).join('')
  return (
    <svg viewBox="-60 -60 120 120" className="h-full w-full" aria-hidden="true" focusable="false">
      <defs>
        <radialGradient id={`${u}gold`} cx="35%" cy="30%" r="80%">
          <stop offset="0" stopColor="#F8E7B0" />
          <stop offset="0.45" stopColor="#D9B565" />
          <stop offset="0.8" stopColor="#B4862F" />
          <stop offset="1" stopColor="#8E6420" />
        </radialGradient>
        <linearGradient id={`${u}rim`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#FFF4CF" />
          <stop offset="0.5" stopColor="#C99A45" />
          <stop offset="1" stopColor="#8A611E" />
        </linearGradient>
        <radialGradient id={`${u}ivory`} cx="50%" cy="40%" r="65%">
          <stop offset="0" stopColor="#FFFDF6" />
          <stop offset="1" stopColor="#F1E4C8" />
        </radialGradient>
        <clipPath id={`${u}clip`}><circle r="35" /></clipPath>
      </defs>
      <path d={`${scallops}Z`} fill={`url(#${u}gold)`} stroke="#8A611E" strokeOpacity="0.5" strokeWidth="0.8" strokeLinejoin="round" />
      <circle r="47" fill="none" stroke={`url(#${u}rim)`} strokeWidth="2.4" />
      <circle r="43" fill="none" stroke="#8A611E" strokeOpacity="0.55" strokeWidth="0.7" strokeDasharray="1.2 2.2" />
      <circle r="38.5" fill={`url(#${u}ivory)`} stroke="#8A611E" strokeOpacity="0.6" strokeWidth="1" />
      <circle r="37" fill="none" stroke="#FFFFFF" strokeOpacity="0.8" strokeWidth="0.8" />
      <image href="/logo-mark.png" x="-30" y="-28.5" width="60" height="55.3" clipPath={`url(#${u}clip)`} preserveAspectRatio="xMidYMid meet" />
      <ellipse cx="-22" cy="-30" rx="16" ry="6" fill="#FFFFFF" opacity="0.28" transform="rotate(-32 -22 -30)" />
    </svg>
  )
}

// ─── One scratch tile ───────────────────────────────────────────────────────

/** A tiny seeded random, so the foil looks the same every time it is painted. */
function seeded(seed: number) {
  let s = seed
  return () => ((s = (s * 16807) % 2147483647) - 1) / 2147483646
}

function paintFoil(ctx: CanvasRenderingContext2D, w: number, h: number, dpr: number, seed: number) {
  ctx.globalCompositeOperation = 'source-over'
  ctx.clearRect(0, 0, w, h)
  const g = ctx.createLinearGradient(0, 0, w, h)
  g.addColorStop(0, '#B8892F')
  g.addColorStop(0.28, '#EBD08A')
  g.addColorStop(0.5, '#C99B45')
  g.addColorStop(0.72, '#F2DC9C')
  g.addColorStop(1, '#A87A28')
  ctx.fillStyle = g
  ctx.fillRect(0, 0, w, h)
  const rand = seeded(seed)
  // Brushed metal: fine diagonal strokes of light and shade.
  ctx.lineWidth = dpr
  for (let i = -h; i < w; i += 3 * dpr) {
    ctx.strokeStyle = rand() > 0.5 ? `rgba(255,248,220,${0.06 + rand() * 0.1})` : `rgba(110,70,15,${0.04 + rand() * 0.07})`
    ctx.beginPath(); ctx.moveTo(i, h); ctx.lineTo(i + h * 0.6, 0); ctx.stroke()
  }
  // Glitter.
  const flecks = Math.round((w * h) / (380 * dpr * dpr))
  for (let i = 0; i < flecks; i++) {
    ctx.fillStyle = `rgba(255,252,235,${0.25 + rand() * 0.55})`
    ctx.fillRect(rand() * w, rand() * h, dpr * (rand() > 0.85 ? 1.6 : 0.9), dpr * (rand() > 0.85 ? 1.6 : 0.9))
  }
  // A pressed lotus mark in the middle, so the tile reads as a seal of foil.
  ctx.save()
  ctx.translate(w / 2, h / 2 + 6 * dpr)
  ctx.scale(dpr * 0.9, dpr * 0.9)
  ctx.lineWidth = 1.4
  ctx.strokeStyle = 'rgba(120,80,20,0.4)'
  ctx.stroke(new Path2D(lotusPath(0, 0, 0.9)))
  ctx.restore()
  // Bevelled edge.
  ctx.lineWidth = 2 * dpr
  ctx.strokeStyle = 'rgba(255,246,214,0.6)'
  ctx.strokeRect(dpr, dpr, w - 2 * dpr, h - 2 * dpr)
  ctx.lineWidth = dpr
  ctx.strokeStyle = 'rgba(110,72,18,0.45)'
  ctx.strokeRect(4 * dpr, 4 * dpr, w - 8 * dpr, h - 8 * dpr)
}

/** Share of the foil already scratched away, sampled on a coarse grid. */
function clearedShare(ctx: CanvasRenderingContext2D, w: number, h: number): number {
  if (!w || !h) return 0
  const data = ctx.getImageData(0, 0, w, h).data
  const step = 6
  let clear = 0, total = 0
  for (let y = 0; y < h; y += step) {
    for (let x = 0; x < w; x += step) {
      total++
      if (data[(y * w + x) * 4 + 3] < 64) clear++
    }
  }
  return total ? clear / total : 0
}

type TileProps = {
  value: string
  label: string
  index: number
  threshold: number
  /** Set by the parent to dissolve the foil without scratching. */
  force: boolean
  onScratch: () => void
  onRevealed: (index: number) => void
}

function ScratchTile({ value, label, index, threshold, force, onScratch, onRevealed }: TileProps) {
  const canvas = useRef<HTMLCanvasElement>(null)
  const ctxRef = useRef<CanvasRenderingContext2D | null>(null)
  const last = useRef<{ x: number; y: number } | null>(null)
  const rect = useRef<DOMRect | null>(null)
  const frame = useRef(0)
  const lastCheck = useRef(0)
  const done = useRef(false)
  /** 'cover' until the foil is painted (the date never shows before it), then 'foil', then 'clear'. */
  const [state, setState] = useState<'cover' | 'foil' | 'fallback' | 'clear'>('cover')

  const reveal = useCallback(() => {
    if (done.current) return
    done.current = true
    setState('clear')
    onRevealed(index)
  }, [index, onRevealed])

  // Paint the foil, and repaint it if the tile changes size before it is scratched.
  useEffect(() => {
    const el = canvas.current
    if (!el) return
    let ctx: CanvasRenderingContext2D | null = null
    try { ctx = el.getContext('2d', { willReadFrequently: true }) } catch { ctx = null }
    if (!ctx) { setState('fallback'); return }
    ctxRef.current = ctx
    const paint = () => {
      if (done.current) return
      const dpr = Math.min(window.devicePixelRatio || 1, 2)
      const { width, height } = el.getBoundingClientRect()
      if (!width || !height) return
      el.width = Math.round(width * dpr)
      el.height = Math.round(height * dpr)
      paintFoil(ctx!, el.width, el.height, dpr, 7 + index * 131)
      setState(s => (s === 'cover' ? 'foil' : s))
    }
    paint()
    let w = el.getBoundingClientRect().width
    const ro = typeof ResizeObserver === 'undefined' ? null : new ResizeObserver(() => {
      const nw = el.getBoundingClientRect().width
      if (Math.abs(nw - w) > 1) { w = nw; paint() }
    })
    ro?.observe(el)
    // Older iOS ignores touch-action on canvas; stop the page from scrolling under a finger here only.
    const stop = (e: TouchEvent) => { if (!done.current) e.preventDefault() }
    el.addEventListener('touchmove', stop, { passive: false })
    return () => {
      ro?.disconnect()
      el.removeEventListener('touchmove', stop)
      cancelAnimationFrame(frame.current)
      ctxRef.current = null
      // Release the bitmap straight away rather than waiting for garbage collection.
      el.width = 0
      el.height = 0
    }
  }, [index])

  useEffect(() => { if (force) reveal() }, [force, reveal])

  const check = () => {
    frame.current = 0
    const ctx = ctxRef.current, el = canvas.current
    if (!ctx || !el || done.current) return
    lastCheck.current = performance.now()
    if (clearedShare(ctx, el.width, el.height) >= threshold) reveal()
  }

  const scratchTo = (x: number, y: number) => {
    const ctx = ctxRef.current, el = canvas.current
    if (!ctx || !el || done.current) return
    const dpr = el.width / (rect.current?.width || 1)
    const brush = Math.max(16, (rect.current?.width ?? 90) * 0.16) * dpr
    ctx.globalCompositeOperation = 'destination-out'
    ctx.lineCap = 'round'
    ctx.lineJoin = 'round'
    ctx.lineWidth = brush
    ctx.beginPath()
    const from = last.current ?? { x, y }
    ctx.moveTo(from.x * dpr, from.y * dpr)
    ctx.lineTo(x * dpr + 0.01, y * dpr)
    ctx.stroke()
    last.current = { x, y }
    // Measure progress at most every ~120 ms, on an animation frame.
    if (!frame.current && performance.now() - lastCheck.current > 120) frame.current = requestAnimationFrame(check)
  }

  const point = (e: ReactPointerEvent) => {
    const r = rect.current ?? e.currentTarget.getBoundingClientRect()
    return { x: e.clientX - r.left, y: e.clientY - r.top }
  }

  return (
    <div className="wd-sr-tile" data-state={state}>
      <span className="wd-sr-tile-value" aria-hidden={state !== 'clear'}>
        <span className={`${face(value)} wd-sr-tile-text`} data-long={value.length > 4 ? '' : undefined}>{value}</span>
        <span className={`wd-sr-tile-label ${DEVANAGARI.test(label) ? 'wd-deva' : ''}`}>{label}</span>
      </span>
      {state === 'fallback' ? (
        <button type="button" className="wd-sr-foil wd-sr-foil-plain" onClick={() => { onScratch(); reveal() }} aria-label={label} />
      ) : (
        <canvas
          ref={canvas}
          className="wd-sr-foil"
          aria-hidden="true"
          onPointerDown={e => {
            if (done.current || (e.pointerType === 'mouse' && e.button !== 0)) return
            e.currentTarget.setPointerCapture?.(e.pointerId)
            rect.current = e.currentTarget.getBoundingClientRect()
            last.current = null
            onScratch()
            const p = point(e)
            scratchTo(p.x, p.y)
          }}
          onPointerMove={e => {
            if (!last.current) return
            const p = point(e)
            scratchTo(p.x, p.y)
          }}
          onPointerUp={() => { last.current = null; if (!frame.current) check() }}
          onPointerCancel={() => { last.current = null }}
          onLostPointerCapture={() => { last.current = null }}
        />
      )}
      <span className="wd-sr-tile-shine" aria-hidden="true" />
    </div>
  )
}

// ─── The opening ────────────────────────────────────────────────────────────

/** Fixed spark directions for the opening burst (deterministic, so server and browser agree). */
const SPARKS = Array.from({ length: 14 }, (_, i) => {
  const a = (i / 14) * Math.PI * 2 + (i % 3) * 0.21
  const d = 90 + ((i * 37) % 70)
  return { dx: r1(Math.cos(a) * d), dy: r1(Math.sin(a) * d), delay: (i % 5) * 60 }
})

export function ScratchReveal({ lang, date, time, storageKey, embedded = false, threshold = 0.55 }: Props) {
  const t = translator(lang)
  const u = `s${useId().replace(/[^\w-]/g, '')}-`
  const [phase, setPhase] = useState<Phase>('sealed')
  const [cleared, setCleared] = useState([false, false, false])
  const [force, setForce] = useState(false)
  const [touched, setTouched] = useState(false)
  /** Bumped by "open again" so the tiles repaint fresh foil. */
  const [run, setRun] = useState(0)
  const overlay = useRef<HTMLDivElement>(null)
  const seal = useRef<HTMLButtonElement>(null)
  const timers = useRef<ReturnType<typeof setTimeout>[]>([])
  const phaseRef = useRef<Phase>(phase)
  phaseRef.current = phase

  useSealedPage(overlay, phase, embedded)

  const remember = useCallback(() => {
    if (!storageKey) return
    try { sessionStorage.setItem(storageKey, '1') } catch { /* private mode — fine */ }
  }, [storageKey])

  const finish = useCallback(() => {
    timers.current.forEach(clearTimeout)
    timers.current = []
    setPhase('done')
    remember()
  }, [remember])

  const open = useCallback(() => {
    if (phaseRef.current !== 'sealed' && phaseRef.current !== 'revealed') return
    timers.current.forEach(clearTimeout)
    const reduced = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches
    timers.current = reduced
      ? [setTimeout(finish, T.leave)]
      : [setTimeout(() => setPhase('leaving'), T.open), setTimeout(finish, T.open + T.leave)]
    setPhase(reduced ? 'leaving' : 'opening')
  }, [finish])

  // Already opened in this session: go straight to the invitation.
  useEffect(() => {
    if (!storageKey) return
    try { if (sessionStorage.getItem(storageKey)) setPhase('done') } catch { /* ignore */ }
  }, [storageKey])

  // "Open again"
  useEffect(() => {
    if (embedded) return
    const replay = () => {
      document.getElementById('wd-env-hide')?.remove()
      timers.current.forEach(clearTimeout)
      timers.current = []
      setCleared([false, false, false])
      setForce(false)
      setTouched(false)
      setRun(n => n + 1)
      setPhase('sealed')
    }
    window.addEventListener(ENVELOPE_REPLAY_EVENT, replay)
    return () => window.removeEventListener(ENVELOPE_REPLAY_EVENT, replay)
  }, [embedded])

  useEffect(() => () => timers.current.forEach(clearTimeout), [])

  // The flaps meet under the seal, wherever the layout puts it.
  useEffect(() => {
    const o = overlay.current, s = seal.current
    if (!o || !s || phase === 'done') return
    const place = () => {
      const or = o.getBoundingClientRect(), sr = s.getBoundingClientRect()
      o.style.setProperty('--cx', `${r1(sr.left + sr.width / 2 - or.left)}px`)
      o.style.setProperty('--cy', `${r1(sr.top + sr.height / 2 - or.top)}px`)
    }
    place()
    if (typeof ResizeObserver === 'undefined') {
      window.addEventListener('resize', place)
      return () => window.removeEventListener('resize', place)
    }
    const ro = new ResizeObserver(place)
    ro.observe(o)
    return () => ro.disconnect()
  }, [phase === 'done', run]) // eslint-disable-line react-hooks/exhaustive-deps

  // All three tiles free: shimmer, remember, then open on its own after a moment.
  const allClear = cleared.every(Boolean)
  useEffect(() => {
    if (!allClear || phase !== 'sealed') return
    setPhase('revealed')
    remember()
    timers.current.push(setTimeout(open, T.autoOpen))
    // Revealed from the keyboard: move focus to the seal so the guest can open at once.
    if (force) requestAnimationFrame(() => seal.current?.focus({ preventScroll: true }))
  }, [allClear, phase, remember, open, force])

  const onRevealed = useCallback((i: number) => {
    setCleared(prev => (prev[i] ? prev : prev.map((v, j) => (j === i ? true : v))))
  }, [])
  const onScratch = useCallback(() => setTouched(true), [])

  if (phase === 'done') return null

  const parts = datePartsL(lang, date)
  const tiles = [
    { value: parts?.day ?? '—', label: t('scratchDay') },
    { value: parts?.month ?? '—', label: t('scratchMonth') },
    { value: parts?.year ?? '—', label: t('scratchYear') },
  ]
  const when = [weekdayL(lang, date), timeL(lang, time)].filter(Boolean).join(' · ')
  const revealed = phase !== 'sealed'

  return (
    <div
      ref={overlay}
      id={embedded ? undefined : 'wd-envelope'}
      className={`wd-sr ${embedded ? 'wd-sr-embedded' : ''}`}
      data-phase={phase}
      data-touched={touched ? '' : undefined}
      role="dialog"
      aria-modal="true"
      aria-label={t('invitation')}
    >
      <FloralArt id={`${u}art`} />

      <div className="wd-sr-flaps" aria-hidden="true">
        {(['left', 'right', 'bottom', 'top'] as const).map(f => (
          <div key={f} className={`wd-sr-flap-wrap wd-sr-${f}`}>
            <div className="wd-sr-flap">
              <svg viewBox="0 0 400 800" preserveAspectRatio="xMidYMid slice" className="wd-sr-art"><use href={`#${u}art`} /></svg>
            </div>
          </div>
        ))}
      </div>
      <div className="wd-sr-light" aria-hidden="true" />
      <div className="wd-sr-burst" aria-hidden="true">
        {SPARKS.map((s, i) => (
          <i key={i} style={{ '--dx': `${s.dx}px`, '--dy': `${s.dy}px`, animationDelay: `${s.delay}ms` } as CSSProperties} />
        ))}
      </div>

      <div className="wd-sr-body">
        <div className="wd-sr-brand">
          <p className="wd-display wd-sr-brand-name">Mithila Jodi</p>
          <p className="wd-deva wd-sr-brand-tag" lang="hi">{BRAND_TAGLINE}</p>
        </div>

        <button
          ref={seal}
          type="button"
          className="wd-sr-seal"
          onClick={open}
          disabled={!revealed}
          aria-label={t('openCta')}
        >
          <Seal u={u} />
        </button>

        <div className="wd-sr-panel">
          <p className={`${face(t('scratchTitle'))} wd-sr-title`}>{t('scratchTitle')}</p>
          <p className={`wd-sr-hint ${DEVANAGARI.test(t('scratchHint')) ? 'wd-deva' : ''}`}>
            <span aria-hidden="true">✦ </span>{revealed ? t('scratchEnter') : t('scratchHint')}<span aria-hidden="true"> ✦</span>
          </p>
          <div className="wd-sr-tiles" role="group" aria-label={revealed ? t('scratchRevealed', { date: dateL(lang, date) }) : t('scratchHidden')}>
            {tiles.map((tile, i) => (
              <ScratchTile
                key={`${run}-${i}`}
                index={i}
                value={tile.value}
                label={tile.label}
                threshold={threshold}
                force={force}
                onScratch={onScratch}
                onRevealed={onRevealed}
              />
            ))}
          </div>
          <p className="wd-sr-when" aria-hidden={!revealed}>{when || ' '}</p>
          {!revealed && (
            <button type="button" className="wd-sr-alt" onClick={() => { setTouched(true); setForce(true) }}>
              {t('scratchAlt')}
            </button>
          )}
        </div>
      </div>

      <p className="sr-only" aria-live="polite">{revealed && date ? t('scratchRevealed', { date: dateL(lang, date) }) : ''}</p>
      <button type="button" className="wd-sr-skip" onClick={finish}>{t('skip')}</button>
    </div>
  )
}
