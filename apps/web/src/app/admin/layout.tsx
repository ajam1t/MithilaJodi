import type { Metadata } from 'next'

// Nothing under /admin is ever indexed or followed. Access control lives in
// (console)/layout.tsx and in every admin API — not here.
export const metadata: Metadata = {
  title: { default: 'Admin Console', template: '%s · Mithila Jodi Admin' },
  robots: { index: false, follow: false },
}

export default function AdminRootLayout({ children }: { children: React.ReactNode }) {
  return children
}
