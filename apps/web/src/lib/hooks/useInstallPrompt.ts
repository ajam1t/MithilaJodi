'use client'

import { useCallback, useEffect, useState } from 'react'

/**
 * Everything needed to offer "add this to your home screen", in one place.
 *
 * The two platforms work in opposite ways and the difference is the whole
 * reason this hook exists:
 *
 *   - Chrome on Android fires `beforeinstallprompt` when it has decided the
 *     site is installable. Calling preventDefault() on it stops Chrome's own
 *     mini-infobar and hands us the event to fire later from our own button.
 *     If that event never arrives, the site is NOT installable in that browser
 *     and no button should be shown — an "Install" button that cannot install
 *     is worse than none.
 *   - Safari on iOS has no programmatic install of any kind. The only route is
 *     the user tapping Share → Add to Home Screen themselves, so all we can
 *     honestly offer is instructions.
 *
 * Anything already running installed is excluded, on both platforms.
 */

/** Not in TypeScript's DOM lib — it is a Chromium extension to the spec. */
interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed'; platform: string }>
}

const DISMISS_KEY = 'mj:install-dismissed-at'
const INSTALLED_KEY = 'mj:install-completed'

/**
 * How long a dismissal is respected. Long enough that it does not nag, short
 * enough that someone who dismissed it months ago while browsing casually can
 * be offered it again once they are actually using the site.
 */
const DISMISS_DAYS = 60

/** Matches the `lg` breakpoint the mobile bottom nav already uses. */
const MOBILE_QUERY = '(max-width: 1023px)'

export type InstallMode = 'none' | 'android' | 'ios'

function isStandalone(): boolean {
  if (typeof window === 'undefined') return false
  return (
    window.matchMedia('(display-mode: standalone)').matches ||
    // Safari's own non-standard flag, which is the only one iOS sets.
    (window.navigator as Navigator & { standalone?: boolean }).standalone === true
  )
}

function isIos(): boolean {
  const ua = window.navigator.userAgent
  if (/iphone|ipad|ipod/i.test(ua)) return true
  // iPadOS 13+ reports itself as a Mac; touch points are what give it away.
  return /macintosh/i.test(ua) && window.navigator.maxTouchPoints > 1
}

/**
 * Instagram, Facebook and similar in-app browsers cannot add anything to the
 * home screen — their share sheet has no such option — so showing instructions
 * there sends people hunting for a button that does not exist.
 */
function isInAppBrowser(): boolean {
  return /FBAN|FBAV|Instagram|Line\/|Twitter|MicroMessenger|Snapchat/i.test(window.navigator.userAgent)
}

function dismissedRecently(): boolean {
  try {
    if (window.localStorage.getItem(INSTALLED_KEY)) return true
    const at = window.localStorage.getItem(DISMISS_KEY)
    if (!at) return false
    const ms = Date.now() - new Date(at).getTime()
    // A corrupt or future-dated value should suppress rather than nag forever.
    if (Number.isNaN(ms)) return true
    return ms < DISMISS_DAYS * 24 * 60 * 60 * 1000
  } catch {
    // Private mode can throw on access. Treat storage we cannot read as
    // "dismissed": showing a banner we are unable to remember dismissing would
    // mean showing it on every single page load.
    return true
  }
}

export function useInstallPrompt() {
  const [mode, setMode] = useState<InstallMode>('none')
  const [deferred, setDeferred] = useState<BeforeInstallPromptEvent | null>(null)

  useEffect(() => {
    if (isStandalone() || isInAppBrowser() || dismissedRecently()) return
    if (!window.matchMedia(MOBILE_QUERY).matches) return

    if (isIos()) {
      setMode('ios')
      return
    }

    // Android and other Chromium browsers. Nothing is shown unless and until
    // the browser tells us the site actually qualifies.
    const onBeforeInstall = (e: Event) => {
      // Always suppress the browser's own mini-infobar, even when we are not
      // going to offer anything — otherwise dismissing our banner would just
      // hand the reader Chrome's version of the same prompt.
      e.preventDefault()
      // Re-checked rather than relying on the check at mount. The listener
      // outlives a dismissal or an install within the same page, and a browser
      // that fires the event again afterwards would otherwise bring the banner
      // straight back on a page the reader has already said no to.
      if (dismissedRecently()) return
      setDeferred(e as BeforeInstallPromptEvent)
      setMode('android')
    }
    const onInstalled = () => {
      setMode('none')
      setDeferred(null)
      try { window.localStorage.setItem(INSTALLED_KEY, '1') } catch { /* private mode */ }
    }

    window.addEventListener('beforeinstallprompt', onBeforeInstall)
    window.addEventListener('appinstalled', onInstalled)
    return () => {
      window.removeEventListener('beforeinstallprompt', onBeforeInstall)
      window.removeEventListener('appinstalled', onInstalled)
    }
  }, [])

  const dismiss = useCallback(() => {
    setMode('none')
    try { window.localStorage.setItem(DISMISS_KEY, new Date().toISOString()) } catch { /* private mode */ }
  }, [])

  /** Fire Chrome's real install dialog. Resolves to whether it was accepted. */
  const install = useCallback(async (): Promise<boolean> => {
    if (!deferred) return false
    await deferred.prompt()
    const { outcome } = await deferred.userChoice
    // The event is single-use: Chrome will fire a fresh one if it still
    // qualifies, so holding on to a spent one would give a dead button.
    setDeferred(null)
    if (outcome === 'accepted') {
      setMode('none')
      try { window.localStorage.setItem(INSTALLED_KEY, '1') } catch { /* private mode */ }
      return true
    }
    // Declining Chrome's dialog is a "not now", not a "never" — but it should
    // not be asked again on the next page either.
    dismiss()
    return false
  }, [deferred, dismiss])

  return { mode, install, dismiss }
}
