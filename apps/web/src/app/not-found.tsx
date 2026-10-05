import Link from 'next/link'
import Image from 'next/image'

export default function NotFound() {
  return (
    <main id="main-content" className="min-h-screen bg-paper flex items-center justify-center px-6">
      <div className="text-center max-w-md">
        <Link href="/" className="mb-5 inline-block" aria-label="Mithila Jodi — home">
          <Image src="/logo.png" alt="Mithila Jodi" width={160} height={139} className="mx-auto h-28 w-auto object-contain" />
        </Link>
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
