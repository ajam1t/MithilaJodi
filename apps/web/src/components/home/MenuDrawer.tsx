'use client'

import Link from 'next/link'
import Image from 'next/image'
import { useEffect, useRef, type ReactNode } from 'react'
import { createPortal } from 'react-dom'
import { cn } from '@/lib/utils/cn'
import { INSTAGRAM_URL, WHATSAPP_COMMUNITY_URL, YOUTUBE_URL } from '@/lib/constants'
import { WhatsAppIcon } from '@/components/whatsapp/JoinCommunity'

/*
 * The hamburger menu — complete site navigation. The five sections, their
 * order and every label are the owner's locked structure (2026-10-07); the
 * bottom nav keeps the frequent destinations. Change wording only on request.
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
  contact: <path d="M21 16.4v3a2 2 0 0 1-2.2 2 19.8 19.8 0 0 1-8.6-3.1 19.5 19.5 0 0 1-6-6A19.8 19.8 0 0 1 1.6 3.7 2 2 0 0 1 3.6 1.5h3a2 2 0 0 1 2 1.7c.1 1 .4 1.9.7 2.8a2 2 0 0 1-.5 2.1L7.6 9.4a16 16 0 0 0 6 6l1.3-1.3a2 2 0 0 1 2.1-.4c.9.3 1.8.6 2.8.7a2 2 0 0 1 1.7 2z" />,
}

function Icon({ name, size = 20 }: { name: string; size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" {...P} aria-hidden="true" className="shrink-0">
      {ICONS[name]}
    </svg>
  )
}

function Chevron() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" {...P} strokeWidth={2} aria-hidden="true" className="ml-auto shrink-0 text-ink-soft">
      <path d="m9 6 6 6-6 6" />
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
    {
      id: 'wedding',
      title: 'Wedding Tools',
      items: [
        { href: loggedIn ? '/biodata' : '/marriage-biodata', label: 'Marriage Biodata (PDF)', icon: 'biodata' },
        { href: '/marriage-invitation/premium', label: 'Mithila Premium Invitation', icon: 'invitation' },
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

/** Faint lotus line-art for the drawer's top corner — decoration only. */
function LotusCorner() {
  return (
    <svg aria-hidden="true" width="96" height="64" viewBox="0 0 96 64" fill="none" stroke="#B98A2E" strokeWidth="1" strokeLinecap="round" className="pointer-events-none absolute right-12 top-3 opacity-30">
      <path d="M48 56c-7-6-10-13-10-21s3-14 10-20c7 6 10 12 10 20s-3 15-10 21z" />
      <path d="M48 56c-11 0-20-5-26-14 7-3 14-2 20 2" />
      <path d="M48 56c11 0 20-5 26-14-7-3-14-2-20 2" />
      <path d="M48 56c-16 2-28-2-36-10M48 56c16 2 28-2 36-10" />
      <path d="M30 60h36" />
    </svg>
  )
}

const SOCIAL =
  'inline-flex min-h-[40px] flex-auto items-center justify-center gap-1.5 whitespace-nowrap rounded-pill border border-gold/40 bg-cream px-2.5 ' +
  'text-[12px] font-medium text-ink transition-colors hover:border-gold hover:text-maroon ' +
  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-maroon/40'

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

  const row = (href: string) =>
    cn(
      'flex min-h-[48px] items-center gap-3.5 rounded-mj-sm px-2 text-[15px] transition-colors',
      'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-maroon/40',
      isActive(href) ? 'bg-paper-2 font-semibold text-maroon' : 'text-ink hover:bg-paper'
    )

  // Portalled to <body>: inside the sticky header it would share the header's
  // stacking layer and the fixed bottom nav would paint over it.
  return createPortal(
    <div className="fixed inset-0 z-[70] flex justify-end lg:hidden" id="site-menu">
      <div className="absolute inset-0 bg-ink/40 animate-[fadeIn_.2s_ease] motion-reduce:animate-none" onClick={onClose} aria-hidden="true" />

      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-label="Site menu"
        className="relative flex h-full w-full flex-col overflow-y-auto overscroll-contain bg-cream shadow-mj-sm animate-[menuIn_.22s_cubic-bezier(0.2,0.8,0.3,1)] motion-reduce:animate-none sm:max-w-[400px]"
      >
        {/* ── Header ── */}
        <div className="relative shrink-0 px-4 pb-3 pt-[max(12px,env(safe-area-inset-top))]">
          <div className="absolute inset-x-0 top-0 h-[3px] bg-gradient-to-r from-cream via-gold to-cream" aria-hidden="true" />
          <LotusCorner />
          <Link href="/" onClick={onClose} className="relative inline-flex items-center gap-2.5 rounded-mj-sm pr-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-maroon/40" aria-label="Mithila Jodi — home">
            <Image src="/logo-mark.png" alt="" width={52} height={48} className="h-11 w-auto shrink-0 object-contain" />
            <span className="flex flex-col leading-none">
              <span className="font-serif text-[22px] font-bold leading-tight text-maroon">Mithila Jodi</span>
              <span className="font-deva mt-0.5 text-[11.5px] leading-tight text-maroon opacity-85" lang="hi">जहाँ परंपरा मिले, प्रेम से</span>
              <span className="font-serif mt-0.5 text-[10.5px] italic leading-tight text-ink-soft">Where tradition meets love.</span>
            </span>
          </Link>
          <button
            ref={closeRef}
            type="button"
            onClick={onClose}
            aria-label="Close menu"
            className="absolute right-2 top-[max(8px,env(safe-area-inset-top))] grid h-11 w-11 place-items-center rounded-full text-maroon transition-colors hover:bg-paper focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-maroon/40"
          >
            <svg width="20" height="20" viewBox="0 0 22 22" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
              <line x1="4" y1="4" x2="18" y2="18" /><line x1="18" y1="4" x2="4" y2="18" />
            </svg>
          </button>
        </div>

        <div className="flex-1 px-4 pb-[max(20px,env(safe-area-inset-bottom))]">
          {/* ── Account ── visitors: Join / Login; members: their profile + log out */}
          {authLoaded && (loggedIn ? (
            <div className="flex gap-2">
              <Link href="/profile" onClick={onClose} className="flex min-h-[52px] flex-1 items-center gap-3 rounded-mj-sm bg-maroon px-4 font-semibold text-cream transition-colors hover:bg-maroon-deep focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold-lt focus-visible:ring-offset-2 focus-visible:ring-offset-cream">
                <svg width="22" height="22" viewBox="0 0 24 24" {...P} strokeWidth={1.8} aria-hidden="true"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" /></svg>
                <span className="text-[16px]">My Profile</span>
                <svg width="18" height="18" viewBox="0 0 24 24" {...P} strokeWidth={2} aria-hidden="true" className="ml-auto"><path d="m9 6 6 6-6 6" /></svg>
              </Link>
              <button type="button" onClick={() => { onClose(); onLogout() }} className="min-h-[52px] rounded-mj-sm border border-maroon/30 px-4 text-[14px] font-medium text-maroon transition-colors hover:bg-paper focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-maroon/40">
                Log out
              </button>
            </div>
          ) : (
            <Link href="/register" onClick={onClose} className="flex min-h-[52px] items-center gap-3 rounded-mj-sm bg-maroon px-4 font-semibold text-cream transition-colors hover:bg-maroon-deep focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold-lt focus-visible:ring-offset-2 focus-visible:ring-offset-cream">
              {/* Same person-plus glyph as the bottom nav's Join / Login. */}
              <svg width="22" height="22" viewBox="0 0 24 24" {...P} strokeWidth={1.8} aria-hidden="true">
                <circle cx="9" cy="8" r="4" /><path d="M3 20c0-3.6 2.7-6 6-6" /><line x1="18" y1="11" x2="18" y2="17" /><line x1="15" y1="14" x2="21" y2="14" />
              </svg>
              <span className="text-[16px]">Join / Login</span>
              <svg width="18" height="18" viewBox="0 0 24 24" {...P} strokeWidth={2} aria-hidden="true" className="ml-auto"><path d="m9 6 6 6-6 6" /></svg>
            </Link>
          ))}

          {/* ── The five locked sections ── */}
          <nav aria-label="Site navigation" className="mt-1">
            {sections(loggedIn).map(s => (
              <section key={s.id} aria-labelledby={`menu-${s.id}`} className="mt-5">
                <h2 id={`menu-${s.id}`} className="mb-1 flex items-center gap-3 px-2 text-[11.5px] font-semibold uppercase tracking-[0.16em] text-[#8A6516]">
                  {/* A darker gold than the brand gold, which is too light for small text on cream. */}
                  {s.title}
                  <span className="h-px flex-1 bg-gradient-to-r from-gold/50 to-transparent" aria-hidden="true" />
                </h2>
                <ul>
                  {s.items.map(it => (
                    <li key={it.label}>
                      <Link href={it.href} onClick={onClose} className={row(it.href)} aria-current={isActive(it.href) ? 'page' : undefined}>
                        <span className="grid w-6 shrink-0 place-items-center text-maroon"><Icon name={it.icon} /></span>
                        <span className="min-w-0 truncate">{it.label}</span>
                        <Chevron />
                      </Link>
                    </li>
                  ))}
                </ul>
              </section>
            ))}
          </nav>

          {/* ── Footer ── */}
          <div className="mt-6 border-t border-gold/25 pt-4 text-center">
            <p className="font-deva text-[12.5px] text-maroon" lang="hi">
              गाँव से जुड़ाव <span className="text-gold" aria-hidden="true">•</span> संस्कार से रिश्ता <span className="text-gold" aria-hidden="true">•</span> प्रेम से जीवन
            </p>
            <div className="mt-3 flex gap-1.5">
              <a href={INSTAGRAM_URL} target="_blank" rel="noopener noreferrer" className={SOCIAL} aria-label="Mithila Jodi on Instagram">
                <svg width="14" height="14" viewBox="0 0 24 24" {...P} strokeWidth={2} aria-hidden="true" className="shrink-0 text-maroon"><rect x="3" y="3" width="18" height="18" rx="5" /><circle cx="12" cy="12" r="4" /><circle cx="17.5" cy="6.5" r=".6" fill="currentColor" /></svg>
                Instagram
              </a>
              <a href={YOUTUBE_URL} target="_blank" rel="noopener noreferrer" className={SOCIAL} aria-label="Mithila Jodi on YouTube">
                <svg width="16" height="14" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" className="shrink-0 text-maroon">
                  <path d="M23.5 6.2a3 3 0 0 0-2.1-2.1C19.5 3.6 12 3.6 12 3.6s-7.5 0-9.4.5A3 3 0 0 0 .5 6.2 31.4 31.4 0 0 0 0 12a31.4 31.4 0 0 0 .5 5.8 3 3 0 0 0 2.1 2.1c1.9.5 9.4.5 9.4.5s7.5 0 9.4-.5a3 3 0 0 0 2.1-2.1A31.4 31.4 0 0 0 24 12a31.4 31.4 0 0 0-.5-5.8ZM9.6 15.6V8.4l6.3 3.6Z" />
                </svg>
                YouTube
              </a>
              <a href={WHATSAPP_COMMUNITY_URL} target="_blank" rel="noopener noreferrer nofollow" className={SOCIAL} aria-label="Join the Mithila Jodi WhatsApp Community">
                <span className="shrink-0 text-[#1F8A4C]"><WhatsAppIcon size={14} /></span>
                {/* The full name fits from ~380px; the narrowest phones get the short form. */}
                <span className="min-[380px]:hidden">WhatsApp</span>
                <span className="hidden min-[380px]:inline">WhatsApp Community</span>
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>,
    document.body
  )
}
