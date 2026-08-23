'use client'
import { useState, useEffect } from 'react'

/**
 * Cinematic 2-screen opening (~4.5s), shown once per browser session.
 *   Screen 1  — "Some stories are meant to become / a lifetime."
 *   Screen 2  — "Mithila Jodi" + gold rule + "WHERE TRADITION MEETS TOGETHERNESS"
 * then fades into the existing homepage. No artwork, no navigation.
 * Gated by sessionStorage; respects prefers-reduced-motion; skippable.
 */
export function IntroAnimation() {
  const [show, setShow] = useState(false)
  const [started, setStarted] = useState(false)   // triggers the first fade-in
  const [screen, setScreen] = useState<1 | 2>(1)
  const [exiting, setExiting] = useState(false)

  useEffect(() => {
    if (typeof window === 'undefined') return
    try {
      if (sessionStorage.getItem('mj-intro-seen')) return
    } catch { return }
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      try { sessionStorage.setItem('mj-intro-seen', '1') } catch {}
      return
    }

    setShow(true)
    const timers: ReturnType<typeof setTimeout>[] = []
    timers.push(setTimeout(() => setStarted(true), 60))    // fade Screen 1 in
    timers.push(setTimeout(() => setScreen(2), 2300))      // swap to Screen 2
    timers.push(setTimeout(() => setExiting(true), 4300))  // fade overlay out
    timers.push(setTimeout(() => {
      setShow(false)
      try { sessionStorage.setItem('mj-intro-seen', '1') } catch {}
    }, 4900))
    return () => timers.forEach(clearTimeout)
  }, [])

  function handleSkip() {
    setExiting(true)
    setTimeout(() => {
      setShow(false)
      try { sessionStorage.setItem('mj-intro-seen', '1') } catch {}
    }, 450)
  }

  if (!show) return null

  const screen1Visible = started && screen === 1 && !exiting
  const screen2Visible = screen === 2 && !exiting

  return (
    <div
      role="presentation"
      aria-hidden="true"
      style={{
        position: 'fixed', inset: 0, zIndex: 9999,
        background: '#FBF1DD',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: '24px',
        overflow: 'hidden',
        opacity: exiting ? 0 : 1,
        transition: 'opacity 0.6s ease',
        pointerEvents: exiting ? 'none' : 'all',
      }}
    >
      {/* ── Screen 1 ── */}
      <div
        style={{
          position: 'absolute',
          textAlign: 'center',
          maxWidth: 640,
          padding: '0 24px',
          opacity: screen1Visible ? 1 : 0,
          transform: screen1Visible ? 'translateY(0)' : 'translateY(10px)',
          transition: 'opacity 1s ease, transform 1s ease',
        }}
      >
        <p
          className="font-serif"
          style={{
            fontStyle: 'italic',
            fontSize: 'clamp(18px, 4.5vw, 30px)',
            color: '#6B4A3A',
            lineHeight: 1.5,
            marginBottom: '0.35em',
          }}
        >
          Some stories are meant to become
        </p>
        <p
          className="font-serif"
          style={{
            fontWeight: 700,
            fontSize: 'clamp(34px, 8vw, 60px)',
            color: '#7A1220',
            lineHeight: 1.1,
          }}
        >
          a lifetime.
        </p>
      </div>

      {/* ── Screen 2 ── */}
      <div
        style={{
          position: 'absolute',
          textAlign: 'center',
          padding: '0 24px',
          opacity: screen2Visible ? 1 : 0,
          transform: screen2Visible ? 'translateY(0) scale(1)' : 'translateY(12px) scale(0.985)',
          transition: 'opacity 0.9s ease, transform 0.9s ease',
        }}
      >
        <h1
          className="font-serif"
          style={{
            fontSize: 'clamp(40px, 11vw, 84px)',
            color: '#7A1220',
            lineHeight: 1.05,
            letterSpacing: '0.01em',
          }}
        >
          Mithila Jodi
        </h1>
        <div
          style={{
            width: 'clamp(90px, 22vw, 150px)',
            height: 1,
            margin: '18px auto 16px',
            background: 'linear-gradient(90deg, transparent, #C9A24B, transparent)',
          }}
        />
        <p
          style={{
            fontSize: 'clamp(10px, 2.6vw, 13px)',
            letterSpacing: '0.32em',
            textTransform: 'uppercase',
            color: '#8A6D3B',
            fontWeight: 500,
          }}
        >
          Where Tradition Meets Togetherness
        </p>
      </div>

      {/* ── Skip ── */}
      <button
        type="button"
        onClick={handleSkip}
        aria-label="Skip intro"
        style={{
          position: 'absolute',
          bottom: 20,
          right: 20,
          zIndex: 2,
          fontSize: 12,
          color: '#7A1220',
          background: 'rgba(255,248,234,0.9)',
          border: '1px solid rgba(201,162,75,0.5)',
          borderRadius: 999,
          padding: '5px 14px',
          cursor: 'pointer',
          pointerEvents: 'auto',
        }}
      >
        Skip →
      </button>
    </div>
  )
}
