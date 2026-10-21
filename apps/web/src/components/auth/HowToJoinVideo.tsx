'use client'

import { useEffect, useRef, useState } from 'react'

/**
 * "How to join" — a 30-second silent walkthrough of the real sign-up screens
 * (recorded from this site with a made-up number), shown as a small looping
 * preview beside the form. Tapping it opens the full video with controls.
 * The preview does not autoplay under prefers-reduced-motion; it shows the
 * poster instead.
 */
const SRC = '/videos/how-to-join.mp4'
const POSTER = '/videos/how-to-join.jpg'

export function HowToJoinVideo() {
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
      <button type="button" onClick={() => setOpen(true)} className="mj-howto group" aria-label="Watch how to join Mithila Jodi (30-second video)">
        <span className="mj-howto-thumb">
          <video src={SRC} poster={POSTER} muted loop playsInline autoPlay={!still} preload="metadata" aria-hidden="true" tabIndex={-1} />
          <span className="mj-howto-play" aria-hidden="true">
            <svg viewBox="0 0 24 24" className="h-4 w-4" fill="currentColor"><path d="M8 5.5v13l10.5-6.5Z" /></svg>
          </span>
        </span>
        <span className="min-w-0 text-left">
          <span className="block text-[10.5px] font-semibold uppercase tracking-[0.16em] text-terra">Watch · 30 sec</span>
          <span className="mt-0.5 block font-serif text-[17px] leading-tight text-maroon">How to join, step by step</span>
          <span className="mt-1 block text-[12px] leading-snug text-ink-soft">Number → SMS code → password → a few questions.</span>
        </span>
      </button>

      {open && (
        <div className="mj-howto-modal" role="dialog" aria-modal="true" aria-label="How to join Mithila Jodi" onClick={() => setOpen(false)}>
          <div className="relative" onClick={e => e.stopPropagation()}>
            <video ref={full} src={SRC} poster={POSTER} controls playsInline className="mj-howto-full" />
            <button type="button" onClick={() => setOpen(false)} className="mj-howto-close" aria-label="Close video">✕</button>
          </div>
        </div>
      )}
    </>
  )
}
