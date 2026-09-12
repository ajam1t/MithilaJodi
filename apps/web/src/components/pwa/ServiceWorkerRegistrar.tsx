'use client'

import { useEffect } from 'react'

/**
 * Registers public/sw.js.
 *
 * Lives in the root layout rather than beside the install banner, because the
 * worker is what makes the site installable at all — a visitor who lands on a
 * blog article and later decides to install should already qualify, and Chrome
 * needs the worker registered well before it will fire `beforeinstallprompt`.
 *
 * Deferred to the load event. Registration competes for bandwidth with the page
 * itself, and nothing here is needed for first paint; fetching the worker
 * during startup would slow down the visit it is meant to improve.
 *
 * Renders nothing, and every failure is swallowed: an unsupported browser, a
 * blocked registration or a private window must cost the reader nothing more
 * than the ability to install.
 */
export function ServiceWorkerRegistrar() {
  useEffect(() => {
    if (!('serviceWorker' in navigator)) return

    const register = () => {
      navigator.serviceWorker.register('/sw.js', { scope: '/' }).catch(() => {
        // Not actionable for the reader; the site works identically without it.
      })
    }

    if (document.readyState === 'complete') {
      register()
      return
    }
    window.addEventListener('load', register)
    return () => window.removeEventListener('load', register)
  }, [])

  return null
}

export default ServiceWorkerRegistrar
