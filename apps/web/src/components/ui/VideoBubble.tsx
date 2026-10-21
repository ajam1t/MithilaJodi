'use client'

import { useEffect, useRef, useState } from 'react'

/**
 * A small round video that plays on its own, silently, on a loop — a moving
 * invitation to watch. Tapping it opens the full video with controls.
 * Under prefers-reduced-motion the circle shows its poster instead of playing.
 */
export function VideoBubble({ circleSrc, circlePoster, src, poster, kicker, title, sub }: {
  circleSrc: string; circlePoster: string; src: string; poster: string
  kicker: string; title: string; sub?: string
}) {
  const [open, setOpen] = useState(false)
  const [still, setStill] = useState(true)
  const full = useRef<HTMLVideoElement>(null)

  useEffect(() => { setStill(!!window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) }, [])
  useEffect(() => {
    if (!open) return
    full.current?.play().catch(() => {})
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setOpen(false) }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open])

  return (
    <>
      <button type="button" onClick={() => setOpen(true)} className="mj-bubble group" aria-label={`${title} — play the video`}>
        <span className="mj-bubble-ring" aria-hidden="true">
          <span className="mj-bubble-in">
            <video src={circleSrc} poster={circlePoster} muted loop playsInline autoPlay={!still} preload="metadata" tabIndex={-1} />
          </span>
          <span className="mj-bubble-play"><svg viewBox="0 0 24 24" className="h-3.5 w-3.5" fill="currentColor"><path d="M8 5.5v13l10.5-6.5Z" /></svg></span>
        </span>
        <span className="min-w-0 text-left">
          <span className="block text-[10.5px] font-semibold uppercase tracking-[0.18em] text-terra">{kicker}</span>
          <span className="mt-0.5 block font-serif text-[17px] leading-tight text-maroon">{title}</span>
          {sub && <span className="mt-0.5 block text-[12px] leading-snug text-ink-soft">{sub}</span>}
        </span>
      </button>

      {open && (
        <div className="mj-howto-modal" role="dialog" aria-modal="true" aria-label={title} onClick={() => setOpen(false)}>
          <div className="relative" onClick={e => e.stopPropagation()}>
            <video ref={full} src={src} poster={poster} controls playsInline className="mj-howto-full" />
            <button type="button" onClick={() => setOpen(false)} className="mj-howto-close" aria-label="Close video">✕</button>
          </div>
        </div>
      )}
    </>
  )
}
