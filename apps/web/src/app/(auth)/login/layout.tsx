import type { Metadata } from 'next'

// The page is a client component, so its title lives here. Still noindex — the
// (auth) layout sets robots for the whole group.
export const metadata: Metadata = {
  title: 'Log In',
  description: 'Log in to Mithila Jodi with your mobile number to see your matches, interests and messages.',
}

export default function Layout({ children }: { children: React.ReactNode }) {
  return children
}
