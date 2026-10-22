'use client'

import Link from 'next/link'
import Image from 'next/image'
import { useEffect, useRef, useState, type ReactNode } from 'react'
import { createPortal } from 'react-dom'
import { OFFICIAL_LINKS } from '@/lib/constants'
import { BrandIcon } from '@/components/social/BrandIcons'

/*
 * The hamburger menu — complete site navigation. The five sections, their
 * order and every label are the owner's locked structure (2026-10-07); the
 * bottom nav keeps the frequent destinations. Change wording only on request.
 * Signed-in members also get a sixth, "My Tools" (Shortlist, Gotra Checker,
 * Help), second on the dial.
 */

/* ── Line icons: one 24px grid, one stroke weight, so the column reads evenly ── */
const P = { fill: 'none', stroke: 'currentColor', strokeWidth: 1.7, strokeLinecap: 'round', strokeLinejoin: 'round' } as const
const ICONS: Record<string, ReactNode> = {
  home: <><path d="M3.5 10.5 12 3.5l8.5 7" /><path d="M5.5 9v11h13V9" /><path d="M10 20v-5.5h4V20" /></>,
  search: <><circle cx="9" cy="8" r="3.2" /><path d="M3.5 19c.5-3.2 2.7-5 5.5-5 1.2 0 2.3.3 3.1.9" /><circle cx="16.5" cy="15.5" r="2.8" /><path d="m18.6 17.6 2.2 2.2" /></>,
  profile: <><rect x="5" y="2.5" width="14" height="19" rx="2.5" /><circle cx="12" cy="9.5" r="2.8" /><path d="M8 17c.6-2.2 2.1-3.3 4-3.3s3.4 1.1 4 3.3" /></>,
  biodata: <><path d="M14 2.5H6.5a2 2 0 0 0-2 2v15a2 2 0 0 0 2 2h11a2 2 0 0 0 2-2V8z" /><path d="M14 2.5V8h5.5" /><path d="M8.5 13h7M8.5 16.5h5" /></>,
  invitation: <><rect x="3" y="5.5" width="18" height="13" rx="2" /><path d="m3.5 6.5 8.5 6.5 8.5-6.5" /></>,
  kundliMatch: <><path d="M9 19.5S3 15.8 3 11a3.4 3.4 0 0 1 6-2.2A3.4 3.4 0 0 1 15 11c0 4.8-6 8.5-6 8.5z" /><path d="M14.6 6.2A3.4 3.4 0 0 1 21 8c0 3.2-2.7 5.9-4.6 7.4" /></>,
  compatibility: <><circle cx="9" cy="13.5" r="5" /><circle cx="15" cy="13.5" r="5" /><path d="m13.2 4.5 1.8-2 1.8 2" /></>,
  janamKundli: <><rect x="3.5" y="3.5" width="17" height="17" rx="1" /><path d="M3.5 3.5l17 17M20.5 3.5l-17 17M12 3.5 20.5 12 12 20.5 3.5 12z" /></>,
  manglik: <><circle cx="10" cy="14" r="5.5" /><path d="M14 10 20 4M15 4h5v5" /></>,
  nakshatra: <><path d="M20 14.5A8 8 0 1 1 9.5 4a6.5 6.5 0 0 0 10.5 10.5z" /><path d="m17 3.5.6 1.4 1.4.6-1.4.6-.6 1.4-.6-1.4-1.4-.6 1.4-.6z" /></>,
  rashi: <><circle cx="12" cy="12" r="4" /><path d="M12 2.5v2.5M12 19v2.5M2.5 12H5M19 12h2.5M5.3 5.3l1.8 1.8M16.9 16.9l1.8 1.8M5.3 18.7l1.8-1.8M16.9 7.1l1.8-1.8" /></>,
  muhurat: <><path d="M7 9.5h10l-1 2.5a6 6 0 0 1-8 0z" /><path d="M6.5 12.5c-.8 1-1.2 2.2-1.2 3.5a6.7 6.7 0 0 0 13.4 0c0-1.3-.4-2.5-1.2-3.5" /><path d="M9 9.5C9 7 10.5 5 12 3.5 13.5 5 15 7 15 9.5" /></>,
  babyNames: <><circle cx="12" cy="13" r="8" /><path d="M12 5c-1.6 0-2.5 1-2.5 2.2" /><path d="M9.3 12.2h.01M14.7 12.2h.01" /><path d="M9.8 15.8c1.3 1 3.1 1 4.4 0" /></>,
  festivals: <><path d="M12 19c-2.5-1.8-3.8-4.2-3.8-7S9.5 6.8 12 5c2.5 1.8 3.8 4.2 3.8 7S14.5 17.2 12 19z" /><path d="M12 19c-3.6 0-6.6-1.6-8.5-4.7 2.3-.8 4.4-.6 6.2.4" /><path d="M12 19c3.6 0 6.6-1.6 8.5-4.7-2.3-.8-4.4-.6-6.2.4" /><path d="M7 20.5h10" /></>,
  songs: <><path d="M9 18V5.5l11-2.5V16" /><circle cx="6.5" cy="18" r="2.5" /><circle cx="17.5" cy="16" r="2.5" /></>,
  blogs: <><path d="M12 6.5C10 5 7 4.5 3 4.5v14c4 0 7 .5 9 2 2-1.5 5-2 9-2v-14c-4 0-7 .5-9 2z" /><path d="M12 6.5v14" /></>,
  safety: <><path d="M12 2.5 4.5 5.5v6c0 4.6 3.2 8.4 7.5 10 4.3-1.6 7.5-5.4 7.5-10v-6z" /><path d="m8.8 12 2.2 2.2 4.2-4.4" /></>,
  about: <><circle cx="12" cy="12" r="9" /><path d="M12 11v5.5M12 7.6h.01" /></>,
  shortlist: <path d="M6.5 3.5h11a1 1 0 0 1 1 1v16l-6.5-4.2-6.5 4.2v-16a1 1 0 0 1 1-1z" />,
  gotra: <><circle cx="12" cy="12" r="8.5" /><circle cx="12" cy="12" r="3.2" /><path d="M12 3.5v5.3M12 15.2v5.3M3.5 12h5.3M15.2 12h5.3" /></>,
  help: <><circle cx="12" cy="12" r="9" /><path d="M9.6 9.3a2.5 2.5 0 0 1 4.8.9c0 1.7-2.4 2.2-2.4 3.8M12 17h.01" /></>,
  contact: <path d="M21 16.4v3a2 2 0 0 1-2.2 2 19.8 19.8 0 0 1-8.6-3.1 19.5 19.5 0 0 1-6-6A19.8 19.8 0 0 1 1.6 3.7 2 2 0 0 1 3.6 1.5h3a2 2 0 0 1 2 1.7c.1 1 .4 1.9.7 2.8a2 2 0 0 1-.5 2.1L7.6 9.4a16 16 0 0 0 6 6l1.3-1.3a2 2 0 0 1 2.1-.4c.9.3 1.8.6 2.8.7a2 2 0 0 1 1.7 2z" />,
}

function Icon({ name, size = 20 }: { name: string; size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" {...P} aria-hidden="true" className="shrink-0">
      {ICONS[name]}
    </svg>
  )
}

type Item = { href: string; label: string; icon: string }
type Section = { id: string; title: string; items: Item[] }

/** Members land in their own tools; visitors get the public versions. */
function sections(loggedIn: boolean): Section[] {
  return [
    {
      id: 'explore',
      title: 'Explore',
      items: [
        { href: '/', label: 'Home', icon: 'home' },
        { href: loggedIn ? '/search' : '/explore', label: 'Search Profiles', icon: 'search' },
        { href: '/digital-profile', label: 'Digital Profile', icon: 'profile' },
      ],
    },
    // Members only: the tools the desktop nav carries that the bottom nav has
    // no room for (added on request, 2026-10-21).
    ...(loggedIn ? [{
      id: 'member',
      title: 'My Tools',
      items: [
        { href: '/shortlists', label: 'Shortlist', icon: 'shortlist' },
        { href: '/gotra', label: 'Gotra Checker', icon: 'gotra' },
        { href: '/help', label: 'Help', icon: 'help' },
      ],
    }] : []),
    {
      id: 'wedding',
      title: 'Wedding Tools',
      items: [
        { href: loggedIn ? '/biodata' : '/marriage-biodata', label: 'Marriage Biodata (PDF)', icon: 'biodata' },
        // One entry: the guest picks between the two premium invitations on the chooser.
        { href: '/marriage-invitation#premium', label: 'Premium Invitation', icon: 'invitation' },
      ],
    },
    {
      id: 'astrology',
      title: 'Astrology Tools',
      items: [
        { href: '/astrology/kundli-match', label: 'Kundli Match', icon: 'kundliMatch' },
        { href: '/astrology/compatibility', label: 'Compatibility', icon: 'compatibility' },
        { href: '/astrology/janam-kundli', label: 'Janam Kundli', icon: 'janamKundli' },
        { href: '/astrology/manglik', label: 'Manglik Check', icon: 'manglik' },
        { href: '/astrology/nakshatra', label: 'Nakshatra', icon: 'nakshatra' },
        { href: '/astrology/rashi', label: 'Rashi', icon: 'rashi' },
        { href: '/astrology/vivah-muhurat', label: 'Vivah Muhurat', icon: 'muhurat' },
        { href: '/astrology/baby-names', label: 'Baby Names', icon: 'babyNames' },
      ],
    },
    {
      id: 'culture',
      title: 'Mithila Culture',
      items: [
        { href: '/festivals', label: 'Mithila Festivals', icon: 'festivals' },
        { href: '/festival-songs', label: 'Festival Songs', icon: 'songs' },
        { href: '/blogs', label: 'Blogs', icon: 'blogs' },
      ],
    },
    {
      id: 'support',
      title: 'Trust & Support',
      items: [
        { href: '/safety', label: 'Safety & Verification', icon: 'safety' },
        { href: '/about', label: 'About', icon: 'about' },
        { href: '/contact', label: 'Contact', icon: 'contact' },
      ],
    },
  ]
}

export function MenuDrawer({
  open,
  onClose,
  loggedIn,
  authLoaded,
  isActive,
  onLogout,
  returnFocusTo,
}: {
  open: boolean
  onClose: () => void
  loggedIn: boolean
  authLoaded: boolean
  isActive: (href: string) => boolean
  onLogout: () => void
  returnFocusTo: React.RefObject<HTMLButtonElement | null>
}) {
  const panelRef = useRef<HTMLDivElement>(null)
  const closeRef = useRef<HTMLButtonElement>(null)
  const all = sections(loggedIn)
  // Open on the section holding the current page, else Explore.
  const home = Math.max(0, all.findIndex(sec => sec.items.some(it => isActive(it.href))))
  const [tab, setTab] = useState(home)
  const [burst, setBurst] = useState(0)
  const swipe = useRef<{ x: number; y: number } | null>(null)
  const drag = useRef<number | null>(null)
  const [pull, setPull] = useState(0)
  useEffect(() => { if (open) { setTab(home); setPull(0) } }, [open, home])

  useEffect(() => {
    if (!open) return
    const trigger = returnFocusTo.current
    // Lock the page behind; restore exactly what was there before.
    const prevOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    closeRef.current?.focus()

    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') {
        e.preventDefault()
        onClose()
        return
      }
      if (e.key !== 'Tab' || !panelRef.current) return
      // Keep Tab inside the dialog while it is open.
      const focusable = panelRef.current.querySelectorAll<HTMLElement>('a[href], button:not([disabled])')
      const first = focusable[0]
      const last = focusable[focusable.length - 1]
      if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus() }
      else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus() }
    }
    // The menu only exists below lg; widening past it should not leave it stuck open.
    const mq = window.matchMedia('(min-width: 1024px)')
    const onWide = () => { if (mq.matches) onClose() }

    document.addEventListener('keydown', onKey)
    mq.addEventListener('change', onWide)
    return () => {
      document.body.style.overflow = prevOverflow
      document.removeEventListener('keydown', onKey)
      mq.removeEventListener('change', onWide)
      trigger?.focus()
    }
  }, [open, onClose, returnFocusTo])

  if (!open) return null

  const N = all.length
  const pick = (i: number) => { const k = (i + N) % N; if (k !== tab) { setTab(k); setBurst(b => b + 1) } }
  const sec = all[tab]
  const on = (href: string) => isActive(href) || undefined

  // Drag the handle down to close.
  const onHandleDown = (e: React.PointerEvent) => { drag.current = e.clientY; (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId) }
  const onHandleMove = (e: React.PointerEvent) => { if (drag.current !== null) setPull(Math.max(0, e.clientY - drag.current)) }
  const onHandleUp = () => { if (drag.current === null) return; drag.current = null; if (pull > 90) onClose(); else setPull(0) }
  // Swipe sideways across the sheet to move between sections.
  const onTouchStart = (e: React.TouchEvent) => { const t = e.touches[0]; swipe.current = { x: t.clientX, y: t.clientY } }
  const onTouchEnd = (e: React.TouchEvent) => {
    const s0 = swipe.current; swipe.current = null; if (!s0) return
    const t = e.changedTouches[0], dx = t.clientX - s0.x, dy = t.clientY - s0.y
    if (Math.abs(dx) > 60 && Math.abs(dx) > Math.abs(dy) * 1.5) pick(tab + (dx < 0 ? 1 : -1))
  }
  const onTabKey = (e: React.KeyboardEvent, i: number) => {
    const k: Record<string, number> = { ArrowRight: i + 1, ArrowLeft: i - 1, Home: 0, End: N - 1 }
    if (e.key in k) { e.preventDefault(); pick(k[e.key]); document.getElementById(`menu-tab-${all[(k[e.key] + N) % N].id}`)?.focus() }
  }

  // Portalled to <body>: inside the sticky header it would share the header's
  // stacking layer and the fixed bottom nav would paint over it.
  return createPortal(
    <div className="fixed inset-0 z-[70] flex items-end justify-center lg:hidden" id="site-menu">
      <div className="mj-orb-scrim absolute inset-0" onClick={onClose} aria-hidden="true" />

      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-label="Site menu"
        className="mj-orb relative flex max-h-[88vh] w-full max-w-[480px] flex-col"
        style={{ transform: pull ? `translateY(${pull}px)` : undefined }}
        onTouchStart={onTouchStart}
        onTouchEnd={onTouchEnd}
      >
        {/* gradient-mesh glow and a faint blueprint grid behind everything */}
        <div className="mj-orb-mesh" aria-hidden="true"><i /><i /><i /></div>

        {/* ── Handle + top row ── */}
        <div
          className="relative flex shrink-0 touch-none cursor-grab items-center justify-between px-4 pb-1 pt-2.5"
          onPointerDown={onHandleDown} onPointerMove={onHandleMove} onPointerUp={onHandleUp} onPointerCancel={onHandleUp}
        >
          <span className="mj-orb-handle" aria-hidden="true" />
          <Link href="/" onClick={onClose} className="relative mt-2 inline-flex items-center gap-2 rounded-mj-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-maroon/40" aria-label="Mithila Jodi — home">
            <Image src="/logo-mark-128.webp" alt="" width={40} height={37} className="h-8 w-auto" />
            <span className="flex flex-col leading-none">
              <span className="font-serif text-[16px] font-bold text-maroon">Mithila Jodi</span>
              <span className="font-deva mt-0.5 text-[10px] text-maroon/80" lang="hi">जहाँ परंपरा मिले, प्रेम से</span>
            </span>
          </Link>
          <button ref={closeRef} type="button" onClick={onClose} aria-label="Close menu" className="mj-menu-close relative mt-2 grid h-10 w-10 place-items-center rounded-full text-maroon focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-maroon/40">
            <svg width="16" height="16" viewBox="0 0 22 22" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" aria-hidden="true"><line x1="4" y1="4" x2="18" y2="18" /><line x1="18" y1="4" x2="4" y2="18" /></svg>
          </button>
        </div>

        {/* ── The dial: the sections on an arc ── */}
        <div className="relative shrink-0 px-3">
          <OrbitDial sections={all} active={tab} onPick={pick} onKey={onTabKey} burst={burst} />
          <div className="pointer-events-none relative -mt-1 flex justify-center" aria-hidden="true">
            <FlapWord text={sec.title.toUpperCase()} />
          </div>
        </div>

        {/* ── The chosen section's links ── */}
        <div
          id="menu-panel"
          role="tabpanel"
          aria-labelledby={`menu-tab-${sec.id}`}
          className="relative min-h-0 flex-1 overflow-y-auto overscroll-contain px-4 pb-3 pt-3"
        >
          <ul key={sec.id} className={`grid gap-2 ${sec.items.length > 3 ? 'grid-cols-2' : 'grid-cols-1'}`}>
            {sec.items.map((it, k) => (
              <li key={it.label} className="mj-orb-item" style={{ '--k': k } as React.CSSProperties}>
                <Link href={it.href} onClick={onClose} className="mj-orb-card" data-on={on(it.href)} aria-current={isActive(it.href) ? 'page' : undefined}>
                  <span className="mj-orb-icon"><Icon name={it.icon} size={19} /></span>
                  <span className="min-w-0 flex-1 text-[14px] font-medium leading-tight">{it.label}</span>
                  <svg width="14" height="14" viewBox="0 0 24 24" {...P} strokeWidth={2.2} aria-hidden="true" className="shrink-0 opacity-50"><path d="m9 6 6 6-6 6" /></svg>
                </Link>
              </li>
            ))}
          </ul>
        </div>

        {/* ── Account + channels, always within thumb reach ── */}
        <div className="relative shrink-0 border-t border-gold/25 px-4 pb-[max(12px,env(safe-area-inset-bottom))] pt-3">
          {authLoaded && (loggedIn ? (
            <div className="flex gap-2">
              <Link href="/profile" onClick={onClose} className="mj-orb-cta flex-1">
                <svg width="18" height="18" viewBox="0 0 24 24" {...P} strokeWidth={1.8} aria-hidden="true"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" /></svg>
                My Profile
              </Link>
              <button type="button" onClick={() => { onClose(); onLogout() }} className="min-h-[46px] rounded-full border border-maroon/30 bg-cream/80 px-4 text-[13.5px] font-medium text-maroon focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-maroon/40">
                Log out
              </button>
            </div>
          ) : (
            <Link href="/register" onClick={onClose} className="mj-orb-cta">
              <svg width="18" height="18" viewBox="0 0 24 24" {...P} strokeWidth={1.8} aria-hidden="true"><circle cx="9" cy="8" r="4" /><path d="M3 20c0-3.6 2.7-6 6-6" /><line x1="18" y1="11" x2="18" y2="17" /><line x1="15" y1="14" x2="21" y2="14" /></svg>
              Join / Login <span className="font-normal opacity-75">· free</span>
            </Link>
          ))}
          <div className="mt-2.5 flex items-center justify-center gap-2.5">
            {([
              ['instagram', OFFICIAL_LINKS.instagram, 'Mithila Jodi on Instagram', 'noopener noreferrer'],
              ['facebook', OFFICIAL_LINKS.facebook, 'Mithila Jodi on Facebook', 'noopener noreferrer'],
              ['whatsapp', OFFICIAL_LINKS.whatsapp, 'Join the Mithila Jodi WhatsApp Community', 'noopener noreferrer nofollow'],
              ['youtube', OFFICIAL_LINKS.youtube, 'Mithila Jodi on YouTube', 'noopener noreferrer'],
            ] as const).map(([brand, href, label, rel]) => (
              <a key={brand} href={href} target="_blank" rel={rel} className="mj-menu-social" aria-label={label}>
                <BrandIcon brand={brand} size={32} />
              </a>
            ))}
          </div>
        </div>
      </div>
    </div>,
    document.body
  )
}

// ── The dial ───────────────────────────────────────────────────────────────
const DW = 360, DCX = 180, DCY = 205, RO = 192, RI = 128
const r1 = (n: number) => Math.round(n * 10) / 10
const pt = (r: number, deg: number) => { const a = ((deg - 90) * Math.PI) / 180; return [r1(DCX + r * Math.cos(a)), r1(DCY + r * Math.sin(a))] as const }
const SPAN = 116 // degrees the arc covers, centred on the top

function OrbitDial({ sections: secs, active, onPick, onKey, burst }: {
  sections: Section[]; active: number; onPick: (i: number) => void; onKey: (e: React.KeyboardEvent, i: number) => void; burst: number
}) {
  const n = secs.length, step = SPAN / n
  const mid = (i: number) => -SPAN / 2 + step * (i + 0.5)
  const seg = (i: number) => {
    const a0 = -SPAN / 2 + step * i + 0.8, a1 = a0 + step - 1.6
    const [x0, y0] = pt(RO, a0), [x1, y1] = pt(RO, a1), [x2, y2] = pt(RI, a1), [x3, y3] = pt(RI, a0)
    return `M${x0} ${y0}A${RO} ${RO} 0 0 1 ${x1} ${y1}L${x2} ${y2}A${RI} ${RI} 0 0 0 ${x3} ${y3}Z`
  }
  const [mx, my] = pt(RO + 8, mid(active))
  return (
    <div className="relative mx-auto w-full max-w-[380px]" style={{ aspectRatio: `${DW} / 136` }}>
      <svg viewBox={`0 6 ${DW} 136`} className="absolute inset-0 h-full w-full overflow-visible" aria-hidden="true">
        {/* wireframe orbits */}
        <path d={`M${pt(RO + 8, -SPAN / 2 - 4).join(' ')}A${RO + 8} ${RO + 8} 0 0 1 ${pt(RO + 8, SPAN / 2 + 4).join(' ')}`} fill="none" stroke="#B98A2E" strokeOpacity=".35" strokeDasharray="2 5" />
        <path d={`M${pt(RI - 10, -SPAN / 2).join(' ')}A${RI - 10} ${RI - 10} 0 0 1 ${pt(RI - 10, SPAN / 2).join(' ')}`} fill="none" stroke="#B98A2E" strokeOpacity=".3" />
        {secs.map((_, i) => <path key={i} d={seg(i)} className="mj-orb-seg" data-on={i === active || undefined} onClick={() => onPick(i)} />)}
        {/* the gold marker that travels to the chosen section */}
        <circle cx={mx} cy={my} r="4" fill="#E9C977" className="mj-orb-marker" />
        <circle cx={mx} cy={my} r="9" fill="none" stroke="#E9C977" strokeOpacity=".6" className="mj-orb-marker" />
        {/* particles thrown from the chosen segment */}
        <g key={burst} className="mj-orb-burst">
          {Array.from({ length: 10 }, (_, k) => {
            const [px, py] = pt((RO + RI) / 2, mid(active) + (k - 4.5) * 2.2)
            return <circle key={k} cx={px} cy={py} r={1.6 + (k % 3) * 0.6} fill="#E9C977" style={{ '--dx': `${(k - 4.5) * 5}px`, '--dy': `${-12 - (k % 4) * 6}px` } as React.CSSProperties} />
          })}
        </g>
      </svg>
      <div role="tablist" aria-label="Menu sections" className="absolute inset-0">
        {secs.map((s2, i) => {
          const [x, y] = pt((RO + RI) / 2, mid(i))
          return (
            <button
              key={s2.id}
              id={`menu-tab-${s2.id}`}
              type="button"
              role="tab"
              aria-selected={i === active}
              aria-controls="menu-panel"
              tabIndex={i === active ? 0 : -1}
              onClick={() => onPick(i)}
              onKeyDown={e => onKey(e, i)}
              className="mj-orb-tab absolute grid h-11 w-11 -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full"
              data-on={i === active || undefined}
              style={{ left: `${(x / DW) * 100}%`, top: `${((y - 6) / 136) * 100}%` }}
            >
              <Icon name={SECTION_ICON[s2.id]} size={20} />
              <span className="sr-only">{s2.title}</span>
            </button>
          )
        })}
      </div>
    </div>
  )
}
const SECTION_ICON: Record<string, string> = { explore: 'search', member: 'shortlist', wedding: 'invitation', astrology: 'rashi', culture: 'festivals', support: 'safety' }

/** The section's name on split-flap tiles; the tiles that change flip through letters and settle. */
const FLAP = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ&'
function FlapWord({ text }: { text: string }) {
  const L = 15
  const centred = (' '.repeat(Math.floor((L - text.length) / 2)) + text).padEnd(L, ' ').slice(0, L)
  const [shown, setShown] = useState(centred)
  const last = useRef(centred)
  useEffect(() => {
    const from = last.current; last.current = centred
    if (from === centred) return
    if (window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) { setShown(centred); return }
    let step = 0
    const id = window.setInterval(() => {
      step++
      setShown(Array.from(centred, (ch, i) => (ch === from[i] || step >= 2 + i * 0.9 ? ch : FLAP[(step * 7 + i * 5) % FLAP.length])).join(''))
      if (step >= 2 + L * 0.9) window.clearInterval(id)
    }, 45)
    return () => window.clearInterval(id)
  }, [centred])
  return (
    <span className="mj-flaps mj-flaps-sm">
      {Array.from(shown, (ch, i) => <span key={i} className="mj-flap"><span key={ch}>{ch === ' ' ? '\u00a0' : ch}</span></span>)}
    </span>
  )
}
