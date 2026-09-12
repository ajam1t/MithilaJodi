'use client'

import { useEffect, useState } from 'react'
import Image from 'next/image'
import { useInstallPrompt } from '@/lib/hooks/useInstallPrompt'

/**
 * "Add Mithila Jodi to your home screen."
 *
 * Sits in normal flow at the very top of the page, above the announcement strip
 * and the sticky header. That position is chosen rather than a fixed overlay
 * because it scrolls away with the rest of the page: it costs no permanent
 * viewport, cannot cover the sticky header, and cannot collide with the fixed
 * bottom navigation, the WhatsApp band or the music player.
 *
 * Mobile only, and only when the browser has said the site is genuinely
 * installable — see useInstallPrompt. Nothing renders on the server or on the
 * first client render, so the markup is identical on both and hydration is
 * unaffected.
 */

/** iOS share glyph — a box with an arrow leaving the top. */
function ShareGlyph({ className = '' }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className={className} fill="none"
         stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 15V3" />
      <path d="m8 7 4-4 4 4" />
      <path d="M20 13v6a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2v-6" />
    </svg>
  )
}

function PlusSquareGlyph({ className = '' }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className={className} fill="none"
         stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3.5" y="3.5" width="17" height="17" rx="4" />
      <path d="M12 8.5v7M8.5 12h7" />
    </svg>
  )
}

function IosInstructions({ onClose }: { onClose: () => void }) {
  // Escape to close, and the background must not scroll under the dialog.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    const previous = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    window.addEventListener('keydown', onKey)
    return () => {
      document.body.style.overflow = previous
      window.removeEventListener('keydown', onKey)
    }
  }, [onClose])

  const steps = [
    {
      glyph: <ShareGlyph className="w-5 h-5" />,
      title: 'Tap the Share button',
      body: 'At the bottom of Safari — the square with an arrow pointing up.',
    },
    {
      glyph: <PlusSquareGlyph className="w-5 h-5" />,
      title: 'Choose “Add to Home Screen”',
      body: 'Scroll down the share sheet if you do not see it straight away.',
    },
    {
      glyph: <span className="font-serif text-[15px] leading-none">✓</span>,
      title: 'Tap “Add”',
      body: 'Mithila Jodi will appear on your home screen like any other app.',
    },
  ]

  return (
    <div
      className="fixed inset-0 z-[70] flex items-end sm:items-center justify-center bg-ink/50 px-3 pb-3 sm:p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="ios-install-title"
      onClick={onClose}
    >
      <div
        className="w-full max-w-sm rounded-mj bg-cream border border-gold/40 shadow-mj-lg p-5"
        // The backdrop closes on click; taps inside must not bubble up to it.
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start gap-3">
          <Image src="/favicon-192.png" alt="" width={40} height={40} className="rounded-mj-sm shrink-0" />
          <div className="min-w-0 flex-1">
            <h2 id="ios-install-title" className="font-serif text-[17px] text-maroon leading-tight">
              Add to your Home Screen
            </h2>
            <p className="text-[12.5px] text-ink-soft leading-snug mt-0.5">
              Three taps in Safari, and no app store.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="shrink-0 -mt-1 -mr-1 p-1.5 text-ink-soft hover:text-ink text-xl leading-none"
          >
            ×
          </button>
        </div>

        <ol className="mt-4 space-y-3">
          {steps.map((s, i) => (
            <li key={s.title} className="flex items-start gap-3">
              <span className="relative shrink-0 grid place-items-center h-9 w-9 rounded-full bg-paper border border-gold/40 text-maroon">
                {s.glyph}
                <span className="absolute -top-1.5 -left-1.5 grid place-items-center h-5 w-5 rounded-full bg-maroon text-gold-lt text-[11px] font-semibold">
                  {i + 1}
                </span>
              </span>
              <span className="min-w-0 pt-0.5">
                <span className="block text-[14px] text-ink font-medium leading-snug">{s.title}</span>
                <span className="block text-[12.5px] text-ink-soft leading-snug mt-0.5">{s.body}</span>
              </span>
            </li>
          ))}
        </ol>

        <button type="button" onClick={onClose} className="btn-primary w-full justify-center mt-5 text-[14px] py-2.5">
          Got it
        </button>
      </div>
    </div>
  )
}

export function InstallBanner() {
  const { mode, install, dismiss } = useInstallPrompt()
  const [showHow, setShowHow] = useState(false)

  if (mode === 'none') return null

  return (
    <>
      <div
        className="lg:hidden bg-maroon text-cream"
        role="region"
        aria-label="Install Mithila Jodi"
      >
        <div className="wrap flex items-center gap-3 py-2">
          <Image
            src="/favicon-192.png"
            alt=""
            width={34}
            height={34}
            className="rounded-mj-sm shrink-0 bg-cream"
          />

          <div className="min-w-0 flex-1">
            <p className="text-[13px] font-semibold leading-tight truncate">Add Mithila Jodi</p>
            {/* Kept short on purpose. Between the icon, the action pill and the
                dismiss control there are only ~200px left at 375px, and longer
                copy here just renders as an ellipsis. */}
            <p className="text-[11.5px] text-paper-2/80 leading-tight truncate">
              {mode === 'ios' ? 'Open it like an app' : 'No app store needed'}
            </p>
          </div>

          <button
            type="button"
            onClick={() => (mode === 'ios' ? setShowHow(true) : void install())}
            className="shrink-0 rounded-pill bg-gold-lt px-3.5 py-1.5 text-[12.5px] font-semibold text-maroon-deep hover:bg-gold transition-colors"
          >
            {mode === 'ios' ? 'How' : 'Install'}
          </button>

          <button
            type="button"
            onClick={dismiss}
            aria-label="Dismiss install banner"
            className="shrink-0 -mr-1 p-1.5 text-paper-2/70 hover:text-cream text-lg leading-none"
          >
            ×
          </button>
        </div>
      </div>

      {showHow && <IosInstructions onClose={() => setShowHow(false)} />}
    </>
  )
}

export default InstallBanner
