'use client'

/**
 * The Blush Lace Elegance opening: two panels of pearl-dotted blush tulle with
 * lace along their meeting edge, held by a lace rosette carrying the couple's
 * initials. A tap lifts the rosette and the veil parts to either side,
 * uncovering the lace cover of the invitation beneath.
 *
 * Once per browser session (same storage key, pre-paint hide and "open again"
 * event as the other openings), with a Skip and a plain fade for reduced
 * motion. CSS transforms only — no filters on the full-screen panels.
 */
import { useCallback, useEffect, useRef, useState } from 'react'
import { translator, type Lang } from '@/lib/wedding/i18n'
import { ENVELOPE_REPLAY_EVENT, useSealedPage } from './Envelope'
import { LaceRosette } from './lace'

type Phase = 'closed' | 'opening' | 'leaving' | 'done'

type Props = {
  lang: Lang
  bride: string
  groom: string
  /** sessionStorage key; null in the builder preview, which never remembers. */
  storageKey: string | null
  embedded?: boolean
}

const T = { open: 1150, leave: 400 }

/** The first letter of a name, keeping a Devanagari conjunct or matra with its letter. */
function initial(name: string): string {
  const n = name.trim()
  if (!n) return ''
  try {
    const seg = new Intl.Segmenter(undefined, { granularity: 'grapheme' })
    return seg.segment(n)[Symbol.iterator]().next().value?.segment ?? n[0]
  } catch {
    return [...n][0] ?? ''
  }
}

export function LaceVeil({ lang, bride, groom, storageKey, embedded = false }: Props) {
  const t = translator(lang)
  const [phase, setPhase] = useState<Phase>('closed')
  const overlay = useRef<HTMLDivElement>(null)
  const root = useRef<HTMLElement | null>(null)
  const timers = useRef<ReturnType<typeof setTimeout>[]>([])

  useSealedPage(overlay, phase, embedded)
  useEffect(() => { root.current = overlay.current?.closest<HTMLElement>('.wd') ?? null }, [])

  const finish = useCallback(() => {
    timers.current.forEach(clearTimeout)
    timers.current = []
    root.current?.removeAttribute('data-sealed')
    setPhase('done')
    if (storageKey) try { sessionStorage.setItem(storageKey, '1') } catch { /* private mode — fine */ }
  }, [storageKey])

  function open() {
    if (phase !== 'closed') return
    const reduced = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches
    if (reduced) {
      setPhase('leaving')
      timers.current.push(setTimeout(finish, T.leave))
      return
    }
    setPhase('opening')
    // The cover starts rising as the veil clears.
    timers.current.push(setTimeout(() => root.current?.removeAttribute('data-sealed'), T.open - 350))
    timers.current.push(setTimeout(() => setPhase('leaving'), T.open))
    timers.current.push(setTimeout(finish, T.open + T.leave))
  }

  useEffect(() => {
    if (!storageKey) return
    try { if (sessionStorage.getItem(storageKey)) finish() } catch { /* ignore */ }
  }, [storageKey, finish])

  useEffect(() => {
    if (embedded) return
    const replay = () => {
      document.getElementById('wd-env-hide')?.remove()
      timers.current.forEach(clearTimeout)
      timers.current = []
      root.current?.setAttribute('data-sealed', '')
      setPhase('closed')
    }
    window.addEventListener(ENVELOPE_REPLAY_EVENT, replay)
    return () => window.removeEventListener(ENVELOPE_REPLAY_EVENT, replay)
  }, [embedded])

  useEffect(() => () => timers.current.forEach(clearTimeout), [])

  if (phase === 'done') return null

  const a = initial(bride) || initial(t('bridePlaceholder')), b = initial(groom) || initial(t('groomPlaceholder'))
  const deva = /[ऀ-ॿ]/.test(a + b)
  return (
    <div ref={overlay} id={embedded ? undefined : 'wd-envelope'} className="wd-veil" data-phase={phase} role="dialog" aria-modal="true" aria-label={t('invitation')}>
      <div className="wd-veil-half wd-veil-l" aria-hidden="true"><span className="wd-veil-lace" /></div>
      <div className="wd-veil-half wd-veil-r" aria-hidden="true"><span className="wd-veil-lace" /></div>
      <button type="button" className="wd-veil-seal" onClick={open} aria-label={t('openCta')}>
        <LaceRosette className="absolute inset-0 h-full w-full" />
        <span className={`wd-veil-mono ${deva ? 'wd-deva' : ''}`} aria-hidden="true">{a}<i>&amp;</i>{b}</span>
      </button>
      <p className={`wd-veil-hint ${/[ऀ-ॿ]/.test(t('openHint')) ? 'wd-deva' : ''}`} aria-hidden="true">{t('openHint')}</p>
      <button type="button" className="wd-veil-skip" onClick={finish}>{t('skip')}</button>
    </div>
  )
}
