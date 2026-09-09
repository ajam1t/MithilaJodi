import Link from 'next/link'
import Image from 'next/image'
import { INSTAGRAM_URL, WHATSAPP_COMMUNITY_URL } from '@/lib/constants'
import { WhatsAppIcon } from '@/components/whatsapp/JoinCommunity'

const GROUPS = [
  {
    label: 'Platform',
    links: [
      { href: '/explore', label: 'Browse Profiles' },
      { href: '/register', label: 'Create Free Account' },
      { href: '/login', label: 'Login' },
      { href: '/about', label: 'About' },
      { href: '/#stories', label: 'Family & Values' },
    ],
  },
  {
    label: 'Explore',
    links: [
      { href: '/marriage-biodata', label: 'Marriage Biodata' },
      { href: '/festivals', label: 'Mithila Festivals' },
      { href: '/festival-songs', label: 'Festival Songs' },
      { href: '/marriage-invitation', label: 'Invitation Card' },
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
export function MithilaFooter({ className = '' }: { className?: string }) {
  return (
    <footer className={`bg-maroon-deep ${className}`} role="contentinfo">
      {/* Gold top border */}
      <div className="h-[3px] bg-gradient-to-r from-maroon-deep via-gold to-maroon-deep" aria-hidden="true" />

      {/* Compact main area */}
      <div className="wrap py-4">
        {/* Community channels. `target="_blank"` with `rel="noopener noreferrer"`
            so the new tab cannot reach back into this one via window.opener.
            The WhatsApp pill sits beside Instagram in the same treatment rather
            than as a separate block — they are the same kind of link. */}
        <div className="flex flex-wrap justify-center gap-2 mb-3.5">
          <a
            href={INSTAGRAM_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 rounded-pill border border-gold/40 bg-maroon/40 px-4 py-1.5
                       text-[12.5px] font-medium text-paper-3 hover:text-cream hover:border-gold transition-colors
                       focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold-lt"
          >
            <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" className="shrink-0">
              <path d="M12 2.16c3.2 0 3.58.01 4.85.07 1.17.05 1.8.25 2.23.41.56.22.96.48 1.38.9.42.42.68.82.9 1.38.16.42.36 1.06.41 2.23.06 1.27.07 1.65.07 4.85s-.01 3.58-.07 4.85c-.05 1.17-.25 1.8-.41 2.23-.22.56-.48.96-.9 1.38-.42.42-.82.68-1.38.9-.42.16-1.06.36-2.23.41-1.27.06-1.65.07-4.85.07s-3.58-.01-4.85-.07c-1.17-.05-1.8-.25-2.23-.41-.56-.22-.96-.48-1.38-.9-.42-.42-.68-.82-.9-1.38-.16-.42-.36-1.06-.41-2.23-.06-1.27-.07-1.65-.07-4.85s.01-3.58.07-4.85c.05-1.17.25-1.8.41-2.23.22-.56.48-.96.9-1.38.42-.42.82-.68 1.38-.9.42-.16 1.06-.36 2.23-.41 1.27-.06 1.65-.07 4.85-.07M12 0C8.74 0 8.33.01 7.05.07 5.78.13 4.9.33 4.14.63c-.79.31-1.46.72-2.13 1.38C1.35 2.68.94 3.35.63 4.14.33 4.9.13 5.78.07 7.05.01 8.33 0 8.74 0 12s.01 3.67.07 4.95c.06 1.27.26 2.15.56 2.91.31.79.72 1.46 1.38 2.13.67.66 1.34 1.07 2.13 1.38.76.3 1.64.5 2.91.56C8.33 23.99 8.74 24 12 24s3.67-.01 4.95-.07c1.27-.06 2.15-.26 2.91-.56.79-.31 1.46-.72 2.13-1.38.66-.67 1.07-1.34 1.38-2.13.3-.76.5-1.64.56-2.91.06-1.28.07-1.69.07-4.95s-.01-3.67-.07-4.95c-.06-1.27-.26-2.15-.56-2.91-.31-.79-.72-1.46-1.38-2.13C21.32 1.35 20.65.94 19.86.63 19.1.33 18.22.13 16.95.07 15.67.01 15.26 0 12 0z" />
              <path d="M12 5.84A6.16 6.16 0 1 0 18.16 12 6.16 6.16 0 0 0 12 5.84zm0 10.16A4 4 0 1 1 16 12a4 4 0 0 1-4 4z" />
              <circle cx="18.41" cy="5.59" r="1.44" />
            </svg>
            Join us on Instagram
          </a>

          <a
            href={WHATSAPP_COMMUNITY_URL}
            target="_blank"
            rel="noopener noreferrer nofollow"
            aria-label="Join Mithila Jodi WhatsApp Community"
            className="inline-flex items-center gap-2 rounded-pill border border-gold/40 bg-maroon/40 px-4 py-1.5
                       text-[12.5px] font-medium text-paper-3 hover:text-cream hover:border-gold transition-colors
                       focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold-lt"
          >
            <WhatsAppIcon size={15} />
            WhatsApp Community
          </a>
        </div>
        {/* Top: brand + nav groups */}
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
          {/* Brand — compact on mobile */}
          <div className="flex sm:flex-col items-center sm:items-start gap-3 sm:gap-0 flex-shrink-0">
            <Link href="/" className="inline-block sm:mb-1.5">
              <Image
                src="/logo.png"
                alt="Mithila Jodi"
                width={40}
                height={40}
                loading="lazy"
                className="h-10 w-auto object-contain rounded"
              />
            </Link>
            <div>
              <p className="font-deva text-paper-3 text-[12px] opacity-80 leading-snug">जहाँ परम्परा मिले, प्रेम से</p>
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

      {/* Bottom Madhubani strip */}
      <div aria-hidden="true">
        <svg viewBox="0 0 1200 8" xmlns="http://www.w3.org/2000/svg" className="w-full h-2" preserveAspectRatio="none">
          {Array.from({ length: 120 }, (_, i) => (
            <rect key={i} x={i * 10} y={0} width={10} height={8} fill={i % 2 === 0 ? '#7A1220' : '#9B2233'} />
          ))}
          <line x1="0" y1="5" x2="1200" y2="5" stroke="#B98A2E" strokeWidth="1" opacity="0.6" />
        </svg>
      </div>
    </footer>
  )
}
