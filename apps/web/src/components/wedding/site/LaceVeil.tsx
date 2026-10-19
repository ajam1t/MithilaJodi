'use client'

/**
 * The Blush Lace Elegance opening: two panels of pearl-dotted blush tulle with
 * lace along their meeting edge, held by a lace rosette carrying the
 * Mithila Jodi seal. A tap lifts the rosette and the veil parts to either side,
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
  /** sessionStorage key; null in the builder preview, which never remembers. */
  storageKey: string | null
  embedded?: boolean
}

const T = { open: 1150, leave: 400 }

export function LaceVeil({ lang, storageKey, embedded = false }: Props) {
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

  return (
    <div ref={overlay} id={embedded ? undefined : 'wd-envelope'} className="wd-veil" data-phase={phase} role="dialog" aria-modal="true" aria-label={t('invitation')}>
      <div className="wd-veil-half wd-veil-l" aria-hidden="true"><span className="wd-veil-lace" /></div>
      <div className="wd-veil-half wd-veil-r" aria-hidden="true"><span className="wd-veil-lace" /></div>
      <button type="button" className="wd-veil-seal" onClick={open} aria-label={t('openCta')}>
        <LaceRosette className="absolute inset-0 h-full w-full" />
        {/* The seal is pressed with the Mithila Jodi name, like the classic envelope's. */}
        <span className="wd-veil-mono" aria-hidden="true">
          <svg viewBox="-16 -20 32 22" className="wd-veil-lotus"><path d="M0 0C-4-5-4-12 0-17 4-12 4-5 0 0ZM0 0C-8-2-12-8-13-14-6-13-2-8 0 0ZM0 0C8-2 12-8 13-14 6-13 2-8 0 0Z" fill="#C8A96B" /></svg>
          <span>Mithila</span><span>Jodi</span>
          <span className="wd-veil-rule" />
        </span>
      </button>
      <p className={`wd-veil-hint ${/[ऀ-ॿ]/.test(t('openHint')) ? 'wd-deva' : ''}`} aria-hidden="true">{t('openHint')}</p>
      <button type="button" className="wd-veil-skip" onClick={finish}>{t('skip')}</button>
    </div>
  )
}
