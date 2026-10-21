'use client'

import { useCallback, useEffect, useRef, useState, type ReactNode } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { usePathname, useRouter } from 'next/navigation'
import type { AdminPerm } from '@/lib/adminAuth'
import { ADMIN_NAV, type NavGroup } from './nav'
import { CommandPalette } from './CommandPalette'
import { GROUP_ICON, Icon } from './icons'

/**
 * The console frame — a command deck.
 *  - xl: a sticky ivory sidebar (groups with their pages, the signed-in role
 *    at the foot) beside the workspace.
 *  - every size: a glass top bar — where you are, ⌘K command palette, a live
 *    IST readout, the attention bell and the account menu.
 *  - below xl: a floating dock (Home · Members · Queue · Analytics · Menu)
 *    and the full menu as a bottom sheet.
 * Items a role cannot use are hidden; every page still checks on the server.
 */
function useIstClock() {
  const [t, setT] = useState('')
  useEffect(() => {
    const tick = () => setT(new Date().toLocaleTimeString('en-IN', { timeZone: 'Asia/Kolkata', hour: '2-digit', minute: '2-digit', hour12: false }))
    tick()
    const id = window.setInterval(tick, 15_000)
    return () => window.clearInterval(id)
  }, [])
  return t
}

export function AdminShell({ perms, roleLabel, identity, attention, children }: {
  perms: AdminPerm[]
  roleLabel: string
  identity: string
  attention: number
  children: ReactNode
}) {
  const pathname = usePathname()
  const router = useRouter()
  const clock = useIstClock()
  const [sheet, setSheet] = useState(false)
  const [account, setAccount] = useState(false)
  const [palette, setPalette] = useState(false)
  const accountRef = useRef<HTMLDivElement>(null)

  const groups: NavGroup[] = ADMIN_NAV
    .map(g => ({ ...g, items: g.items?.filter(i => !i.perm || perms.includes(i.perm)) }))
    .filter(g => g.href || (g.items && g.items.length > 0))

  const itemActive = (href: string) => { const p = href.split('#')[0]; return p !== '/admin' && !href.includes('#') && (pathname === p || pathname.startsWith(p + '/')) }
  const isActive = (g: NavGroup) => (g.href ? pathname === g.href : !!g.items?.some(i => itemActive(i.href)))
  const current = groups.find(isActive)
  const currentItem = current?.items?.filter(i => itemActive(i.href)).sort((a, b) => b.href.length - a.href.length)[0]

  const [expanded, setExpanded] = useState<Set<string>>(() => new Set(current ? [current.label] : []))
  useEffect(() => { if (current) setExpanded(s => (s.has(current.label) ? s : new Set(s).add(current.label))) }, [current?.label]) // eslint-disable-line react-hooks/exhaustive-deps
  const toggle = (label: string) => setExpanded(s => { const n = new Set(s); if (n.has(label)) n.delete(label); else n.add(label); return n })

  // Close menus on navigation, outside click and Escape; ⌘K / Ctrl+K / "/" open the palette.
  useEffect(() => { setSheet(false); setAccount(false); setPalette(false) }, [pathname])
  useEffect(() => {
    function onDown(e: MouseEvent) { if (accountRef.current && !accountRef.current.contains(e.target as Node)) setAccount(false) }
    function onKey(e: KeyboardEvent) {
      const typing = e.target instanceof HTMLElement && (e.target.isContentEditable || /^(INPUT|TEXTAREA|SELECT)$/.test(e.target.tagName))
      if ((e.key === 'k' || e.key === 'K') && (e.metaKey || e.ctrlKey)) { e.preventDefault(); setPalette(p => !p) }
      else if (e.key === '/' && !typing) { e.preventDefault(); setPalette(true) }
      else if (e.key === 'Escape') { setSheet(false); setAccount(false) }
    }
    document.addEventListener('mousedown', onDown)
    document.addEventListener('keydown', onKey)
    return () => { document.removeEventListener('mousedown', onDown); document.removeEventListener('keydown', onKey) }
  }, [])
  useEffect(() => { document.body.style.overflow = sheet ? 'hidden' : ''; return () => { document.body.style.overflow = '' } }, [sheet])

  const signOut = useCallback(async () => {
    await fetch('/api/admin/auth/logout', { method: 'POST' }).catch(() => {})
    router.replace('/admin/login')
    router.refresh()
  }, [router])

  const count = attention > 99 ? '99+' : String(attention)
  const initial = (roleLabel[0] ?? 'A').toUpperCase()

  return (
    <div className="acx">
      <div className="acx-grid" aria-hidden="true" />
      <a href="#admin-main" className="mj-skip-link">Skip to content</a>

      <div className="relative z-[1] flex">
        {/* ── Sidebar (xl) ── */}
        <aside className="acx-side" aria-label="Admin navigation">
          <Link href="/admin" className="acx-brand">
            {/* The official mark, never redrawn or recoloured (see scripts/brand-assets.js). */}
            <Image src="/logo-mark-128.webp" alt="" width={44} height={40} priority className="h-10 w-auto shrink-0 object-contain" />
            <span>
              <span className="acx-brand-t block">Mithila Jodi</span>
              <span className="acx-brand-s block">Command Centre</span>
            </span>
          </Link>
          <nav aria-label="Admin" className="acx-nav">
            <p className="acx-nav-k">Command</p>
            {groups.map(g => g.href ? (
              <Link key={g.label} href={g.href} className="acx-g" data-on={isActive(g) || undefined} aria-current={isActive(g) ? 'page' : undefined}>
                <Icon name={GROUP_ICON[g.label] ?? 'dashboard'} />{g.label}
              </Link>
            ) : (
              <div key={g.label}>
                <button type="button" className="acx-g" data-on={isActive(g) || undefined} aria-expanded={expanded.has(g.label)} onClick={() => toggle(g.label)}>
                  <Icon name={GROUP_ICON[g.label] ?? 'dashboard'} />{g.label}
                  <Icon name="chev" size={14} className="acx-g-chev" />
                </button>
                {expanded.has(g.label) && (
                  <div className="acx-sub">
                    {g.items!.map(i => (
                      <Link key={i.href} href={i.href} aria-current={currentItem?.href === i.href ? 'page' : undefined}>{i.label}</Link>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </nav>
          <div className="acx-me">
            <div className="flex items-center gap-2.5">
              <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-[#F1E7D3] font-serif text-[16px] text-[#6B0A0A]" aria-hidden="true">{initial}</span>
              <span className="min-w-0 leading-tight">
                <span className="block text-[13px] font-semibold text-ink">{roleLabel}</span>
                <span className="block truncate text-[11.5px] text-ink-soft">{identity}</span>
              </span>
            </div>
            <button type="button" onClick={signOut} className="mt-2.5 flex w-full items-center justify-center gap-1.5 rounded-xl border border-[#EDC4C4] py-1.5 text-[12.5px] font-medium text-[#8A1C1C] hover:bg-[#FBEFEF]">
              <Icon name="out" size={14} />Sign out
            </button>
          </div>
        </aside>

        <div className="min-w-0 flex-1">
          {/* ── Top bar ── */}
          <header className="acx-top">
            <div className="mx-auto flex h-[62px] max-w-[1480px] items-center gap-2 px-3 sm:gap-3 sm:px-6">
              <Link href="/admin" className="shrink-0 xl:hidden" aria-label="Dashboard">
                <Image src="/logo-mark-128.webp" alt="" width={40} height={37} priority className="h-9 w-auto object-contain" />
              </Link>
              <div className="min-w-0 leading-tight">
                <p className="acx-crumb truncate">{current?.label ?? 'Admin'}{currentItem && current?.label !== currentItem.label ? ` › ${currentItem.label}` : ''}</p>
                <p className="truncate font-serif text-[15px] text-[#6B0A0A] xl:hidden">Command Centre</p>
              </div>

              <button type="button" className="acx-cmd ml-auto hidden w-[min(380px,34vw)] md:flex" onClick={() => setPalette(true)}>
                <Icon name="search" size={16} className="text-[#B98A2E]" />
                <span className="flex-1 truncate text-left">Jump to, or find a member…</span>
                <span className="acx-kbd">⌘K</span>
              </button>

              <div className="ml-auto flex items-center gap-1 md:ml-0">
                <span className="acx-live hidden sm:inline-flex" title="Figures are read live from the database; times are IST">
                  <i aria-hidden="true" />LIVE{clock && <> · {clock} IST</>}
                </span>
                <button type="button" className="acx-icon-btn md:hidden" aria-label="Search" onClick={() => setPalette(true)}>
                  <Icon name="search" size={19} />
                </button>
                <Link href="/admin#attention" className="acx-icon-btn" aria-label={attention > 0 ? `${attention} items need attention` : 'Nothing needs attention'}>
                  <Icon name="bell" size={19} />
                  {attention > 0 && <span className="acx-count">{count}</span>}
                </Link>
                <div className="relative" ref={accountRef}>
                  <button type="button" onClick={() => setAccount(a => !a)} aria-expanded={account} aria-label="Account" className="acx-icon-btn">
                    <span className="grid h-8 w-8 place-items-center rounded-[10px] bg-[#F1E7D3] font-serif text-[14px] text-[#6B0A0A]" aria-hidden="true">{initial}</span>
                  </button>
                  {account && (
                    <div className="acx-pop">
                      <p className="px-3 py-2 text-[12px] text-ink-soft">Signed in as <span className="font-medium text-ink">{roleLabel}</span><br />{identity}</p>
                      {perms.includes('security') && <Link href="/admin/security">Admin access & sessions</Link>}
                      <Link href="/">View public site</Link>
                      <button type="button" onClick={signOut} className="text-[#8A1C1C]">Sign out</button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </header>

          <main id="admin-main" className="mx-auto max-w-[1480px] px-3 pb-28 pt-5 sm:px-6 sm:pt-7 xl:pb-10">{children}</main>
        </div>
      </div>

      {/* ── Dock (below xl) ── */}
      <nav className="acx-dock" aria-label="Quick">
        <Link href="/admin" data-on={pathname === '/admin' || undefined} aria-current={pathname === '/admin' ? 'page' : undefined}><Icon name="dashboard" size={20} />Home</Link>
        <Link href="/admin/members" data-on={pathname.startsWith('/admin/members') || undefined}><Icon name="members" size={20} />Members</Link>
        <Link href="/admin#attention" aria-label={`Queue, ${attention} waiting`}>
          <Icon name="bell" size={20} />Queue
          {attention > 0 && <span className="acx-count">{count}</span>}
        </Link>
        <Link href="/admin/analytics" data-on={pathname.startsWith('/admin/analytics') || undefined}><Icon name="analytics" size={20} />Stats</Link>
        <button type="button" onClick={() => setSheet(true)} aria-expanded={sheet} data-on={sheet || undefined}><Icon name="menu" size={20} />Menu</button>
      </nav>

      {sheet && (
        <>
          <div className="acx-sheet-bg" onClick={() => setSheet(false)} aria-hidden="true" />
          <div className="acx-sheet" role="dialog" aria-modal="true" aria-label="Admin navigation">
            <div className="acx-sheet-grab" aria-hidden="true" />
            <div className="mb-3 flex items-center justify-between gap-3">
              <div className="leading-tight">
                <p className="acx-crumb">Mithila Jodi · Admin</p>
                <p className="font-serif text-[20px] text-[#6B0A0A]">Every console page</p>
              </div>
              <button type="button" className="acx-icon-btn" onClick={() => setSheet(false)} aria-label="Close menu"><Icon name="close" size={18} /></button>
            </div>
            <button type="button" className="acx-cmd mb-3 flex w-full" onClick={() => { setSheet(false); setPalette(true) }}>
              <Icon name="search" size={16} className="text-[#B98A2E]" /><span className="flex-1 text-left">Jump to, or find a member…</span>
            </button>
            <div className="grid grid-cols-2 gap-2.5">
              {groups.filter(g => !g.href).map(g => (
                <div key={g.label} className="acx-sheet-g">
                  <p className="mb-1 flex items-center gap-2 text-[13px] font-semibold text-ink">
                    <span className="text-[#B98A2E]"><Icon name={GROUP_ICON[g.label] ?? 'dashboard'} size={16} /></span>{g.label}
                  </p>
                  {g.items!.map(i => <Link key={i.href} href={i.href} aria-current={currentItem?.href === i.href ? 'page' : undefined}>{i.label}</Link>)}
                </div>
              ))}
            </div>
            <div className="mt-3 flex items-center justify-between gap-3 rounded-2xl border border-[#EADFCB] bg-[#FFFDF8] px-3 py-2.5">
              <span className="min-w-0 text-[12px] leading-tight text-ink-soft"><span className="block font-semibold text-ink">{roleLabel}</span><span className="block truncate">{identity}</span></span>
              <button type="button" onClick={signOut} className="shrink-0 rounded-xl border border-[#EDC4C4] px-3 py-1.5 text-[12.5px] font-medium text-[#8A1C1C]">Sign out</button>
            </div>
          </div>
        </>
      )}

      <CommandPalette groups={groups} open={palette} onClose={() => setPalette(false)} onSignOut={signOut} />
    </div>
  )
}
