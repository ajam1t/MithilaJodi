'use client'

import { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'

/**
 * The moment between pressing Log In and arriving: the page opens from the
 * button into a deep-maroon sky with the Mithila Jodi mark and a welcome at its
 * centre. When the server says yes, the sky fades to ivory and the next page
 * (also ivory) follows; if it says no, the portal closes back into the button
 * and the form shows the error. One entrance, nothing looping.
 *
 * It only reflects the request — it never delays it. `phase` comes from the
 * login form: 'travel' while the request is in flight, 'arrive' once it has
 * succeeded (the redirect is already under way), 'idle' otherwise.
 * Decorative and aria-hidden; the form's own button text carries the status.
 * prefers-reduced-motion: a plain fade with the words.
 */

export type PortalPhase = 'idle' | 'travel' | 'arrive'

export function LoginPortal({ phase, origin }: { phase: PortalPhase; origin: { x: number; y: number } | null }) {
  // Rendered into <body>: an ancestor with a transform (the page's fade-in) would
  // otherwise trap a fixed overlay inside the card.
  const [mounted, setMounted] = useState(false)
  useEffect(() => setMounted(true), [])
  const on = phase !== 'idle'
  const style = { '--ox': `${origin?.x ?? 50}%`, '--oy': `${origin?.y ?? 70}%` } as React.CSSProperties
  if (!mounted) return null
  return createPortal(
    <div className={`mj-portal ${on ? 'is-on' : ''} ${phase === 'arrive' ? 'is-arrive' : ''}`} style={style} aria-hidden="true">
      <div className="mj-portal-sky">
        <div className="mj-portal-core">
          {/* The mark is maroon, so it sits on ivory — never recoloured. */}
          <span className="mj-portal-mark">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/logo-mark-128.webp" alt="" width={44} height={40} />
          </span>
        </div>
        <div className="mj-portal-words">
          <p className="font-deva text-[22px] text-[#FFE7A6]" lang="mai">स्वागत अछि</p>
          <p className="mt-1 text-[13px] tracking-[0.18em] uppercase text-[#F3E3C4]/80">{phase === 'arrive' ? 'Welcome home' : 'Opening your Mithila Jodi'}</p>
        </div>
      </div>
      <div className="mj-portal-flare" />
    </div>,
    document.body,
  )
}
