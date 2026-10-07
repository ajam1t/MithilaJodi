import type { Metadata } from 'next'

// The page is a client component, so its title lives here. Still noindex — the
// (auth) layout sets robots for the whole group.
export const metadata: Metadata = {
  title: 'Create Your Free Profile',
  description: 'Join Mithila Jodi free — create a matrimonial profile with gotra, mool and family details, verified by mobile OTP.',
}

export default function Layout({ children }: { children: React.ReactNode }) {
  return children
}
