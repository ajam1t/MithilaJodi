import Link from 'next/link'

export default function LegalLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <nav className="sticky top-0 z-40 bg-cream border-b border-paper-3 shadow-mj-xs">
        <div className="wrap flex items-center h-14">
          <Link href="/" className="font-serif text-maroon text-xl leading-none">
            Mithila Jodi
          </Link>
        </div>
      </nav>
      <main id="main-content" className="wrap py-10 max-w-3xl">
        {children}
      </main>

      {/* The legal pages render outside the site footer, so without this there
          is no way back to the rest of the site except the browser's back
          button — including for someone who arrived here from a search result. */}
      <footer className="border-t border-paper-3 bg-paper" role="contentinfo">
        <div className="wrap max-w-3xl py-6 flex flex-wrap items-center gap-x-5 gap-y-2 text-[13px] text-ink-soft">
          <Link href="/" className="text-maroon underline underline-offset-2">Home</Link>
          <Link href="/legal/terms" className="text-maroon underline underline-offset-2">Terms of Service</Link>
          <Link href="/legal/privacy" className="text-maroon underline underline-offset-2">Privacy Policy</Link>
          <Link href="/safety" className="text-maroon underline underline-offset-2">Safety</Link>
          <Link href="/contact" className="text-maroon underline underline-offset-2">Contact</Link>
        </div>
      </footer>
    </>
  )
}
