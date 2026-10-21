'use client'

import { useEffect, type ReactNode } from 'react'

/*
 * The page fade (globals.css .mj-page-enter) — for in-app navigations only.
 *
 * On the first load the page must paint at once: the fade starts at opacity 0,
 * and browsers do not count invisible content as painted, so it held back
 * First and Largest Contentful Paint on every landing. The server render (and
 * the hydration that matches it) carries no class; once this tab has booted,
 * every page mounted by a navigation fades in as before.
 */
let booted = false

export function PageEnter({ children }: { children: ReactNode }) {
  const animate = booted
  useEffect(() => { booted = true }, [])
  return <div className={animate ? 'mj-page-enter' : undefined}>{children}</div>
}
