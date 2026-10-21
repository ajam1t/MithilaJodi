'use client'

import Link from 'next/link'
import { useAuthState } from '@/lib/hooks/useAuthState'

/**
 * The hero's "Find Your Match" button. The homepage is ISR-cached, so the
 * server render cannot know who is looking: it renders the visitor link
 * (/register), and once the shared auth state (the same one MithilaHeader
 * uses — no extra request) says a member is signed in, the same button points
 * to /search instead. Only the href changes, so nothing shifts.
 */
export function HeroMatchLink({ className, children }: { className?: string; children: React.ReactNode }) {
  const { auth, authLoaded } = useAuthState()
  const href = authLoaded && auth.loggedIn ? '/search' : '/register'
  return <Link href={href} className={className}>{children}</Link>
}
