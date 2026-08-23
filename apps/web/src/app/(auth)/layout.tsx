import type { Metadata } from 'next'

// Login / register / forgot-password are functional pages, not content.
// Keep them out of the search index.
export const metadata: Metadata = {
  robots: { index: false, follow: true },
}

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-paper flex flex-col items-center justify-center px-4 py-12">
      {children}
    </div>
  )
}
