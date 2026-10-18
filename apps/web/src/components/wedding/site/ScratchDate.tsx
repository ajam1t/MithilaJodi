'use client'

/**
 * "The Date" on the MJ Scratch & Reveal invitation: three tiles of gold foil
 * over the wedding day, month and year, which the guest scratches away.
 *
 * Each tile is a <canvas> painted with gold and erased with `destination-out`
 * strokes along the guest's finger, mouse or pen. A tile counts as revealed
 * once enough of its foil is gone (`threshold`) and the rest dissolves; with
 * all three free, a golden shimmer runs across them and the weekday and time
 * appear. "Reveal without scratching" does the same for keyboard and switch
 * users. Revealed once, it stays revealed for the rest of the visit.
 *
 * Until a tile's foil is painted it shows plain gold, so the date never
 * flashes; without a usable canvas it falls back to a gold cover opened with a
 * tap. Page scrolling is blocked only on the foil itself.
 */
import { useCallback, useEffect, useRef, useState, type PointerEvent as ReactPointerEvent } from 'react'
import { dateL, datePartsL, timeL, translator, weekdayL, type Lang } from '@/lib/wedding/i18n'
import { lotusPath } from './florals'

const DEVANAGARI = /[ऀ-ॿ]/
const face = (text: string) => (DEVANAGARI.test(text) ? 'wd-deva' : 'wd-display')

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
    <div className="wd-sd-tile" data-state={state}>
      <span className="wd-sd-tile-value" aria-hidden={state !== 'clear'}>
        <span className={`${face(value)} wd-sd-tile-text`} data-long={value.length > 4 ? '' : undefined}>{value}</span>
        <span className={`wd-sd-tile-label ${DEVANAGARI.test(label) ? 'wd-deva' : ''}`}>{label}</span>
      </span>
      {state === 'fallback' ? (
        <button type="button" className="wd-sd-foil wd-sd-foil-plain" onClick={() => { onScratch(); reveal() }} aria-label={label} />
      ) : (
        <canvas
          ref={canvas}
          className="wd-sd-foil"
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
      <span className="wd-sd-tile-shine" aria-hidden="true" />
    </div>
  )
}

type Props = {
  lang: Lang
  /** The saved wedding date (YYYY-MM-DD) and time (HH:MM); either may be empty in a draft. */
  date: string
  time: string
  /** sessionStorage key to remember the reveal for this visit; null in the builder preview. */
  storageKey: string | null
  /** Share of a tile's foil (0–1) that must be scratched away before it reveals itself. */
  threshold?: number
}

export function ScratchDate({ lang, date, time, storageKey, threshold = 0.5 }: Props) {
  const t = translator(lang)
  const [cleared, setCleared] = useState([false, false, false])
  const [force, setForce] = useState(false)
  const [touched, setTouched] = useState(false)
  const [revealed, setRevealed] = useState(false)
  /** Bumped to repaint fresh foil, e.g. when the builder preview's date changes. */
  const [run, setRun] = useState(0)

  // Already revealed in this visit: show the date straight away.
  useEffect(() => {
    if (!storageKey) return
    try { if (sessionStorage.getItem(storageKey)) { setForce(true); setTouched(true) } } catch { /* ignore */ }
  }, [storageKey])

  // A new date (in the builder) gets new foil.
  const first = useRef(true)
  useEffect(() => {
    if (first.current) { first.current = false; return }
    setCleared([false, false, false]); setForce(false); setTouched(false); setRevealed(false); setRun(n => n + 1)
  }, [date])

  const allClear = cleared.every(Boolean)
  useEffect(() => {
    if (!allClear || revealed) return
    setRevealed(true)
    if (storageKey) try { sessionStorage.setItem(storageKey, '1') } catch { /* private mode — fine */ }
  }, [allClear, revealed, storageKey])

  const onRevealed = useCallback((i: number) => {
    setCleared(prev => (prev[i] ? prev : prev.map((v, j) => (j === i ? true : v))))
  }, [])
  const onScratch = useCallback(() => setTouched(true), [])

  const parts = datePartsL(lang, date)
  const tiles = [
    { value: parts?.day ?? '—', label: t('scratchDay') },
    { value: parts?.month ?? '—', label: t('scratchMonth') },
    { value: parts?.year ?? '—', label: t('scratchYear') },
  ]
  const when = [weekdayL(lang, date), timeL(lang, time)].filter(Boolean).join(' · ')
  const hint = t('scratchHint')

  return (
    <section id="date" className="wd-section wd-sd" data-revealed={revealed ? '' : undefined} data-touched={touched ? '' : undefined} aria-labelledby="date-h">
      <div className="wd-wrap text-center">
        <h2 id="date-h" className="wd-h2">{t('scratchTitle')}</h2>
        <p className={`wd-sd-hint ${DEVANAGARI.test(hint) ? 'wd-deva' : ''}`}><span aria-hidden="true">✦ </span>{hint}<span aria-hidden="true"> ✦</span></p>
        <div className="wd-sd-tiles" role="group" aria-label={revealed ? t('scratchRevealed', { date: dateL(lang, date) }) : t('scratchHidden')}>
          {tiles.map((tile, i) => (
            <ScratchTile key={`${run}-${i}`} index={i} value={tile.value} label={tile.label} threshold={threshold} force={force} onScratch={onScratch} onRevealed={onRevealed} />
          ))}
        </div>
        <p className="wd-sd-when" aria-hidden={!revealed}>{when || '\u00A0'}</p>
        {!revealed && (
          <button type="button" className="wd-sd-alt" onClick={() => { setTouched(true); setForce(true) }}>{t('scratchAlt')}</button>
        )}
        <p className="sr-only" aria-live="polite">{revealed && date ? t('scratchRevealed', { date: dateL(lang, date) }) : ''}</p>
      </div>
    </section>
  )
}
