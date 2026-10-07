'use client'

import { useCallback, useRef, useState } from 'react'
import { usePathname } from 'next/navigation'
import { MenuDrawer } from '@/components/home/MenuDrawer'
import { resetAuthState } from '@/lib/hooks/useAuthState'

/**
 * The hamburger for the member-area header. It opens the very same MenuDrawer
 * the public header uses (same look, same locked sections), signed-in: the
 * account slot shows My Profile and Log out. The bottom nav stays the primary
 * way around; this is the wider site — tools, culture, support.
 */
export function MemberMenuButton() {
  const [open, setOpen] = useState(false)
  const button = useRef<HTMLButtonElement>(null)
  const pathname = usePathname()
  const close = useCallback(() => setOpen(false), [])

  const isActive = (href: string) => (href === '/' ? pathname === '/' : pathname === href || pathname.startsWith(href + '/'))

  async function logout() {
    await fetch('/api/auth/logout', { method: 'POST', credentials: 'include' })
    resetAuthState()
    window.location.href = '/'
  }

  return (
    <>
      <button
        ref={button}
        type="button"
        onClick={() => setOpen(true)}
        className="grid h-10 w-10 place-items-center rounded-full text-maroon transition-colors hover:bg-paper lg:hidden"
        aria-expanded={open}
        aria-controls="site-menu"
        aria-haspopup="dialog"
        aria-label="Open menu"
      >
        <svg width="22" height="22" viewBox="0 0 22 22" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
          <line x1="3" y1="7" x2="19" y2="7" /><line x1="3" y1="12" x2="19" y2="12" /><line x1="3" y1="17" x2="19" y2="17" />
        </svg>
      </button>
      <MenuDrawer open={open} onClose={close} loggedIn authLoaded isActive={isActive} onLogout={logout} returnFocusTo={button} />
    </>
  )
}
