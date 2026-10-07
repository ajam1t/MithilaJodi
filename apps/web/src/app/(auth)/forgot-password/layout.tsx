import type { Metadata } from 'next'

// The page is a client component, so its title lives here. Still noindex — the
// (auth) layout sets robots for the whole group.
export const metadata: Metadata = {
  title: 'Reset Your Password',
  description: 'Reset your Mithila Jodi password with a one-time code sent to your registered mobile number.',
}

export default function Layout({ children }: { children: React.ReactNode }) {
  return children
}
