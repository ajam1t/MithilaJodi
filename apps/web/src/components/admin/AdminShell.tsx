'use client'

import { useEffect, useRef, useState, type ReactNode } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { usePathname, useRouter } from 'next/navigation'
import type { AdminPerm } from '@/lib/adminAuth'
import { ADMIN_NAV, type NavGroup } from './nav'

/**
 * The console frame: one sticky 60px row on wide screens (brand · nav with
 * dropdowns · attention bell · account menu), a hamburger drawer below xl.
 * The workspace below gets the full width.
 */
export function AdminShell({ perms, roleLabel, identity, attention, children }: {
  perms: AdminPerm[]
  roleLabel: string
  identity: string
  attention: number
  children: ReactNode
}) {
  const pathname = usePathname()
  const router = useRouter()
  const [open, setOpen] = useState<string | null>(null)
  const [drawer, setDrawer] = useState(false)
  const [account, setAccount] = useState(false)
  const navRef = useRef<HTMLDivElement>(null)

  const groups: NavGroup[] = ADMIN_NAV
    .map(g => ({ ...g, items: g.items?.filter(i => !i.perm || perms.includes(i.perm)) }))
    .filter(g => g.href || (g.items && g.items.length > 0))

  // Close menus on navigation, outside click and Escape.
  useEffect(() => { setOpen(null); setDrawer(false); setAccount(false) }, [pathname])
  useEffect(() => {
    function onDown(e: MouseEvent) { if (navRef.current && !navRef.current.contains(e.target as Node)) { setOpen(null); setAccount(false) } }
    function onKey(e: KeyboardEvent) { if (e.key === 'Escape') { setOpen(null); setDrawer(false); setAccount(false) } }
    document.addEventListener('mousedown', onDown)
    document.addEventListener('keydown', onKey)
    return () => { document.removeEventListener('mousedown', onDown); document.removeEventListener('keydown', onKey) }
  }, [])
  useEffect(() => { document.body.style.overflow = drawer ? 'hidden' : ''; return () => { document.body.style.overflow = '' } }, [drawer])

  const isActive = (g: NavGroup) =>
    g.href ? pathname === g.href : !!g.items?.some(i => { const p = i.href.split('#')[0]; return p !== '/admin' && (pathname === p || pathname.startsWith(p + '/')) })

  async function signOut() {
    await fetch('/api/admin/auth/logout', { method: 'POST' }).catch(() => {})
    router.replace('/admin/login')
    router.refresh()
  }

  const bell = (
    <Link
      href="/admin#attention"
      className="relative grid h-9 w-9 place-items-center rounded-lg text-ink-soft hover:bg-[#F3EEE6] hover:text-ink"
      aria-label={attention > 0 ? `${attention} items need attention` : 'Nothing needs attention'}
    >
      <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <path d="M6 8a6 6 0 1 1 12 0c0 7 3 9 3 9H3s3-2 3-9" /><path d="M10.3 21a1.94 1.94 0 0 0 3.4 0" />
      </svg>
      {attention > 0 && (
        <span className="absolute -right-0.5 -top-0.5 min-w-[18px] rounded-full bg-maroon px-1 text-center text-[10.5px] font-semibold leading-[18px] text-white">
          {attention > 99 ? '99+' : attention}
        </span>
      )}
    </Link>
  )

  return (
    <div className="min-h-screen bg-[#FAF7F2] text-ink">
      <a href="#admin-main" className="mj-skip-link">Skip to content</a>
      <header ref={navRef} className="sticky top-0 z-40 border-b border-[#E8E1D5] bg-white/95 backdrop-blur">
        <div className="mx-auto flex h-[60px] max-w-[1600px] items-center gap-3 px-3 sm:px-5">
          <button
            type="button"
            className="grid h-9 w-9 place-items-center rounded-lg text-ink hover:bg-[#F3EEE6] xl:hidden"
            aria-label="Open admin navigation"
            aria-expanded={drawer}
            onClick={() => setDrawer(true)}
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true"><path d="M4 7h16M4 12h16M4 17h16" /></svg>
          </button>

          <Link href="/admin" className="flex shrink-0 items-center gap-2">
            {/* The official mark, never redrawn or recoloured (see scripts/brand-assets.js). */}
            <Image src="/logo-mark.png" alt="" width={40} height={37} priority className="h-9 w-auto shrink-0 object-contain" />
            <span className="leading-tight">
              <span className="block text-[14.5px] font-semibold text-ink">Mithila Jodi</span>
              <span className="block text-[11px] text-ink-soft">Admin Console</span>
            </span>
          </Link>

          <nav aria-label="Admin" className="ml-4 hidden flex-1 items-center gap-0.5 xl:flex">
            {groups.map(g => g.href ? (
              <Link
                key={g.label}
                href={g.href}
                className={`rounded-lg px-3 py-2 text-[13.5px] font-medium ${isActive(g) ? 'bg-[#F3EEE6] text-ink' : 'text-ink-soft hover:bg-[#F7F3EC] hover:text-ink'}`}
                aria-current={isActive(g) ? 'page' : undefined}
              >
                {g.label}
              </Link>
            ) : (
              <div key={g.label} className="relative">
                <button
                  type="button"
                  className={`flex items-center gap-1 rounded-lg px-3 py-2 text-[13.5px] font-medium ${isActive(g) || open === g.label ? 'bg-[#F3EEE6] text-ink' : 'text-ink-soft hover:bg-[#F7F3EC] hover:text-ink'}`}
                  aria-expanded={open === g.label}
                  onClick={() => setOpen(o => (o === g.label ? null : g.label))}
                >
                  {g.label}
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" aria-hidden="true" className={`transition-transform ${open === g.label ? 'rotate-180' : ''}`}><path d="m6 9 6 6 6-6" /></svg>
                </button>
                {open === g.label && (
                  <div className="absolute left-0 top-full z-50 mt-1.5 w-64 rounded-xl border border-[#E8E1D5] bg-white p-1.5 shadow-[0_12px_32px_-12px_rgba(43,33,28,0.25)]">
                    {g.items!.map(i => (
                      <Link key={i.href} href={i.href} className="block rounded-lg px-3 py-2 hover:bg-[#F7F3EC]">
                        <span className="block text-[13.5px] font-medium text-ink">{i.label}</span>
                        {i.hint && <span className="block text-[11.5px] text-ink-soft">{i.hint}</span>}
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </nav>

          <div className="ml-auto flex items-center gap-1">
            {bell}
            <div className="relative">
              <button
                type="button"
                onClick={() => setAccount(a => !a)}
                aria-expanded={account}
                className="flex items-center gap-2 rounded-lg px-2 py-1.5 hover:bg-[#F3EEE6]"
              >
                <span className="grid h-7 w-7 place-items-center rounded-full bg-[#F1E7D3] text-[12px] font-semibold text-[#7A5410]" aria-hidden="true">A</span>
                <span className="hidden text-left leading-tight sm:block">
                  <span className="block text-[12.5px] font-medium text-ink">{roleLabel}</span>
                  <span className="block text-[11px] text-ink-soft">{identity}</span>
                </span>
              </button>
              {account && (
                <div className="absolute right-0 top-full z-50 mt-1.5 w-56 rounded-xl border border-[#E8E1D5] bg-white p-1.5 shadow-[0_12px_32px_-12px_rgba(43,33,28,0.25)]">
                  <p className="px-3 py-2 text-[12px] text-ink-soft">Signed in as <span className="font-medium text-ink">{roleLabel}</span> · {identity}</p>
                  {perms.includes('security') && <Link href="/admin/security" className="block rounded-lg px-3 py-2 text-[13.5px] hover:bg-[#F7F3EC]">Admin access & sessions</Link>}
                  <Link href="/" className="block rounded-lg px-3 py-2 text-[13.5px] hover:bg-[#F7F3EC]">View public site</Link>
                  <button type="button" onClick={signOut} className="block w-full rounded-lg px-3 py-2 text-left text-[13.5px] text-[#8A1C1C] hover:bg-[#FBEFEF]">Sign out</button>
                </div>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Mobile / tablet drawer */}
      {drawer && (
        <div className="fixed inset-0 z-50 xl:hidden" role="dialog" aria-modal="true" aria-label="Admin navigation">
          <button type="button" className="absolute inset-0 bg-ink/40" aria-label="Close navigation" onClick={() => setDrawer(false)} />
          <div className="absolute inset-y-0 left-0 flex w-[min(320px,86vw)] flex-col bg-white shadow-xl">
            <div className="flex h-[60px] items-center justify-between border-b border-[#E8E1D5] px-4">
              <span className="text-[14.5px] font-semibold">Mithila Jodi Admin</span>
              <button type="button" onClick={() => setDrawer(false)} className="grid h-9 w-9 place-items-center rounded-lg hover:bg-[#F3EEE6]" aria-label="Close navigation">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true"><path d="M6 6l12 12M18 6 6 18" /></svg>
              </button>
            </div>
            <nav aria-label="Admin" className="flex-1 overflow-y-auto p-2">
              {groups.map(g => g.href ? (
                <Link key={g.label} href={g.href} className={`block rounded-lg px-3 py-2.5 text-[14.5px] font-medium ${isActive(g) ? 'bg-[#F3EEE6]' : 'hover:bg-[#F7F3EC]'}`}>{g.label}</Link>
              ) : (
                <details key={g.label} className="group" open={isActive(g)}>
                  <summary className="flex cursor-pointer list-none items-center justify-between rounded-lg px-3 py-2.5 text-[14.5px] font-medium hover:bg-[#F7F3EC] [&::-webkit-details-marker]:hidden">
                    {g.label}
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" aria-hidden="true" className="transition-transform group-open:rotate-180"><path d="m6 9 6 6 6-6" /></svg>
                  </summary>
                  <div className="mb-1 ml-3 border-l border-[#EFE9DF] pl-2">
                    {g.items!.map(i => (
                      <Link key={i.href} href={i.href} className={`block rounded-lg px-3 py-2 text-[13.5px] ${pathname === i.href ? 'font-medium text-ink' : 'text-ink-soft hover:text-ink'}`}>{i.label}</Link>
                    ))}
                  </div>
                </details>
              ))}
            </nav>
            <div className="border-t border-[#E8E1D5] p-3 text-[12px] text-ink-soft">
              {roleLabel} · {identity}
              <button type="button" onClick={signOut} className="mt-2 block w-full rounded-lg border border-[#EDC4C4] px-3 py-2 text-[13.5px] font-medium text-[#8A1C1C]">Sign out</button>
            </div>
          </div>
        </div>
      )}

      <main id="admin-main" className="mx-auto max-w-[1600px] px-3 py-5 sm:px-5 sm:py-7">{children}</main>
    </div>
  )
}
