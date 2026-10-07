'use client'

import { useEffect, useRef } from 'react'
import { usePathname } from 'next/navigation'
import { useReportWebVitals } from 'next/web-vitals'
import { track } from '@/lib/track'

/**
 * Records one page view per route change, plus Core Web Vitals for the admin
 * Performance page. Mounted once in the root layout.
 *
 * The ref guard means a re-render, a React Strict Mode double effect, or a
 * search-param change on the same path never counts the same page twice.
 */
export function SiteTracker() {
  const pathname = usePathname()
  const last = useRef<string | null>(null)

  useEffect(() => {
    if (!pathname || last.current === pathname) return
    last.current = pathname
    track('page_view', { path: pathname })
  }, [pathname])

  useReportWebVitals(metric => {
    if (!['LCP', 'INP', 'CLS', 'FCP', 'TTFB'].includes(metric.name)) return
    track('web_vital', { k: metric.name, v: Math.round(metric.name === 'CLS' ? metric.value * 1000 : metric.value) })
  })

  return null
}
