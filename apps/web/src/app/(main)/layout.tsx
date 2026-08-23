import type { Metadata } from 'next'
import Link from 'next/link'
import { AuthBottomNav } from '@/components/AuthBottomNav'

// Everything under (main) is authenticated, private member area — never index it.
// Individual pages may still set their own title; this robots default applies
// unless a child page overrides it.
export const metadata: Metadata = {
  robots: { index: false, follow: false },
}

export default function MainLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      {/* Top nav — hidden on mobile, visible from lg breakpoint */}
      <nav className="sticky top-0 z-40 bg-cream border-b border-paper-3 shadow-mj-xs hidden lg:block">
        <div className="wrap flex items-center justify-between h-14">
          <Link href="/" className="font-serif text-maroon text-xl leading-none">
            Mithila Jodi
          </Link>
          <div className="flex items-center gap-1">
            <Link
              href="/search"
              className="px-3 py-1.5 text-sm font-medium text-ink hover:text-maroon hover:bg-paper rounded-mj-sm transition-colors"
            >
              Search
            </Link>
            <Link
              href="/messages"
              className="px-3 py-1.5 text-sm font-medium text-ink hover:text-maroon hover:bg-paper rounded-mj-sm transition-colors"
            >
              Messages
            </Link>
            <Link
              href="/interests"
              className="px-3 py-1.5 text-sm font-medium text-ink hover:text-maroon hover:bg-paper rounded-mj-sm transition-colors"
            >
              Matches
            </Link>
            <Link
              href="/shortlists"
              className="px-3 py-1.5 text-sm font-medium text-ink hover:text-maroon hover:bg-paper rounded-mj-sm transition-colors"
            >
              Shortlist
            </Link>
            <Link
              href="/biodata"
              className="px-3 py-1.5 text-sm font-medium text-ink hover:text-maroon hover:bg-paper rounded-mj-sm transition-colors"
            >
              Biodata
            </Link>
            <Link
              href="/settings"
              className="px-3 py-1.5 text-sm font-medium text-ink hover:text-maroon hover:bg-paper rounded-mj-sm transition-colors"
            >
              Settings
            </Link>
            <Link
              href="/profile"
              className="px-3 py-1.5 text-sm font-medium text-ink hover:text-maroon hover:bg-paper rounded-mj-sm transition-colors"
            >
              My Profile
            </Link>
          </div>
        </div>
      </nav>

      {/* Mobile top bar — only on mobile */}
      <div className="sticky top-0 z-40 bg-cream border-b border-paper-3 shadow-mj-xs lg:hidden">
        <div className="flex items-center justify-between h-12 px-4">
          <Link href="/" className="font-serif text-maroon text-lg leading-none">
            Mithila Jodi
          </Link>
          <Link href="/settings" className="p-2 text-ink-soft hover:text-maroon transition-colors" aria-label="Settings">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="3" />
              <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
            </svg>
          </Link>
        </div>
      </div>

      {/* Page content — add bottom padding on mobile for bottom nav */}
      <div className="pb-16 lg:pb-0">
        {children}
      </div>

      {/* Bottom nav — mobile only, handled by the component itself */}
      <AuthBottomNav />
    </>
  )
}
