import type { Metadata } from 'next'
import Link from 'next/link'
import '@/styles/about.css'
import { MithilaHeader } from '@/components/home/MithilaHeader'
import { MithilaFooter } from '@/components/home/MithilaFooter'
import { MobileBottomNav } from '@/components/home/MobileBottomNav'
import { HeroConnection, StoryLine } from './AboutVisuals'
import { SITE_URL } from '@/lib/constants'
import {
  breadcrumbJsonLd, canonicalUrl, faqJsonLd, jsonLdScript, organizationJsonLd, ORGANIZATION_ID, pageMetadata,
} from '@/lib/seo'

/*
 * About — what Mithila Jodi is, in one read: a matrimonial platform for the
 * Mithila and Maithili community. Digital Profile, biodata, the marriage and
 * astrology tools and invitations are presented as SUPPORTING the matrimonial
 * journey, never as products of their own — keep that hierarchy if this page
 * changes. Redesigned 2026-10-07 from the owner's brief.
 */

const DEFINITION =
  'Mithila Jodi is a matrimonial platform for the Mithila and Maithili community, bringing matchmaking, digital matrimonial profiles, marriage biodata and practical wedding-related tools together in one place.'

export const metadata: Metadata = pageMetadata({
  path: '/about',
  title: 'About — Matrimony for the Mithila & Maithili Community',
  socialTitle: 'About Mithila Jodi — a matrimonial platform made for Mithila',
  description:
    'Mithila Jodi is a matrimonial platform for the Mithila and Maithili community — matchmaking, digital profiles, marriage biodata and wedding tools in one place.',
})

// Mithila Jodi has a single founder, and this page is the ONE place the site
// states who it is — search engines and AI assistants should read it from here.
// Only what has been stated about her is asserted: name, role, and that she is
// an MBA student at NMIMS. There is no approved photo, so the card uses initials.
const FOUNDER = { name: 'Resham Chaudhary', role: 'Founder · Mithila Jodi', credential: 'MBA Student · NMIMS' }

const FAQ = [
  {
    q: 'What is Mithila Jodi?',
    a: 'Mithila Jodi is a matrimonial platform for individuals and families connected to the Mithila and Maithili community.',
  },
  {
    q: 'Who is Mithila Jodi for?',
    a: 'Mithila Jodi is designed for individuals and families connected to Mithila and the Maithili community, wherever they live today.',
  },
  {
    q: 'Is Mithila Jodi free?',
    a: 'Yes. Mithila Jodi is currently free for members, including profile creation, searching, interests and messaging.',
  },
  {
    q: 'What makes Mithila Jodi different from other matrimonial platforms?',
    a: 'Mithila Jodi combines matrimonial matchmaking with Mithila-specific details such as Gotra, Maternal Gotra, Mool and Native Village, along with digital profiles, marriage biodata and practical wedding-related tools.',
  },
  {
    q: 'Why does Mithila Jodi have astrology tools?',
    a: 'Some Mithila and Indian families use Kundli, compatibility, Rashi, Nakshatra, Manglik and Vivah Muhurat information during the marriage process. Mithila Jodi provides these as supporting marriage-related tools, and relevant information can also be used when completing a Digital Profile.',
  },
]

// ─── Small line icons (one grid, one weight) ────────────────────────────────

const I = {
  roots: 'M12 21v-7m0 0c-3.5 0-6-2.6-6-6 2.7 0 4.8 1.3 6 3.4M12 14c3.5 0 6-2.6 6-6-2.7 0-4.8 1.3-6 3.4M12 11.4V3M8 21h8',
  family: 'M8 10a3 3 0 1 0 0-6 3 3 0 0 0 0 6Zm8 1a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5ZM2.5 20c.6-3.8 2.8-6 5.5-6s4.9 2.2 5.5 6M13.5 15.2c.8-.8 1.7-1.2 2.5-1.2 2.3 0 4.2 1.9 4.7 5',
  story: 'M7 3h10l3 3v15H4V3h3Zm2 7h6m-6 4h6m-6 4h4',
  culture: 'M12 20c-2.6-1.9-4-4.3-4-7.2s1.4-5.4 4-7.3c2.6 1.9 4 4.4 4 7.3S14.6 18.1 12 20Zm0 0c-3.8 0-6.9-1.6-9-4.8 2.4-.9 4.6-.7 6.5.4M12 20c3.8 0 6.9-1.6 9-4.8-2.4-.9-4.6-.7-6.5.4',
  heart: 'M12 20s-7.5-4.6-7.5-10.2A4.3 4.3 0 0 1 12 7.2a4.3 4.3 0 0 1 7.5 2.6C19.5 15.4 12 20 12 20Z',
  profile: 'M7 2.5h10a2 2 0 0 1 2 2v15a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2v-15a2 2 0 0 1 2-2Zm5 9a2.8 2.8 0 1 0 0-5.6 2.8 2.8 0 0 0 0 5.6ZM8.5 17c.6-2 1.9-3 3.5-3s2.9 1 3.5 3',
  biodata: 'M14 2.5H6.5a2 2 0 0 0-2 2v15a2 2 0 0 0 2 2h11a2 2 0 0 0 2-2V8L14 2.5Zm0 0V8h5.5M8.5 13h7m-7 3.5h5',
  stars: 'M12 3l1.6 4.4L18 9l-4.4 1.6L12 15l-1.6-4.4L6 9l4.4-1.6L12 3Zm6.5 11l.8 2.2 2.2.8-2.2.8-.8 2.2-.8-2.2-2.2-.8 2.2-.8.8-2.2Z',
  invite: 'M3.5 6.5h17v11h-17v-11Zm.5.5 8 6 8-6',
  choose: 'M5 12.5 9.5 17 19 7.5',
  share: 'M17 8a3 3 0 1 0 0-6 3 3 0 0 0 0 6ZM7 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6Zm10 7a3 3 0 1 0 0-6 3 3 0 0 0 0 6ZM9.6 13.5l4.8 3M14.4 6.5l-4.8 3',
  lock: 'M6 11h12v9.5H6V11Zm2.5 0V8a3.5 3.5 0 0 1 7 0v3',
  arrow: 'M5 12h14m-6-6 6 6-6 6',
}

function Icon({ d, className = 'h-5 w-5' }: { d: string; className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.6} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" className={className}>
      <path d={d} />
    </svg>
  )
}

function Eyebrow({ children, center = false }: { children: React.ReactNode; center?: boolean }) {
  return (
    <p className={`flex items-center gap-3 text-[11px] font-semibold uppercase tracking-[0.28em] text-terra ${center ? 'justify-center' : ''}`}>
      <span className="h-px w-6 bg-gold/70" aria-hidden="true" />
      {children}
      {center && <span className="h-px w-6 bg-gold/70" aria-hidden="true" />}
    </p>
  )
}

const H2 = 'font-serif text-[28px] leading-[1.15] text-maroon sm:text-[36px]'

// ─── Content ─────────────────────────────────────────────────────────────────

const DIFFERENCE = [
  {
    icon: I.roots,
    title: 'Roots',
    chips: ['Gotra', 'Maternal Gotra', 'Mool', 'Native Village'],
    body: 'The family and ancestral details that can matter when families consider a matrimonial match.',
  },
  { icon: I.family, title: 'Family', body: 'A matrimonial experience designed with family involvement in mind.' },
  { icon: I.story, title: 'Your Story', body: 'Digital Profile and marriage biodata that let you present yourself in the way that feels right for you and your family.' },
  { icon: I.culture, title: 'Culture', body: "A platform that keeps Mithila's traditions and cultural identity close to the experience." },
]

const SUPPORTING = [
  {
    icon: I.profile,
    title: 'Digital Profile',
    href: '/digital-profile',
    body: 'Create a beautiful, shareable matrimonial profile with the personal, family and Mithila-specific details you choose to share.',
  },
  {
    icon: I.biodata,
    title: 'Marriage Biodata',
    href: '/marriage-biodata',
    body: 'Create a polished marriage biodata in English, Hindi, Maithili or Sanskrit.',
  },
  {
    icon: I.stars,
    title: 'Marriage & Astrology Tools',
    href: '/astrology',
    body: 'Explore information commonly used during the marriage journey — including Kundli, compatibility, Rashi, Nakshatra, Manglik and Vivah Muhurat.',
    note: 'These tools are part of the matrimonial journey, not a separate astrology service. Relevant information can also help you complete selected details in your Digital Profile.',
  },
  {
    icon: I.invite,
    title: 'Wedding Invitations',
    href: '/marriage-invitation',
    body: 'Create and share a beautiful digital invitation when your matrimonial journey becomes a wedding celebration.',
  },
]

const ROOTS = [
  { hi: 'गोत्र', en: 'Gotra' },
  { hi: 'मातृक गोत्र', en: 'Maternal Gotra' },
  { hi: 'मूल', en: 'Mool' },
  { hi: 'ग्राम', en: 'Native Village' },
  { hi: 'परिवार', en: 'Family' },
  { hi: 'संस्कार', en: 'Values' },
]
const MODERN = ['Digital Profile', 'Online Biodata', 'Family Sharing', 'Marriage Tools', 'Digital Invitations']

const PRIVACY = [
  { icon: I.choose, title: 'You choose what to share', body: 'Control the information you include in your profile.' },
  { icon: I.share, title: 'You choose how to share it', body: 'Use your profile, biodata or shareable profile link.' },
  { icon: I.lock, title: 'You stay in control', body: 'Use available privacy settings and control shareable profile links.' },
]

const FOUNDER_CHIPS = ['Vision & Direction', 'Mithila Community', 'Product Experience', 'Trust & Privacy']

const jsonLd = {
  '@context': 'https://schema.org',
  '@graph': [
    organizationJsonLd(),
    {
      '@type': 'AboutPage',
      '@id': `${canonicalUrl('/about')}#webpage`,
      url: canonicalUrl('/about'),
      name: 'About Mithila Jodi',
      description: DEFINITION,
      inLanguage: 'en-IN',
      isPartOf: { '@id': `${SITE_URL}/#website` },
      about: { '@id': ORGANIZATION_ID },
      mainEntity: { '@id': ORGANIZATION_ID },
    },
    // The single statement of who founded Mithila Jodi.
    {
      '@type': 'Person',
      '@id': `${canonicalUrl('/about')}#founder`,
      name: FOUNDER.name,
      jobTitle: 'Founder',
      worksFor: { '@id': ORGANIZATION_ID },
      affiliation: { '@type': 'CollegeOrUniversity', name: 'NMIMS' },
      url: canonicalUrl('/about'),
    },
    { '@type': 'Organization', '@id': ORGANIZATION_ID, founder: { '@id': `${canonicalUrl('/about')}#founder` } },
    { ...breadcrumbJsonLd([{ name: 'Home', path: '/' }, { name: 'About', path: '/about' }]), '@context': undefined },
    { ...faqJsonLd(FAQ), '@context': undefined },
  ],
}

// ─── Page ────────────────────────────────────────────────────────────────────

export default function AboutPage() {
  return (
    <div className="flex min-h-screen flex-col overflow-x-clip bg-paper">
      <script type="application/ld+json" dangerouslySetInnerHTML={jsonLdScript(jsonLd)} />
      <MithilaHeader />

      <main id="main-content" className="flex-1">
        {/* ── 1. Hero ── */}
        <section aria-labelledby="about-h1" className="relative bg-[radial-gradient(ellipse_70%_60%_at_85%_30%,#FBEEDF,transparent_70%)] pb-12 pt-6 sm:pb-16 sm:pt-10">
          <div className="wrap px-5 sm:px-6">
            <nav aria-label="Breadcrumb" className="mb-6 sm:mb-8">
              <ol className="flex items-center gap-2 text-[12.5px] text-ink-soft">
                <li><Link href="/" className="hover:text-maroon">Home</Link></li>
                <li aria-hidden="true" className="text-gold">›</li>
                <li aria-current="page" className="font-medium text-maroon">About</li>
              </ol>
            </nav>
            <div className="grid items-center gap-8 lg:grid-cols-[1.1fr_0.9fr] lg:gap-12">
              <div>
                <Eyebrow>About Mithila Jodi</Eyebrow>
                <h1 id="about-h1" className="mt-4 font-display text-[38px] leading-[1.06] text-maroon sm:text-[52px] lg:text-[58px]">
                  Made for Mithila.
                  <span className="block text-[#9A6F1E]">Made for meaningful beginnings.</span>
                </h1>
                <p className="mt-5 max-w-xl text-[16px] leading-relaxed text-ink sm:text-[18px]">{DEFINITION}</p>
                <div className="mt-7 flex flex-col gap-3 sm:flex-row sm:items-center">
                  <Link href="/register?start=1" className="btn-primary justify-center gap-2 rounded-full px-6 py-3.5 text-[15.5px]">
                    Create Your Free Profile<Icon d={I.arrow} className="h-4 w-4" />
                  </Link>
                  <Link href="/explore" className="btn justify-center gap-2 rounded-full border border-maroon/35 bg-cream px-6 py-3.5 text-[15.5px] font-semibold text-maroon hover:bg-white">
                    Explore Mithila Jodi<Icon d={I.arrow} className="h-4 w-4" />
                  </Link>
                </div>
                <p className="mt-5 text-[13px] text-ink-soft">
                  Private by design <span className="text-gold" aria-hidden="true">·</span> Free to join <span className="text-gold" aria-hidden="true">·</span> Built for Mithila families
                </p>
              </div>
              <HeroConnection />
            </div>
          </div>
        </section>

        {/* ── 2. Why ── */}
        <section aria-labelledby="about-why" className="border-y border-gold/15 bg-cream py-14 sm:py-20">
          <div className="wrap grid items-center gap-10 px-5 sm:px-6 lg:grid-cols-[1.15fr_0.85fr] lg:gap-16">
            <div data-mj-reveal>
              <Eyebrow>Why Mithila Jodi</Eyebrow>
              <h2 id="about-why" className={`mt-4 ${H2}`}>Marriage is more than two profiles.</h2>
              <p className="mt-5 max-w-xl text-[16px] leading-relaxed text-ink-soft sm:text-[17px]">
                For many Mithila families, finding a life partner is also about understanding family, roots, values and
                traditions. Mithila Jodi was created to bring those considerations into a modern matrimonial experience —
                without losing the cultural context that makes them meaningful.
              </p>
            </div>
            <StoryLine />
          </div>
        </section>

        {/* ── 3. What makes it different ── */}
        <section aria-labelledby="about-different" className="py-14 sm:py-20">
          <div className="wrap px-5 sm:px-6">
            <div className="max-w-2xl" data-mj-reveal>
              <Eyebrow>Built with Mithila in mind</Eyebrow>
              <h2 id="about-different" className={`mt-4 ${H2}`}>The details that matter, thoughtfully included.</h2>
            </div>
            <div data-mj-stagger className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {DIFFERENCE.map(c => (
                <article key={c.title} className="group rounded-[18px] border border-gold/25 bg-[#FFFBF3] p-5 shadow-mj-xs transition duration-300 hover:-translate-y-0.5 hover:border-gold/55 motion-reduce:hover:translate-y-0">
                  <span className="grid h-10 w-10 place-items-center rounded-full border border-gold/30 bg-paper-2 text-maroon transition-transform duration-300 group-hover:-translate-y-0.5 group-hover:rotate-[-6deg] motion-reduce:transform-none">
                    <Icon d={c.icon} />
                  </span>
                  <h3 className="mt-4 font-serif text-[20px] text-maroon">{c.title}</h3>
                  {c.chips && (
                    <p className="mt-2 text-[12.5px] font-semibold leading-relaxed tracking-wide text-[#8A6516]">
                      {c.chips.join(' · ')}
                    </p>
                  )}
                  <p className="mt-2 text-[14px] leading-relaxed text-ink-soft">{c.body}</p>
                </article>
              ))}
            </div>
          </div>
        </section>

        {/* ── 4. Ecosystem — matrimony first, everything else in support ── */}
        <section aria-labelledby="about-ecosystem" className="border-t border-gold/15 bg-[#FBF3E6] py-14 sm:py-20">
          <div className="wrap px-5 sm:px-6">
            <div className="max-w-2xl" data-mj-reveal>
              <Eyebrow>More than a matrimonial profile</Eyebrow>
              <h2 id="about-ecosystem" className={`mt-4 ${H2}`}>Everything around your matrimonial journey.</h2>
              <p className="mt-4 text-[16px] leading-relaxed text-ink-soft">
                Mithila Jodi brings together the tools that can be useful throughout the matrimonial and wedding journey.
              </p>
            </div>

            <div className="mt-8 grid gap-4 lg:grid-cols-[0.95fr_1.6fr]">
              {/* Primary */}
              <article data-mj-reveal className="relative flex flex-col overflow-hidden rounded-[20px] bg-maroon-gradient p-6 text-cream shadow-mj-sm sm:p-7">
                <span className="pointer-events-none absolute -right-10 -top-10 h-40 w-40 rounded-full border border-gold-lt/20" aria-hidden="true" />
                <span className="pointer-events-none absolute -right-4 -top-4 h-28 w-28 rounded-full border border-gold-lt/20" aria-hidden="true" />
                <span className="text-[10.5px] font-semibold uppercase tracking-[0.26em] text-gold-lt">At the heart of it</span>
                <span className="mt-4 grid h-11 w-11 place-items-center rounded-full border border-gold-lt/40 text-gold-lt"><Icon d={I.heart} className="h-6 w-6" /></span>
                <h3 className="mt-4 font-serif text-[26px] leading-tight">Mithila Matrimony</h3>
                <p className="mt-2 text-[15px] leading-relaxed text-cream/90">
                  Find meaningful matrimonial connections with people and families connected to Mithila.
                </p>
                <div className="mt-6 flex flex-wrap gap-x-5 gap-y-2 lg:mt-auto lg:pt-6">
                  <Link href="/explore" className="inline-flex items-center gap-1.5 text-[14.5px] font-semibold text-gold-lt hover:text-cream">
                    Browse profiles<Icon d={I.arrow} className="h-4 w-4" />
                  </Link>
                  <Link href="/register?start=1" className="inline-flex items-center gap-1.5 text-[14.5px] font-semibold text-cream/85 hover:text-cream">
                    Join free<Icon d={I.arrow} className="h-4 w-4" />
                  </Link>
                </div>
              </article>

              {/* Supporting */}
              <div data-mj-stagger className="grid gap-4 sm:grid-cols-2">
                {SUPPORTING.map(s => (
                  <article key={s.title} className="group relative flex flex-col rounded-[18px] border border-gold/25 bg-cream p-5 shadow-mj-xs transition duration-300 hover:-translate-y-0.5 hover:border-gold/55 motion-reduce:hover:translate-y-0">
                    <div className="flex items-center gap-3">
                      <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-paper-2 text-maroon transition-transform duration-300 group-hover:-translate-y-0.5 motion-reduce:transform-none">
                        <Icon d={s.icon} className="h-[18px] w-[18px]" />
                      </span>
                      <h3 className="font-serif text-[18px] leading-tight text-maroon">
                        {/* The heading carries the link; the ::after makes the whole card tappable. */}
                        <Link href={s.href} className="after:absolute after:inset-0 after:rounded-[18px] focus-visible:outline-none focus-visible:after:ring-2 focus-visible:after:ring-maroon/40">
                          {s.title}
                        </Link>
                      </h3>
                      <Icon d={I.arrow} className="ml-auto h-4 w-4 shrink-0 text-gold transition-transform group-hover:translate-x-0.5" />
                    </div>
                    <p className="mt-3 text-[14px] leading-relaxed text-ink-soft">{s.body}</p>
                    {s.note && (
                      <p className="mt-3 border-t border-gold/20 pt-3 text-[12.5px] italic leading-relaxed text-ink-soft">{s.note}</p>
                    )}
                  </article>
                ))}
              </div>
            </div>

            <p className="mt-6 text-[14px] text-ink-soft">
              And around it all, <span className="font-semibold text-ink">Mithila Culture</span> — festivals, traditions, songs and heritage.{' '}
              <Link href="/festivals" className="inline-flex items-center gap-1 font-semibold text-maroon underline-offset-2 hover:underline">
                Explore Mithila culture<Icon d={I.arrow} className="h-3.5 w-3.5" />
              </Link>
            </p>
          </div>
        </section>

        {/* ── 5. Tradition → Modern ── */}
        <section aria-labelledby="about-tradition" className="py-14 sm:py-20">
          <div className="wrap px-5 sm:px-6">
            <div className="mx-auto max-w-2xl text-center" data-mj-reveal>
              <h2 id="about-tradition" className={H2}>
                Our roots are traditional.
                <span className="block text-[#9A6F1E]">Our experience doesn&apos;t have to be.</span>
              </h2>
              <p className="mt-4 text-[16px] leading-relaxed text-ink-soft">
                The details Mithila families have always valued stay at the centre. What changes is how easily they can be
                shared.
              </p>
            </div>

            <div data-mj-reveal className="mx-auto mt-10 grid max-w-4xl items-center gap-0 md:grid-cols-[1fr_auto_1fr]">
              <div className="ab-roots rounded-[20px] border border-gold/35 bg-[#FFFBF3] p-6 shadow-mj-xs">
                <p className="text-[11px] font-semibold uppercase tracking-[0.26em] text-[#8A6516]">Mithila Roots</p>
                <ul className="mt-4 grid grid-cols-2 gap-x-4 gap-y-3">
                  {ROOTS.map(r => (
                    <li key={r.en} className="flex flex-col leading-tight">
                      <span lang="hi" className="font-deva text-[19px] text-maroon">{r.hi}</span>
                      <span className="text-[12px] text-ink-soft">{r.en}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* The bridge: across on wide screens, down on phones */}
              <div aria-hidden="true" className="ab-bridge flex flex-col items-center justify-center py-2 md:flex-row md:px-3 md:py-0">
                <span className="ab-bridge-y block h-8 w-px bg-gradient-to-b from-gold/30 to-gold md:hidden" />
                <span className="ab-bridge-x hidden h-px w-12 bg-gradient-to-r from-gold/30 to-gold md:block" />
                <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full border border-gold/60 bg-cream text-maroon shadow-mj-xs">
                  <Icon d={I.arrow} className="h-4 w-4 rotate-90 md:rotate-0" />
                </span>
              </div>

              <div className="ab-modern rounded-[20px] border border-maroon/15 bg-cream p-6 shadow-mj-sm">
                <p className="text-[11px] font-semibold uppercase tracking-[0.26em] text-maroon">Modern Experience</p>
                <ul className="mt-4 flex flex-col gap-2.5">
                  {MODERN.map(m => (
                    <li key={m} className="flex items-center gap-2.5 text-[15px] text-ink">
                      <span className="h-1.5 w-1.5 rotate-45 bg-gold" aria-hidden="true" />{m}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </section>

        {/* ── 6. Privacy ── */}
        <section aria-labelledby="about-privacy" className="border-y border-gold/15 bg-cream py-14 sm:py-16">
          <div className="wrap grid gap-8 px-5 sm:px-6 lg:grid-cols-[0.9fr_1.4fr] lg:items-center lg:gap-12">
            <div data-mj-reveal>
              <h2 id="about-privacy" className={H2}>Your story belongs to you.</h2>
              <p className="mt-4 text-[16px] leading-relaxed text-ink-soft">
                Mithila Jodi is designed to give members control over the information they choose to include and share.
              </p>
              <Link href="/safety" className="mt-5 inline-flex items-center gap-1.5 text-[15px] font-semibold text-maroon hover:underline hover:underline-offset-4">
                Learn more about Safety &amp; Privacy<Icon d={I.arrow} className="h-4 w-4" />
              </Link>
            </div>
            <ol data-mj-stagger className="grid gap-3 sm:grid-cols-3">
              {PRIVACY.map((p, i) => (
                <li key={p.title} className="rounded-[16px] border border-gold/25 bg-[#FFFBF3] p-4 sm:p-5">
                  <div className="flex items-center gap-3 sm:flex-col sm:items-start">
                    <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-maroon text-cream"><Icon d={p.icon} className="h-[18px] w-[18px]" /></span>
                    <h3 className="text-[15px] font-semibold leading-snug text-ink">
                      <span className="sr-only">{i + 1}. </span>{p.title}
                    </h3>
                  </div>
                  <p className="mt-2 text-[13.5px] leading-relaxed text-ink-soft">{p.body}</p>
                </li>
              ))}
            </ol>
          </div>
        </section>

        {/* ── 7. Founder ── */}
        <section aria-labelledby="about-founder" className="py-14 sm:py-20">
          <div className="wrap px-5 sm:px-6">
            <div className="text-center" data-mj-reveal>
              <Eyebrow center>The person behind Mithila Jodi</Eyebrow>
              <h2 id="about-founder" className={`mt-4 ${H2}`}>Meet the Founder</h2>
            </div>

            <article data-mj-reveal className="relative mx-auto mt-8 max-w-4xl overflow-hidden rounded-[22px] border border-gold/35 bg-[#FFFBF3] shadow-mj-sm">
              <div className="h-[3px] bg-gradient-to-r from-maroon-deep/20 via-gold to-maroon-deep/20" aria-hidden="true" />
              <div className="grid gap-6 p-6 sm:p-8 md:grid-cols-[auto_1fr] md:gap-9">
                <div className="flex items-center gap-4 md:flex-col md:items-start">
                  <span className="grid h-[84px] w-[84px] shrink-0 place-items-center rounded-full bg-maroon-gradient font-serif text-[28px] font-bold text-gold-lt ring-[3px] ring-gold/60 ring-offset-[3px] ring-offset-[#FFFBF3] sm:h-[104px] sm:w-[104px] sm:text-[34px]" aria-hidden="true">
                    RC
                  </span>
                  <div>
                    <h3 className="font-serif text-[22px] leading-tight text-maroon">{FOUNDER.name}</h3>
                    <p className="mt-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-[#8A6516]">{FOUNDER.role}</p>
                    <p className="mt-1 text-[13px] text-ink-soft">{FOUNDER.credential}</p>
                  </div>
                </div>

                <div className="min-w-0">
                  <blockquote className="relative border-l-2 border-gold/60 pl-4 font-serif text-[18px] italic leading-snug text-maroon sm:text-[20px]">
                    “Mithila deserves a matrimonial experience shaped around the way its families actually approach marriage.”
                  </blockquote>
                  <div className="mt-5 space-y-3 text-[15px] leading-relaxed text-ink-soft">
                    <p>
                      Resham Chaudhary is the founder of Mithila Jodi and an MBA student at NMIMS. She built Mithila Jodi with
                      a simple vision: to create a matrimonial platform for Mithila and Maithili families that understands the
                      details that matter in their marriage journey — from gotra, mool and native roots to family involvement
                      and the way biodata is shared.
                    </p>
                    <p>Her vision is to bring these traditions into a modern digital experience without losing the cultural context behind them.</p>
                  </div>
                  <ul className="mt-5 flex flex-wrap gap-2" aria-label="Focus areas">
                    {FOUNDER_CHIPS.map(c => (
                      <li key={c} className="rounded-full border border-gold/35 bg-cream px-3 py-1 text-[12px] font-medium text-ink">{c}</li>
                    ))}
                  </ul>
                </div>
              </div>
            </article>
          </div>
        </section>

        {/* ── 8. FAQ ── */}
        <section aria-labelledby="about-faq" className="border-t border-gold/15 bg-[#FBF3E6] py-14 sm:py-20">
          <div className="wrap max-w-3xl px-5 sm:px-6">
            <div className="text-center" data-mj-reveal>
              <h2 id="about-faq" className={H2}>A little more about Mithila Jodi</h2>
            </div>
            <div className="mt-8 divide-y divide-gold/20 overflow-hidden rounded-[18px] border border-gold/30 bg-cream">
              {FAQ.map((f, i) => (
                <details key={f.q} className="ab-faq group" {...(i === 0 ? { open: true } : {})}>
                  <summary className="flex min-h-[56px] cursor-pointer list-none items-center gap-4 px-5 py-4 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-maroon/40">
                    <h3 className="flex-1 text-[15.5px] font-semibold leading-snug text-ink sm:text-[16px]">{f.q}</h3>
                    <span className="ab-faq-plus grid h-7 w-7 shrink-0 place-items-center rounded-full border border-gold/40 text-maroon transition-transform duration-200" aria-hidden="true">
                      <svg viewBox="0 0 24 24" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round"><path d="M12 5v14M5 12h14" /></svg>
                    </span>
                  </summary>
                  <p className="px-5 pb-5 text-[15px] leading-relaxed text-ink-soft">{f.a}</p>
                </details>
              ))}
            </div>
          </div>
        </section>

        {/* ── 9. Final CTA ── */}
        <section aria-labelledby="about-final" className="py-14 sm:py-16">
          <div className="wrap px-5 sm:px-6">
            <div data-mj-reveal className="mx-auto max-w-2xl rounded-[22px] border border-gold/35 bg-cream px-6 py-9 text-center shadow-mj-xs sm:px-10">
              <h2 id="about-final" className="font-display text-[30px] leading-[1.12] text-maroon sm:text-[38px]">
                <span className="block">Your roots.</span>
                <span className="block text-[#9A6F1E]">Your family.</span>
                <span className="block">Your journey.</span>
              </h2>
              <p className="mt-3 text-[16px] text-ink-soft">Find meaningful connections with Mithila Jodi.</p>
              <Link href="/register?start=1" className="btn-primary mt-6 inline-flex gap-2 rounded-full px-7 py-3.5 text-[15.5px]">
                Create Your Free Profile<Icon d={I.arrow} className="h-4 w-4" />
              </Link>
              <p className="mt-3 text-[12.5px] text-ink-soft">Currently free for all members</p>
            </div>
          </div>
        </section>
      </main>

      <MithilaFooter className="pb-16 lg:pb-0" />
      <MobileBottomNav />
    </div>
  )
}
