import Link from 'next/link'

const GROUPS = [
  {
    label: 'Platform',
    links: [
      { href: '/register', label: 'Create Free Account' },
      { href: '/login', label: 'Login' },
      { href: '/#how', label: 'About' },
      { href: '/#stories', label: 'Family & Values' },
    ],
  },
  {
    label: 'Explore',
    links: [
      { href: '/#biodata', label: 'Marriage Biodata' },
      { href: '/blogs', label: 'Blogs' },
      { href: '/help', label: 'Help & Support' },
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

export function MithilaFooter() {
  return (
    <footer className="bg-maroon-deep" role="contentinfo">
      {/* Gold top border */}
      <div className="h-[3px] bg-gradient-to-r from-maroon-deep via-gold to-maroon-deep" aria-hidden="true" />

      {/* Compact main area */}
      <div className="wrap py-6">
        {/* Desktop: logo + nav groups in one row. Mobile: stacked */}
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-6">
          {/* Brand */}
          <div className="flex-shrink-0">
            <Link href="/" className="inline-block mb-2">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/logo.png" alt="Mithila Jodi" className="h-16 w-auto object-contain rounded" />
            </Link>
            <p className="font-deva text-paper-3 text-[13px] opacity-80 leading-snug">जहाँ परम्परा मिले, प्रेम से</p>
            <p className="font-serif text-paper-3 text-[11px] italic opacity-60 mt-0.5">Where tradition meets love.</p>
          </div>

          {/* Nav groups — desktop horizontal, mobile stacked */}
          <div className="flex flex-col sm:flex-row gap-5 sm:gap-8">
            {GROUPS.map(({ label, links }) => (
              <div key={label}>
                <p className="text-gold text-[11px] font-semibold tracking-widest uppercase mb-2 opacity-80">{label}</p>
                <ul className="flex flex-col gap-1.5">
                  {links.map(({ href, label: linkLabel }) => (
                    <li key={linkLabel}>
                      <Link href={href} className="text-paper-3 text-[12px] hover:text-gold-lt transition-colors opacity-75 hover:opacity-100 leading-snug">
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
        <div className="mt-5 pt-4 border-t border-gold border-opacity-15 flex flex-col sm:flex-row items-center justify-between gap-1.5 text-[11px] text-paper-3 opacity-50">
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
