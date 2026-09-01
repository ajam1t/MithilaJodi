import type { Metadata } from 'next'
import Link from 'next/link'
import Image from 'next/image'

// Login / register / forgot-password are functional pages, not content.
// Keep them out of the search index.
export const metadata: Metadata = {
  robots: { index: false, follow: true },
}

const TRUST_POINTS = [
  {
    title: 'A community you can trust',
    body: 'Every member joins with a mobile-verified number. Profiles are reviewed with care.',
  },
  {
    title: 'Privacy, always respected',
    body: 'Your details stay within India and are shared only with matches you choose.',
  },
  {
    title: 'Families, together',
    body: 'Built for the way Mithila families find matches — with elders involved at every step.',
  },
]

/** Decorative Mithila brand panel shown beside the form on large screens. */
function BrandPanel() {
  return (
    <aside className="relative hidden lg:flex flex-col justify-between overflow-hidden bg-maroon-deep text-paper-2 p-12 xl:p-16">
      {/* Faint Madhubani lotus field */}
      <div className="absolute inset-0 pointer-events-none opacity-[0.18]" aria-hidden="true">
        <svg viewBox="0 0 400 700" className="w-full h-full" preserveAspectRatio="xMidYMid slice" fill="none">
          {[[70, 120, 46], [320, 90, 34], [200, 320, 54], [60, 520, 40], [330, 560, 44], [220, 660, 30]].map(
            ([cx, cy, r], gi) => (
              <g key={gi}>
                {[0, 45, 90, 135, 180, 225, 270, 315].map((a) => (
                  <ellipse
                    key={a}
                    cx={cx}
                    cy={cy}
                    rx={r * 0.34}
                    ry={r}
                    stroke="#E4C572"
                    strokeWidth="1"
                    transform={`rotate(${a} ${cx} ${cy})`}
                  />
                ))}
                <circle cx={cx} cy={cy} r={r * 0.28} fill="#E8912A" opacity="0.5" />
              </g>
            )
          )}
        </svg>
      </div>
      {/* Gold edge */}
      <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-maroon-deep via-gold-lt to-maroon-deep" aria-hidden="true" />

      <div className="relative">
        <Link href="/" className="inline-flex items-center gap-3" aria-label="Mithila Jodi — home">
          <Image
            src="/logo.png"
            alt=""
            width={48}
            height={48}
            priority
            className="h-12 w-auto object-contain"
          />
          <span className="flex flex-col leading-none">
            <span className="font-serif text-2xl text-cream">Mithila Jodi</span>
            <span className="font-deva text-[12px] text-gold-lt mt-1" lang="hi">जहाँ परम्परा मिले, प्रेम से</span>
          </span>
        </Link>
      </div>

      <div className="relative max-w-sm">
        <h2 className="font-serif text-[30px] leading-tight text-cream mb-8">
          Where tradition meets love.
        </h2>
        <ul className="space-y-5">
          {TRUST_POINTS.map((p) => (
            <li key={p.title} className="flex gap-3.5">
              <span className="mt-1 flex-shrink-0 w-6 h-6 rounded-full bg-gold-lt/15 border border-gold-lt/40 flex items-center justify-center">
                <svg width="12" height="12" viewBox="0 0 12 12" fill="none" aria-hidden="true">
                  <path d="M2.5 6.5l2.2 2.2L9.5 3.8" stroke="#E4C572" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </span>
              <div>
                <p className="font-serif text-[17px] text-gold-lt leading-snug">{p.title}</p>
                <p className="text-[13.5px] text-paper-2/70 leading-relaxed mt-0.5">{p.body}</p>
              </div>
            </li>
          ))}
        </ul>
      </div>

      <p className="relative text-[12.5px] text-paper-2/50 italic">
        A matrimonial platform for the Mithila community of India.
      </p>
    </aside>
  )
}

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-paper lg:grid lg:grid-cols-[1.05fr_1fr] xl:grid-cols-2">
      <BrandPanel />
      <main className="flex flex-col items-center justify-center px-4 py-8 sm:py-12">
        {children}
      </main>
    </div>
  )
}
