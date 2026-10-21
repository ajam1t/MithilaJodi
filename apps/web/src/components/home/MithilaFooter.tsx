import Link from 'next/link'
import Image from 'next/image'
import { OFFICIAL_LINKS } from '@/lib/constants'
import { BrandIcon, type Brand } from '@/components/social/BrandIcons'

const GROUPS = [
  {
    label: 'Platform',
    links: [
      { href: '/explore', label: 'Browse Profiles' },
      { href: '/register', label: 'Create Free Account' },
      { href: '/login', label: 'Login' },
      { href: '/about', label: 'About' },
      { href: '/compare', label: 'Why Mithila Jodi' },
      { href: '/pricing', label: 'Pricing' },
      { href: '/#stories', label: 'Family & Values' },
    ],
  },
  {
    label: 'Explore',
    links: [
      { href: '/marriage-biodata', label: 'Marriage Biodata' },
      { href: '/gotra', label: 'Gotra List & Checker' },
      { href: '/mool', label: 'Mool List' },
      { href: '/match-score', label: 'Match Score' },
      { href: '/astrology', label: 'Astrology Tools' },
      { href: '/festivals', label: 'Mithila Festivals' },
      { href: '/festival-songs', label: 'Festival Songs' },
      { href: '/marriage-invitation', label: 'Wedding Invitations' },
      { href: '/blogs', label: 'Blogs' },
      { href: '/help', label: 'Help & Support' },
      { href: '/safety', label: 'Safety & Verification' },
      { href: '/contact', label: 'Contact Us' },
    ],
  },
  {
    label: 'Legal',
    links: [
      { href: '/legal/terms', label: 'Terms of Service' },
      { href: '/legal/privacy', label: 'Privacy Policy' },
      { href: '/legal/consent', label: 'Consent & Data' },
    ],
  },
]

/**
 * `className` exists so a page can move the fixed-bottom-nav clearance ONTO the
 * footer. The usual pattern — `pb-16` on <main> — puts 64px of page-coloured
 * padding between the last section and the footer on mobile, which reads as a
 * blank band before the footer, while the footer's own last 64px still sits
 * under the nav. Passing the padding here instead fixes both.
 */
/**
 * The four official channels, one treatment for all: each platform's own
 * app-icon logo in its own colours, framed by a gold ring, and the verb for
 * what you do there. `target="_blank"` with `rel="noopener noreferrer"` so the
 * new tab cannot reach back into this one via window.opener; the WhatsApp
 * invite is also nofollow. Each goes through /go/… so Admin → Community can
 * change the address without a deployment.
 */
const SOCIALS = [
  { href: OFFICIAL_LINKS.instagram, name: 'Instagram', verb: 'Follow', label: 'Mithila Jodi on Instagram', brand: 'instagram' as Brand, rel: 'noopener noreferrer' },
  { href: OFFICIAL_LINKS.facebook, name: 'Facebook', verb: 'Follow', label: 'Mithila Jodi on Facebook', brand: 'facebook' as Brand, rel: 'noopener noreferrer' },
  { href: OFFICIAL_LINKS.whatsapp, name: 'WhatsApp', verb: 'Join', label: 'Join the Mithila Jodi WhatsApp Community', brand: 'whatsapp' as Brand, rel: 'noopener noreferrer nofollow' },
  { href: OFFICIAL_LINKS.youtube, name: 'YouTube', verb: 'Watch', label: 'Mithila Jodi on YouTube', brand: 'youtube' as Brand, rel: 'noopener noreferrer' },
]

export function MithilaFooter({ className = '' }: { className?: string }) {
  return (
    <footer className={`mj-footer ${className}`} role="contentinfo">
      {/* Gold top border */}
      <div className="h-[3px] bg-gradient-to-r from-transparent via-gold to-transparent" aria-hidden="true" />

      {/* Compact main area */}
      <div className="wrap py-4">
        {/* Community channels — four tiles that rise in and trace their gold ring once. */}
        <div className="mx-auto mb-5 max-w-lg">
          <p className="mb-2.5 flex items-center justify-center gap-2 text-center text-[10.5px] font-semibold uppercase tracking-[0.2em] text-gold-lt">
            <span className="h-px w-8 bg-gradient-to-r from-transparent to-gold-lt/70" aria-hidden="true" />
            <span><span className="font-deva normal-case tracking-normal text-[12.5px]" lang="hi">हमसे जुड़िए</span> · Stay connected</span>
            <span className="h-px w-8 bg-gradient-to-l from-transparent to-gold-lt/70" aria-hidden="true" />
          </p>
          <ul data-mj-stagger className="grid grid-cols-4 gap-2 sm:gap-3">
            {SOCIALS.map(sc => (
              <li key={sc.name} data-mj-reveal>
                <a href={sc.href} target="_blank" rel={sc.rel} aria-label={sc.label} className="mj-soc">
                  <span className="mj-soc-disc">
                    <svg viewBox="0 0 64 64" className="mj-soc-ring" aria-hidden="true">
                      <rect x="1" y="1" width="62" height="62" rx="17" pathLength={1} />
                    </svg>
                    <BrandIcon brand={sc.brand} className="mj-soc-icon" />
                  </span>
                  <span className="mj-soc-name">{sc.name}</span>
                  <span className="mj-soc-verb">{sc.verb} <span aria-hidden="true">↗</span></span>
                </a>
              </li>
            ))}
          </ul>
        </div>
        {/* Top: brand + nav groups */}
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
          {/* Brand — compact on mobile */}
          <div className="flex sm:flex-col items-center sm:items-start gap-3 sm:gap-0 flex-shrink-0">
            {/* Maroon on maroon would vanish, so the logo sits on ivory — the
                paper it was drawn on — never recoloured. */}
            <Link href="/" className="inline-block shrink-0 rounded-mj-sm bg-cream p-1.5 sm:mb-2.5 sm:p-2.5" aria-label="Mithila Jodi — home">
              <Image src="/logo-mark-128.webp" alt="Mithila Jodi" width={48} height={44} loading="lazy" className="h-11 w-auto object-contain sm:hidden" />
              <Image src="/logo-320.webp" alt="Mithila Jodi" width={160} height={139} loading="lazy" className="hidden h-[120px] w-auto object-contain sm:block" />
            </Link>
            {/* On desktop the full logo already carries the tagline. */}
            <div className="sm:hidden">
              <p className="font-deva text-paper-3 text-[12px] opacity-80 leading-snug">जहाँ परंपरा मिले, प्रेम से</p>
              <p className="font-serif text-paper-3 text-[10px] italic opacity-60 mt-0.5">Where tradition meets love.</p>
            </div>
          </div>

          {/* Nav groups — 3 columns always (mobile & desktop) */}
          <div className="grid grid-cols-3 gap-x-4 gap-y-1 sm:gap-x-8">
            {GROUPS.map(({ label, links }) => (
              <div key={label}>
                <p className="text-gold-lt text-[10px] font-semibold tracking-widest uppercase mb-1.5 whitespace-nowrap">{label}</p>
                <ul className="flex flex-col">
                  {links.map(({ href, label: linkLabel }) => (
                    <li key={linkLabel}>
                      <Link href={href} className="text-paper-3 text-[11px] hover:text-gold-lt transition-colors opacity-90 hover:opacity-100 leading-snug block py-1.5">
                        {linkLabel}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>

        {/* Bottom micro bar */}
        <div className="mt-3 pt-3 border-t border-gold border-opacity-15 flex flex-col sm:flex-row items-center justify-between gap-1 text-[10px] text-paper-3 opacity-90">
          <p>© {new Date().getFullYear()} Mithila Jodi. All rights reserved.</p>
          <p>India only · No data transferred outside India</p>
        </div>
      </div>

      {/* Bottom Madhubani strip — 120 alternating maroon blocks under a gold
          thread, drawn by CSS (it was 122 SVG nodes on every page). */}
      <div
        aria-hidden="true"
        className="h-2 w-full"
        style={{
          background:
            'linear-gradient(to bottom, transparent 62.5%, rgba(185,138,46,0.6) 62.5%, rgba(185,138,46,0.6) calc(62.5% + 1px), transparent calc(62.5% + 1px)), repeating-linear-gradient(90deg, #6B0A0A 0 0.8333%, #8A1414 0.8333% 1.6667%)',
        }}
      />
    </footer>
  )
}
