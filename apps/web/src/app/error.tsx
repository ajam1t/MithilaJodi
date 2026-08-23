'use client'

import { useEffect } from 'react'
import Link from 'next/link'

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    // Surface to server logs / monitoring without exposing details to the user.
    console.error('[app error boundary]', error)
  }, [error])

  return (
    <main className="min-h-screen bg-paper flex items-center justify-center px-6">
      <div className="text-center max-w-md">
        <div className="ornament-line w-16 mx-auto mb-6" />
        <p className="eyebrow mb-2">Something went wrong</p>
        <h1 className="section-heading mb-3">We hit an unexpected error</h1>
        <p className="text-ink-soft text-sm leading-relaxed mb-8">
          Sorry about that. Please try again — if the problem continues, head back to the
          homepage and it should sort itself out.
        </p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <button type="button" onClick={reset} className="btn-primary justify-center">
            Try Again
          </button>
          <Link href="/" className="btn-ghost justify-center">Go to Homepage</Link>
        </div>
      </div>
    </main>
  )
}
