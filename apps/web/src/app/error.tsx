'use client'

import { useEffect } from 'react'
import Link from 'next/link'
import Image from 'next/image'

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
    <main id="main-content" className="min-h-screen bg-paper flex items-center justify-center px-6">
      <div className="text-center max-w-md">
        <Link href="/" className="mb-5 inline-block" aria-label="Mithila Jodi — home">
          <Image src="/logo.png" alt="Mithila Jodi" width={160} height={139} className="mx-auto h-28 w-auto object-contain" />
        </Link>
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
