'use client'

import { useEffect } from 'react'
import Link from 'next/link'

/*
 * Error screen for the member area. It renders inside the (main) layout, so
 * the nav stays and the member can go somewhere else; Retry re-renders the
 * page that failed. Details go to the console only — never onto the screen.
 */
export default function MemberError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error('[member area error]', error)
  }, [error])

  return (
    <main id="main-content" className="min-h-[60vh] bg-paper flex items-center justify-center px-6 py-12">
      <div className="text-center max-w-md">
        <div className="ornament-line w-16 mx-auto mb-6" />
        <p className="eyebrow mb-2">Something went wrong</p>
        <h1 className="section-heading mb-3">This page didn&apos;t load</h1>
        <p className="text-ink-soft text-sm leading-relaxed mb-8">
          Sorry — it&apos;s usually a passing hiccup with the connection. Please try again, or
          carry on from one of the pages below.
        </p>
        <button type="button" onClick={reset} className="btn-primary justify-center">
          Retry
        </button>
        <nav aria-label="Other pages" className="mt-6 flex items-center justify-center gap-5 text-sm">
          <Link href="/home" className="text-maroon underline underline-offset-4 hover:text-maroon-deep">Feed</Link>
          <Link href="/inbox" className="text-maroon underline underline-offset-4 hover:text-maroon-deep">Inbox</Link>
          <Link href="/search" className="text-maroon underline underline-offset-4 hover:text-maroon-deep">Search</Link>
        </nav>
      </div>
    </main>
  )
}
