import Link from 'next/link'

export default function NotFound() {
  return (
    <main id="main-content" className="min-h-screen bg-paper flex items-center justify-center px-6">
      <div className="text-center max-w-md">
        <div className="ornament-line w-16 mx-auto mb-6" />
        <p className="eyebrow mb-2">Page not found</p>
        <h1 className="section-heading mb-3">This page could not be found</h1>
        <p className="text-ink-soft text-sm leading-relaxed mb-8">
          The page you are looking for may have been moved, removed, or never existed.
          Let&apos;s get you back on track.
        </p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Link href="/" className="btn-primary justify-center">Go to Homepage</Link>
          <Link href="/explore" className="btn-ghost justify-center">Browse Profiles</Link>
        </div>
      </div>
    </main>
  )
}
