'use client'

import Link from 'next/link'
import Image from 'next/image'
import { useEffect, useRef, type ReactNode } from 'react'
import { createPortal } from 'react-dom'
import { OFFICIAL_LINKS } from '@/lib/constants'
import { BrandIcon } from '@/components/social/BrandIcons'

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

type Item = { href: string; label: string; icon: string }
type Section = { id: string; title: string; items: Item[] }

/** Members land in their own tools; visitors get the public versions. */
function sections(loggedIn: boolean): Section[] {
  return [
    {
      id: 'explore',
      title: 'Explore',
      items: [
        { href: loggedIn ? '/home' : '/', label: 'Home', icon: 'home' },
        { href: loggedIn ? '/search' : '/explore', label: 'Search Profiles', icon: 'search' },
        { href: '/digital-profile', label: 'Digital Profile', icon: 'profile' },
      ],
    },
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

/** A large, faint aripan behind the top of the drawer; it turns a little as the menu opens. */
function MenuAripan() {
  const petals = Array.from({ length: 12 }, (_, i) => i * 30)
  return (
    <svg aria-hidden="true" viewBox="0 0 200 200" className="mj-menu-aripan">
      <circle cx="100" cy="100" r="96" fill="none" stroke="#B98A2E" strokeWidth=".7" />
      <circle cx="100" cy="100" r="88" fill="none" stroke="#B98A2E" strokeWidth=".6" strokeDasharray="1.5 4" />
      {petals.map(a => <ellipse key={a} cx="100" cy="52" rx="9" ry="30" fill="none" stroke="#B98A2E" strokeWidth=".8" transform={`rotate(${a} 100 100)`} />)}
      <circle cx="100" cy="100" r="16" fill="none" stroke="#9B2233" strokeWidth=".8" />
    </svg>
  )
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

  const on = (href: string) => isActive(href) || undefined
  const [explore, wedding, astrology, culture, support] = sections(loggedIn)
  const head = (sec: Section, i: number) => (
    <h2 id={`menu-${sec.id}`} className="mj-menu-head" style={{ '--i': i } as React.CSSProperties}>
      <span>{sec.title}</span>
      <span className="mj-menu-rule" aria-hidden="true" />
    </h2>
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
        className="mj-menu relative flex h-full w-full flex-col overflow-y-auto overscroll-contain shadow-mj-sm animate-[menuIn_.22s_cubic-bezier(0.2,0.8,0.3,1)] motion-reduce:animate-none sm:max-w-[400px]"
      >
        <MenuAripan />
        {/* ── Header ── */}
        <div className="relative shrink-0 px-4 pb-2 pt-[max(12px,env(safe-area-inset-top))]">
          <div className="absolute inset-x-0 top-0 h-[3px] bg-gradient-to-r from-transparent via-gold to-transparent" aria-hidden="true" />
          <Link href="/" onClick={onClose} className="relative inline-flex items-center gap-2.5 rounded-mj-sm pr-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-maroon/40" aria-label="Mithila Jodi — home">
            <Image src="/logo-mark.png" alt="" width={52} height={48} className="h-10 w-auto shrink-0 object-contain" />
            <span className="flex flex-col leading-none">
              <span className="font-serif text-[20px] font-bold leading-tight text-maroon">Mithila Jodi</span>
              <span className="font-deva mt-0.5 text-[11px] leading-tight text-maroon opacity-85" lang="hi">जहाँ परंपरा मिले, प्रेम से</span>
            </span>
          </Link>
          <button
            ref={closeRef}
            type="button"
            onClick={onClose}
            aria-label="Close menu"
            className="mj-menu-close absolute right-3 top-[max(10px,env(safe-area-inset-top))] grid h-11 w-11 place-items-center rounded-full text-maroon focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-maroon/40"
          >
            <svg width="18" height="18" viewBox="0 0 22 22" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
              <line x1="4" y1="4" x2="18" y2="18" /><line x1="18" y1="4" x2="4" y2="18" />
            </svg>
          </button>
        </div>

        <div className="relative flex-1 px-4 pb-[max(20px,env(safe-area-inset-bottom))]">
          {/* ── Account ── visitors: Join / Login; members: their profile + log out */}
          {authLoaded && (loggedIn ? (
            <div className="mj-menu-in flex gap-2" style={{ '--i': 0 } as React.CSSProperties}>
              <Link href="/profile" onClick={onClose} className="mj-menu-cta flex-1">
                <span className="mj-menu-cta-icon"><svg width="20" height="20" viewBox="0 0 24 24" {...P} strokeWidth={1.8} aria-hidden="true"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" /></svg></span>
                <span className="text-[16px]">My Profile</span>
                <svg width="18" height="18" viewBox="0 0 24 24" {...P} strokeWidth={2} aria-hidden="true" className="ml-auto"><path d="m9 6 6 6-6 6" /></svg>
              </Link>
              <button type="button" onClick={() => { onClose(); onLogout() }} className="min-h-[54px] rounded-[16px] border border-maroon/30 bg-cream px-4 text-[14px] font-medium text-maroon transition-colors hover:bg-paper focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-maroon/40">
                Log out
              </button>
            </div>
          ) : (
            <Link href="/register" onClick={onClose} className="mj-menu-cta mj-menu-in" style={{ '--i': 0 } as React.CSSProperties}>
              {/* Same person-plus glyph as the bottom nav's Join / Login. */}
              <span className="mj-menu-cta-icon">
                <svg width="20" height="20" viewBox="0 0 24 24" {...P} strokeWidth={1.8} aria-hidden="true">
                  <circle cx="9" cy="8" r="4" /><path d="M3 20c0-3.6 2.7-6 6-6" /><line x1="18" y1="11" x2="18" y2="17" /><line x1="15" y1="14" x2="21" y2="14" />
                </svg>
              </span>
              <span className="flex flex-col leading-tight">
                <span className="text-[16px]">Join / Login</span>
                <span className="text-[11.5px] font-normal text-cream/75">Free for every member</span>
              </span>
              <svg width="18" height="18" viewBox="0 0 24 24" {...P} strokeWidth={2} aria-hidden="true" className="ml-auto"><path d="m9 6 6 6-6 6" /></svg>
            </Link>
          ))}

          {/* ── The five locked sections, each in the form that suits it ── */}
          <nav aria-label="Site navigation">
            <section aria-labelledby="menu-explore" className="mj-menu-sec">
              {head(explore, 1)}
              <ul className="mj-menu-in grid grid-cols-3 gap-2" style={{ '--i': 1 } as React.CSSProperties}>
                {explore.items.map(it => (
                  <li key={it.label}>
                    <Link href={it.href} onClick={onClose} className="mj-menu-tile" data-on={on(it.href)} aria-current={isActive(it.href) ? 'page' : undefined}>
                      <span className="mj-menu-disc"><Icon name={it.icon} /></span>
                      <span className="mj-menu-label">{it.label}</span>
                    </Link>
                  </li>
                ))}
              </ul>
            </section>

            <section aria-labelledby="menu-wedding" className="mj-menu-sec">
              {head(wedding, 2)}
              <ul className="mj-menu-in grid grid-cols-2 gap-2" style={{ '--i': 2 } as React.CSSProperties}>
                {wedding.items.map(it => (
                  <li key={it.label}>
                    <Link href={it.href} onClick={onClose} className="mj-menu-wide" data-on={on(it.href)} aria-current={isActive(it.href) ? 'page' : undefined}>
                      <span className="mj-menu-disc"><Icon name={it.icon} /></span>
                      <span className="mj-menu-label text-left">{it.label}</span>
                    </Link>
                  </li>
                ))}
              </ul>
            </section>

            <section aria-labelledby="menu-astrology" className="mj-menu-sec">
              {head(astrology, 3)}
              <ul className="mj-menu-in grid grid-cols-4 gap-x-1.5 gap-y-3" style={{ '--i': 3 } as React.CSSProperties}>
                {astrology.items.map((it, k) => (
                  <li key={it.label}>
                    <Link href={it.href} onClick={onClose} className="mj-menu-orbit" data-on={on(it.href)} aria-current={isActive(it.href) ? 'page' : undefined}>
                      <span className="mj-menu-planet" style={{ '--k': k } as React.CSSProperties}>
                        <span className="mj-menu-moon" aria-hidden="true" />
                        <Icon name={it.icon} />
                      </span>
                      <span className="mj-menu-label">{it.label}</span>
                    </Link>
                  </li>
                ))}
              </ul>
            </section>

            <section aria-labelledby="menu-culture" className="mj-menu-sec">
              {head(culture, 4)}
              <ul className="mj-menu-in grid grid-cols-3 gap-2" style={{ '--i': 4 } as React.CSSProperties}>
                {culture.items.map(it => (
                  <li key={it.label}>
                    <Link href={it.href} onClick={onClose} className="mj-menu-tile" data-on={on(it.href)} aria-current={isActive(it.href) ? 'page' : undefined}>
                      <span className="mj-menu-disc"><Icon name={it.icon} /></span>
                      <span className="mj-menu-label">{it.label}</span>
                    </Link>
                  </li>
                ))}
              </ul>
            </section>

            <section aria-labelledby="menu-support" className="mj-menu-sec">
              {head(support, 5)}
              <ul className="mj-menu-in flex flex-wrap gap-2" style={{ '--i': 5 } as React.CSSProperties}>
                {support.items.map(it => (
                  <li key={it.label}>
                    <Link href={it.href} onClick={onClose} className="mj-menu-chip" data-on={on(it.href)} aria-current={isActive(it.href) ? 'page' : undefined}>
                      <Icon name={it.icon} size={16} />
                      {it.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </section>
          </nav>

          {/* ── Footer ── */}
          <div className="mj-menu-in mt-6 border-t border-gold/25 pt-4 text-center" style={{ '--i': 6 } as React.CSSProperties}>
            <p className="font-deva text-[12.5px] text-maroon" lang="hi">
              गाँव से जुड़ाव <span className="text-gold" aria-hidden="true">•</span> संस्कार से रिश्ता <span className="text-gold" aria-hidden="true">•</span> प्रेम से जीवन
            </p>
            <div className="mt-3 flex justify-center gap-3">
              {([
                ['instagram', OFFICIAL_LINKS.instagram, 'Mithila Jodi on Instagram', 'noopener noreferrer'],
                ['facebook', OFFICIAL_LINKS.facebook, 'Mithila Jodi on Facebook', 'noopener noreferrer'],
                ['whatsapp', OFFICIAL_LINKS.whatsapp, 'Join the Mithila Jodi WhatsApp Community', 'noopener noreferrer nofollow'],
                ['youtube', OFFICIAL_LINKS.youtube, 'Mithila Jodi on YouTube', 'noopener noreferrer'],
              ] as const).map(([brand, href, label, rel]) => (
                <a key={brand} href={href} target="_blank" rel={rel} className="mj-menu-social" aria-label={label}>
                  <BrandIcon brand={brand} size={40} />
                </a>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>,
    document.body
  )
}
