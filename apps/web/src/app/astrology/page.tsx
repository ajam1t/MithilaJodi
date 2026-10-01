import Link from 'next/link'
import { MithilaHeader } from '@/components/home/MithilaHeader'
import { MithilaFooter } from '@/components/home/MithilaFooter'
import { SITE_URL } from '@/lib/constants'
import {
  pageMetadata,
  breadcrumbJsonLd,
  organizationJsonLd,
  organizationRef,
  jsonLdScript,
  webAppJsonLd,
} from '@/lib/seo'

export const metadata = pageMetadata({
  path: '/astrology',
  title: 'Vedic Astrology Tools for Mithila Matrimony',
  description:
    'Kundli matching, nakshatra, rashi, Manglik check, Janam Kundli, and vivah muhurat — Vedic Jyotish tools rooted in Mithila tradition. Free for everyone.',
  keywords: [
    'kundli match mithila',
    'kundli matching maithili',
    'nakshatra calculator',
    'rashi calculator',
    'manglik check',
    'janam kundli online',
    'vivah muhurat 2025',
    'ashtakoota matching',
    'vedic astrology mithila',
    'horoscope matching maithili',
  ],
})

const jsonLd = [
  {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'WebPage',
        '@id': `${SITE_URL}/astrology#webpage`,
        url: `${SITE_URL}/astrology`,
        name: 'Vedic Astrology Tools for Mithila Matrimony | Mithila Jodi',
        description:
          'Kundli matching, nakshatra, rashi, Manglik check, and vivah muhurat tools rooted in Mithila Jyotish tradition.',
        breadcrumb: { '@id': `${SITE_URL}/astrology#breadcrumb` },
        publisher: organizationRef(),
        inLanguage: 'en',
      },
      breadcrumbJsonLd([
        { name: 'Home', path: '/' },
        { name: 'Astrology Tools', path: '/astrology' },
      ]),
      webAppJsonLd({
        name: 'Mithila Jodi Astrology Tools',
        path: '/astrology',
        description:
          'Vedic Jyotish tools for Mithila matrimony — Kundli Match, Nakshatra, Rashi, Manglik, and more.',
        languages: ['en'],
      }),
      organizationJsonLd(),
    ],
  },
]

const TOOLS = [
  {
    href: '/astrology/kundli-match',
    label: 'Kundli Match',
    tagline: 'Ashtakoota — 36 points across 8 kootas',
    description:
      'Match two horoscopes using the Ashtakoota system. See Varna, Vashya, Tara, Yoni, Graha Maitri, Gana, Bhakoot, and Nadi scores individually — with a full Manglik analysis.',
    primary: true,
    status: 'coming-soon' as const,
    relatedPost: null,
  },
  {
    href: '/astrology/nakshatra',
    label: 'Nakshatra',
    tagline: 'Find your Janma Nakshatra',
    description:
      'Determine the birth star from date, time, and place. Understand its lord, characteristics, and significance in Mithila kundli tradition.',
    primary: false,
    status: 'coming-soon' as const,
    relatedPost: { href: '/blogs/horoscope-marriage/what-is-nakshatra', label: 'What is Nakshatra?' },
  },
  {
    href: '/astrology/manglik',
    label: 'Manglik Check',
    tagline: 'Understand Manglik dosha from the birth chart',
    description:
      'See which house Mars occupies, what it signifies in traditional Mithila kundli practice, and how Manglik status is assessed — with full transparency.',
    primary: false,
    status: 'coming-soon' as const,
    relatedPost: { href: '/blogs/horoscope-marriage/what-is-manglik', label: 'What is Manglik dosha?' },
  },
  {
    href: '/astrology/janam-kundli',
    label: 'Janam Kundli',
    tagline: 'Your birth chart in the Vedic tradition',
    description:
      'Generate planetary positions across the 12 rashis, ascendant (Lagna), and key kundli information using a proper astronomical ephemeris.',
    primary: false,
    status: 'coming-soon' as const,
    relatedPost: { href: '/blogs/horoscope-marriage/kundli-matching-explained', label: 'How kundli matching works' },
  },
  {
    href: '/astrology/rashi',
    label: 'Rashi',
    tagline: 'Find your Moon sign',
    description:
      'Determine your Janma Rashi — the Moon\'s sign at the moment of birth — from your date, time, and place of birth.',
    primary: false,
    status: 'coming-soon' as const,
    relatedPost: { href: '/blogs/horoscope-marriage/what-is-rashi', label: 'What is Rashi?' },
  },
  {
    href: '/astrology/vivah-muhurat',
    label: 'Vivah Muhurat',
    tagline: 'Auspicious dates for marriage',
    description:
      'Find marriage dates that align with the traditional Panchanga — Tithi, Vara, Nakshatra, Yoga, and Karana — combined with planetary considerations for the couple.',
    primary: false,
    status: 'coming-soon' as const,
    relatedPost: null,
  },
  {
    href: '/astrology/baby-names',
    label: 'Baby Names',
    tagline: 'Name syllables from Janma Nakshatra',
    description:
      'Find traditional name-starting syllables (Aksharas) for a newborn based on their Janma Nakshatra and Pada, as per authentic Jyotish tradition.',
    primary: false,
    status: 'coming-soon' as const,
    relatedPost: null,
  },
  {
    href: '/astrology/compatibility',
    label: 'Compatibility',
    tagline: 'Broader Vedic compatibility analysis',
    description:
      'A wider compatibility reading — Rashi compatibility, Guna Milan principles, and other Vedic factors considered alongside Ashtakoota matching.',
    primary: false,
    status: 'coming-soon' as const,
    relatedPost: null,
  },
]

const BLOG_POSTS = [
  { href: '/blogs/horoscope-marriage/kundli-matching-explained', label: 'Kundli Matching Explained — How the Ashtakoota System Works' },
  { href: '/blogs/horoscope-marriage/what-is-manglik', label: 'What is Manglik Dosha and How is it Assessed?' },
  { href: '/blogs/horoscope-marriage/what-is-nakshatra', label: 'What is Nakshatra? The Role of Birth Stars in Mithila Matching' },
  { href: '/blogs/horoscope-marriage/what-is-rashi', label: 'What is Rashi? Understanding Moon Signs in Vedic Astrology' },
]

export default function AstrologyHubPage() {
  return (
    <div className="min-h-screen flex flex-col bg-paper overflow-x-clip">
      <script type="application/ld+json" dangerouslySetInnerHTML={jsonLdScript(...jsonLd)} />
      <MithilaHeader />

      <main id="main-content" className="flex-1">

        {/* ── Cosmic hero ── */}
        <section className="bg-cosmic-deep py-16 sm:py-24 relative overflow-hidden">
          {/* Subtle star dots — purely decorative, aria-hidden */}
          <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden="true">
            {[
              { top: '12%', left: '8%', size: 1.5 },
              { top: '25%', left: '88%', size: 1 },
              { top: '60%', left: '5%', size: 1 },
              { top: '75%', left: '92%', size: 1.5 },
              { top: '40%', left: '95%', size: 1 },
              { top: '15%', left: '55%', size: 1 },
              { top: '85%', left: '40%', size: 1 },
              { top: '50%', left: '20%', size: 1.5 },
            ].map((s, i) => (
              <div
                key={i}
                className="absolute rounded-full bg-gold/30"
                style={{ top: s.top, left: s.left, width: s.size, height: s.size }}
              />
            ))}
          </div>

          <div className="wrap max-w-3xl text-center relative z-10">
            <nav aria-label="Breadcrumb" className="mb-8">
              <ol className="flex items-center justify-center gap-2 text-[12px] text-paper-3/60">
                <li><Link href="/" className="hover:text-gold-lt transition-colors">Home</Link></li>
                <li aria-hidden="true" className="text-gold/40">›</li>
                <li className="text-gold-lt font-medium" aria-current="page">Astrology Tools</li>
              </ol>
            </nav>

            <p className="inline-flex items-center gap-1.5 text-[11px] uppercase tracking-[0.2em] font-semibold text-marigold mb-5">
              <svg width="12" height="12" viewBox="0 0 12 12" fill="currentColor" aria-hidden="true">
                <polygon points="6 0 7.6 4.2 12 4.6 8.8 7.4 9.8 12 6 9.6 2.2 12 3.2 7.4 0 4.6 4.4 4.2 6 0" />
              </svg>
              Vedic Jyotish
            </p>

            <h1 className="font-serif text-cream text-3xl sm:text-4xl lg:text-5xl leading-snug mb-5">
              Astrology Tools
            </h1>

            <div className="mx-auto w-16 h-px bg-gradient-to-r from-transparent via-gold to-transparent mb-6" aria-hidden="true" />

            <p className="text-paper-3/80 text-[16px] sm:text-[17px] leading-relaxed max-w-2xl mx-auto">
              Vedic Jyotish tools rooted in Mithila tradition — Kundli matching, Nakshatra, Rashi,
              Manglik dosha, and more. Each tool uses a documented, deterministic methodology.
              Free for everyone, no login required.
            </p>
          </div>
        </section>

        {/* ── Tools grid ── */}
        <section className="bg-paper py-14 sm:py-20" aria-labelledby="tools-heading">
          <div className="wrap max-w-5xl">
            <div className="text-center mb-10">
              <p className="eyebrow mb-2">Jyotish toolkit</p>
              <h2 id="tools-heading" className="section-heading text-2xl sm:text-3xl">
                Eight Tools, One Platform
              </h2>
              <div className="ornament-line w-16 mx-auto mt-3" />
            </div>

            {/* Primary tool — Kundli Match */}
            {TOOLS.filter(t => t.primary).map(tool => (
              <Link
                key={tool.href}
                href={tool.href}
                className="group block card card-hover p-6 sm:p-8 mb-6 border border-gold/30 bg-cosmic-mid text-cream relative overflow-hidden"
              >
                <div className="absolute top-4 right-4">
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-pill bg-gold/15 border border-gold/30 text-gold-lt text-[10px] font-semibold tracking-[0.12em] uppercase">
                    <svg width="9" height="9" viewBox="0 0 12 12" fill="currentColor" aria-hidden="true">
                      <polygon points="6 0 7.6 4.2 12 4.6 8.8 7.4 9.8 12 6 9.6 2.2 12 3.2 7.4 0 4.6 4.4 4.2 6 0" />
                    </svg>
                    Primary Tool · Coming Soon
                  </span>
                </div>
                <div className="mb-4 flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-gold/20 border border-gold/30 flex items-center justify-center shrink-0">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#E4C572" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                      <circle cx="12" cy="12" r="10" />
                      <path d="M12 2a10 10 0 0 1 0 20A10 10 0 0 1 12 2" />
                      <line x1="2" y1="12" x2="22" y2="12" />
                      <path d="M12 2a15 15 0 0 1 0 20" />
                      <path d="M12 2a15 15 0 0 0 0 20" />
                    </svg>
                  </div>
                  <div>
                    <h3 className="font-serif text-cream text-xl group-hover:text-gold-lt transition-colors">{tool.label}</h3>
                    <p className="font-serif italic text-gold-lt/80 text-[13px]">{tool.tagline}</p>
                  </div>
                </div>
                <p className="text-paper-3/80 text-[15px] leading-relaxed max-w-2xl">{tool.description}</p>
                <div className="mt-5 flex items-center gap-1.5 text-gold-lt text-[13px] font-medium group-hover:gap-2.5 transition-all">
                  Learn more
                  <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                    <path d="M3 8h10M8 3l5 5-5 5" />
                  </svg>
                </div>
              </Link>
            ))}

            {/* Secondary tools — 2-column grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-5">
              {TOOLS.filter(t => !t.primary).map(tool => (
                <Link key={tool.href} href={tool.href} className="group block card card-hover p-5 border border-gold/10">
                  <div className="flex items-start gap-3 mb-3">
                    <div className="w-8 h-8 rounded-full bg-maroon/8 border border-gold/20 flex items-center justify-center shrink-0 mt-0.5">
                      <svg width="14" height="14" viewBox="0 0 12 12" fill="none" stroke="#B98A2E" strokeWidth="1.4" strokeLinecap="round" aria-hidden="true">
                        <polygon points="6 0 7.6 4.2 12 4.6 8.8 7.4 9.8 12 6 9.6 2.2 12 3.2 7.4 0 4.6 4.4 4.2 6 0" />
                      </svg>
                    </div>
                    <div>
                      <div className="flex items-center gap-2 flex-wrap mb-0.5">
                        <h3 className="font-serif text-maroon text-[16px] group-hover:text-terra transition-colors">{tool.label}</h3>
                        <span className="text-[9px] uppercase tracking-[0.1em] text-ink-soft/60 font-medium border border-ink-soft/20 rounded-sm px-1.5 py-0.5">
                          Coming Soon
                        </span>
                      </div>
                      <p className="font-serif italic text-terra text-[12px]">{tool.tagline}</p>
                    </div>
                  </div>
                  <p className="text-ink-soft text-[13px] leading-relaxed mb-3">{tool.description}</p>
                  {tool.relatedPost && (
                    <p className="text-[11px] text-maroon/70 hover:text-maroon transition-colors">
                      → {tool.relatedPost.label}
                    </p>
                  )}
                </Link>
              ))}
            </div>
          </div>
        </section>

        {/* ── About our approach ── */}
        <section className="bg-cream py-14 sm:py-16" aria-labelledby="approach-heading">
          <div className="wrap max-w-3xl">
            <p className="eyebrow mb-2">Our approach</p>
            <h2 id="approach-heading" className="section-heading text-2xl mb-6">
              Grounded in Mithila Jyotish tradition
            </h2>
            <div className="space-y-5 text-ink-soft text-[15px] leading-relaxed">
              <p>
                Jyotish — Vedic astrology — has been part of Mithila matrimonial practice for centuries.
                Families consult kundlis not as a superstitious ritual but as a structured framework
                for understanding compatibility: how the planetary positions at two people&apos;s
                births align with the ancient Ashtakoota system, whether Manglik dosha is present
                and balanced, and whether the broader chart suggests a harmonious partnership.
              </p>
              <p>
                Mithila Jodi approaches these tools with the same seriousness. Every calculation will
                be documented, deterministic, and transparent. The methodology — which ayanamsha is
                used, which house system, which Manglik rules — will be published on the site and
                confirmed by a Maithil pandit before any result goes live. No result will be presented
                as a guarantee; all are traditional guidance to inform family discussions, not replace them.
              </p>
              <p>
                The tools use a documented Vedic method: Lahiri ayanamsha (the Indian national standard),
                whole-sign houses, and the standard Ashtakoota weights (Varna 1, Vashya 2, Tara 3,
                Yoni 4, Graha Maitri 5, Gana 6, Bhakoot 7, Nadi 8 — total 36 points). The exact
                Manglik rules and score-band verdicts are being finalised before launch.
              </p>
            </div>
          </div>
        </section>

        {/* ── Related reading ── */}
        <section className="bg-paper py-12 sm:py-14" aria-labelledby="reading-heading">
          <div className="wrap max-w-3xl">
            <p className="eyebrow mb-2">From the blog</p>
            <h2 id="reading-heading" className="section-heading text-xl mb-6">
              Understand the concepts before the tools launch
            </h2>
            <ul className="flex flex-col gap-3" role="list">
              {BLOG_POSTS.map(({ href, label }) => (
                <li key={href}>
                  <Link
                    href={href}
                    className="group flex items-center gap-3 card p-4 hover:border-gold/30 transition-colors"
                  >
                    <div className="w-1.5 h-1.5 rounded-full bg-gold shrink-0" aria-hidden="true" />
                    <span className="text-ink text-[14px] group-hover:text-maroon transition-colors leading-snug">{label}</span>
                    <svg width="12" height="12" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="shrink-0 ml-auto text-gold/60 group-hover:text-maroon transition-colors" aria-hidden="true">
                      <path d="M3 8h10M8 3l5 5-5 5" />
                    </svg>
                  </Link>
                </li>
              ))}
            </ul>
            <div className="mt-6">
              <Link href="/blogs/horoscope-marriage" className="text-maroon text-[13px] hover:text-terra transition-colors underline underline-offset-4 decoration-gold/40">
                See all horoscope &amp; marriage articles →
              </Link>
            </div>
          </div>
        </section>

        {/* ── CTA ── */}
        <section className="bg-cream py-12 sm:py-16">
          <div className="wrap max-w-2xl text-center">
            <p className="eyebrow mb-3">While the tools are being built</p>
            <h2 className="section-heading text-2xl mb-4">Start your matrimonial journey</h2>
            <p className="text-ink-soft text-[15px] leading-relaxed mb-8 max-w-lg mx-auto">
              Create your profile on Mithila Jodi today. Your rashi, nakshatra, gotra, and family
              details are all part of the profile — ready when the kundli tools go live.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/register" className="btn-primary">Create Your Profile Free</Link>
              <Link href="/explore" className="btn-ghost">Browse Profiles</Link>
            </div>
          </div>
        </section>

      </main>

      <MithilaFooter className="pb-16 lg:pb-0" />
    </div>
  )
}
