import type { Metadata } from 'next'
import Link from 'next/link'
import { MithilaHeader } from '@/components/home/MithilaHeader'
import { MithilaFooter } from '@/components/home/MithilaFooter'
import { MithilaBorder } from '@/components/home/MithilaBorder'
import { TeamSection, type TeamMemberData } from './TeamSection'
import { createAdminClient } from '@/lib/supabase/server'
import { SITE_URL } from '@/lib/constants'

export const dynamic = 'force-dynamic'

const SITE = SITE_URL

export const metadata: Metadata = {
  title: 'About Mithila Jodi — Maithili Matrimonial Platform',
  description:
    'Learn about Mithila Jodi — a matrimonial platform built for the Mithila (Maithili) community of India. Discover our story, how the platform works, what makes it different, and the team behind it.',
  alternates: { canonical: `${SITE}/about` },
  openGraph: {
    type: 'website',
    url: `${SITE}/about`,
    siteName: 'Mithila Jodi',
    title: 'About Mithila Jodi — Maithili Matrimonial Platform',
    description:
      'A matrimonial platform built for Mithila families — with gotra, maternal gotra, mool, marriage biodata in four languages, and family involvement at its core.',
    images: ['/hero-couple.jpg'],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'About Mithila Jodi — Maithili Matrimonial Platform',
    description: 'Built for the Mithila community of India. Learn about our platform, our approach, and our team.',
    images: ['/hero-couple.jpg'],
  },
}


const STEPS = [
  {
    n: '1',
    title: 'Create your profile',
    desc: 'Register with your Indian mobile number and build your profile with personal, family, and cultural details.',
  },
  {
    n: '2',
    title: 'Complete your biodata',
    desc: 'Generate a Mithila marriage biodata in English, Hindi, Maithili, or Sanskrit with gotra, mool, and family information.',
  },
  {
    n: '3',
    title: 'Discover suitable profiles',
    desc: 'Browse and search profiles with filters that matter to Mithila families — gotra, sub-caste, location, education, and more.',
  },
  {
    n: '4',
    title: 'Express interest',
    desc: 'Send an interest to a profile you find suitable. The other family receives a notification and can respond.',
  },
  {
    n: '5',
    title: 'Connect and involve families',
    desc: 'Once both sides express interest, families can connect, share biodata, and take the conversation forward in their own way.',
  },
]

const DIFFERENTIATORS = [
  {
    title: 'Mithila focused',
    desc: 'Built exclusively for the Mithila (Maithili) community — not a generic platform adapted to a community, but a platform designed from the ground up for it.',
  },
  {
    title: 'Gotra, Maternal Gotra & Mool',
    desc: 'Captures the lineage details that matter in Mithila marriage matching — gotra, maternal gotra (Nanihaal gotra), mool, kul, and native gram.',
  },
  {
    title: 'Marriage biodata',
    desc: 'Create a formal Mithila marriage biodata in English, Hindi, Maithili, or Sanskrit and download it as a PDF — ready to share with families.',
  },
  {
    title: 'Family involvement',
    desc: 'Designed for families, not just individuals. Privacy controls let you decide when and how much to share, and with whom.',
  },
  {
    title: 'Maithili cultural context',
    desc: 'Profile fields, language, and matching considerations are shaped by Mithila marriage traditions — not borrowed from unrelated communities.',
  },
  {
    title: 'Privacy focused',
    desc: 'Your full profile is shared only when you choose to. You control your visibility, and your contact details are never exposed to strangers.',
  },
]

const jsonLd = {
  '@context': 'https://schema.org',
  '@graph': [
    {
      '@type': 'WebPage',
      '@id': `${SITE}/about#webpage`,
      url: `${SITE}/about`,
      name: 'About Mithila Jodi — Maithili Matrimonial Platform',
      description:
        'Learn about Mithila Jodi, its mission, how the platform works, what makes it different for the Mithila community, and the team behind it.',
      breadcrumb: { '@id': `${SITE}/about#breadcrumb` },
      about: { '@id': `${SITE}/#organization` },
      inLanguage: 'en',
    },
    {
      '@type': 'BreadcrumbList',
      '@id': `${SITE}/about#breadcrumb`,
      itemListElement: [
        { '@type': 'ListItem', position: 1, name: 'Home', item: SITE },
        { '@type': 'ListItem', position: 2, name: 'About', item: `${SITE}/about` },
      ],
    },
    {
      '@type': 'Organization',
      '@id': `${SITE}/#organization`,
      name: 'Mithila Jodi',
      url: SITE,
      logo: { '@type': 'ImageObject', url: `${SITE}/logo.png` },
      slogan: 'जहाँ परम्परा मिले, प्रेम से | Where tradition meets love.',
      description:
        'A matrimonial platform for the Mithila (Maithili) community of India, offering marriage biodata creation in English, Hindi, Maithili and Sanskrit.',
      areaServed: { '@type': 'Country', name: 'India' },
    },
  ],
}

export default async function AboutPage() {
  let dbTeam: TeamMemberData[] = []
  try {
    const admin = await createAdminClient()
    const { data } = await admin
      .from('team_members')
      .select('id, display_name, role, bio, responsibilities, photo_storage_path')
      .eq('is_enabled', true)
      .order('display_order', { ascending: true })
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    dbTeam = ((data ?? []) as any[]) as TeamMemberData[]
  } catch {
    // TeamSection will fall back to static data
  }

  return (
    <div className="min-h-screen flex flex-col bg-paper overflow-x-clip">
      {/* eslint-disable-next-line react/no-danger */}
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <MithilaHeader />

      <main className="flex-1">

        {/* ── Hero ── */}
        <section className="bg-cream py-14 sm:py-20">
          <div className="wrap max-w-3xl text-center">
            <nav aria-label="Breadcrumb" className="mb-6">
              <ol className="flex items-center justify-center gap-2 text-[13px] text-ink-soft">
                <li><Link href="/" className="hover:text-maroon transition-colors">Home</Link></li>
                <li aria-hidden="true" className="text-gold">›</li>
                <li className="text-maroon font-medium" aria-current="page">About</li>
              </ol>
            </nav>
            <p className="eyebrow mb-3">Mithila Matrimonial Platform</p>
            <h1 className="section-heading text-3xl sm:text-4xl">About Mithila Jodi</h1>
            <div className="ornament-line w-20 mx-auto mt-4 mb-6" />
            <p className="text-ink-soft text-[17px] leading-relaxed max-w-2xl mx-auto">
              Mithila Jodi is a matrimonial platform built for the Mithila (Maithili) community of
              India. It exists to make matrimonial discovery, biodata creation, and family-to-family
              connection feel natural, dignified, and culturally grounded.
            </p>
          </div>
        </section>

        {/* ── About ── */}
        <section className="bg-paper py-14 sm:py-16">
          <div className="wrap max-w-3xl">
            <p className="eyebrow mb-2">Who we are</p>
            <h2 className="section-heading text-2xl mb-6">What is Mithila Jodi?</h2>

            <div className="space-y-5 text-ink-soft text-[16px] leading-relaxed">
              <p>
                Mithila Jodi is a matrimonial platform for Mithila families — families who trace their
                roots to the Mithila region of Bihar and speak Maithili as their mother tongue. The
                platform is designed around the specific way in which Mithila families approach
                marriage: with deep respect for family lineage, gotra compatibility, cultural customs,
                and the involvement of both families at every stage.
              </p>
              <p>
                Each profile on Mithila Jodi captures the details that matter in Mithila matrimonial
                matching — <strong className="text-ink">gotra</strong> (patrilineal lineage),{' '}
                <strong className="text-ink">maternal gotra</strong> (the lineage of the mother&apos;s
                family),{' '}
                <strong className="text-ink">mool</strong> (ancestral origin), native gram, sub-caste,
                and family background. These are not optional fields; they are central to how Mithila
                families make matrimonial decisions.
              </p>
              <p>
                The platform also provides a <strong className="text-ink">marriage biodata</strong>{' '}
                tool. Families can use their profile details to generate a formal biodata in English,
                Hindi, Maithili, or Sanskrit — and download it as a PDF to share privately with other
                families. Biodata remains a trusted, familiar format in Mithila matrimonial practice,
                and Mithila Jodi makes it easy to create one that reflects the community&apos;s
                expectations.
              </p>
              <p>
                Privacy is taken seriously. Profile visibility is controlled by the member. Contact
                details are never publicly exposed. Families choose when, what, and with whom to share.
              </p>
            </div>
          </div>
        </section>

        {/* ── Why ── */}
        <section className="bg-cream py-14 sm:py-16">
          <div className="wrap max-w-3xl">
            <p className="eyebrow mb-2">The problem we address</p>
            <h2 className="section-heading text-2xl mb-6">Why Mithila Jodi Exists</h2>

            <div className="space-y-5 text-ink-soft text-[16px] leading-relaxed mb-10">
              <p>
                Finding a suitable matrimonial match for a Mithila family is not simply a question of
                finding a compatible individual. It involves understanding family lineage, verifying
                gotra compatibility, considering native roots, and conducting a process that involves
                both families — not just two people.
              </p>
              <p>
                General matrimonial platforms are not built for this. They do not ask for gotra,
                maternal gotra, or mool. They do not produce Mithila-format biodatas. Their search
                filters and profile structures do not reflect Maithili marriage considerations. Families
                end up adapting an unsuitable tool to their needs — or relying entirely on local
                networks and intermediaries, which limits reach and introduces its own challenges.
              </p>
              <p>
                Mithila Jodi was created to address this gap. The platform gives Mithila families a
                dedicated space for matrimonial discovery that respects their process — where the
                cultural details that matter are captured from the start, where biodata creation is
                built in, and where families can engage on their own terms.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {[
                { title: 'Family first', body: 'The platform is designed for families, not just for individuals browsing profiles.' },
                { title: 'Cultural accuracy', body: 'Gotra, maternal gotra, mool, and Mithila marriage customs are built into the platform.' },
                { title: 'Family confidence', body: 'More information, structured biodata, and privacy controls give families more confidence.' },
              ].map(({ title, body }) => (
                <div key={title} className="card p-5">
                  <h3 className="font-serif text-maroon text-[16px] mb-2">{title}</h3>
                  <p className="text-ink-soft text-[14px] leading-relaxed">{body}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── Differentiators ── */}
        <section className="bg-paper py-14 sm:py-16">
          <div className="wrap max-w-4xl">
            <div className="text-center mb-10">
              <p className="eyebrow mb-2">Our approach</p>
              <h2 className="section-heading text-2xl">What Makes Mithila Jodi Different</h2>
              <div className="ornament-line w-16 mx-auto mt-3" />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {DIFFERENTIATORS.map(({ title, desc }) => (
                <div key={title} className="card p-5 flex flex-col gap-3">
                  <div className="w-8 h-px bg-gold" />
                  <h3 className="font-serif text-maroon text-[16px] leading-snug">{title}</h3>
                  <p className="text-ink-soft text-[14px] leading-relaxed flex-1">{desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <MithilaBorder variant="top" />

        {/* ── How it works ── */}
        <section className="bg-cream py-14 sm:py-16">
          <div className="wrap max-w-4xl">
            <div className="text-center mb-10">
              <p className="eyebrow mb-2">Getting started</p>
              <h2 className="section-heading text-2xl">How Mithila Jodi Works</h2>
              <div className="ornament-line w-16 mx-auto mt-3" />
            </div>
            <ol className="grid grid-cols-1 sm:grid-cols-5 gap-6">
              {STEPS.map(({ n, title, desc }, i) => (
                <li key={n} className="flex flex-col items-center text-center sm:items-start sm:text-left gap-3 relative">
                  {/* Connector line between steps (desktop) */}
                  {i < STEPS.length - 1 && (
                    <div className="hidden sm:block absolute top-5 left-[calc(50%+20px)] right-0 h-px bg-gold opacity-30" aria-hidden="true" />
                  )}
                  <div className="relative z-10 w-10 h-10 rounded-full bg-maroon flex items-center justify-center shrink-0">
                    <span className="font-serif text-gold text-sm font-bold">{n}</span>
                  </div>
                  <div>
                    <h3 className="font-serif text-maroon text-[15px] leading-snug mb-1">{title}</h3>
                    <p className="text-ink-soft text-[13px] leading-relaxed">{desc}</p>
                  </div>
                </li>
              ))}
            </ol>
            <div className="mt-10 text-center">
              <Link href="/register" className="btn-primary">Create a Free Profile</Link>
            </div>
          </div>
        </section>

        <MithilaBorder variant="bottom" />

        {/* ── Team ── */}
        <TeamSection dbMembers={dbTeam} />

        {/* ── CTA ── */}
        <section className="bg-cream py-12 sm:py-16">
          <div className="wrap max-w-2xl text-center">
            <p className="eyebrow mb-3">Start your journey</p>
            <h2 className="section-heading text-2xl mb-4">Find a match rooted in Mithila</h2>
            <p className="text-ink-soft text-[15px] leading-relaxed mb-8">
              Create a free profile, build your Mithila marriage biodata, and connect with families
              who share your cultural roots.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/register" className="btn-primary">Create Your Profile Free</Link>
              <Link href="/explore" className="btn-ghost">Browse Profiles</Link>
            </div>
          </div>
        </section>

      </main>

      <MithilaFooter />
    </div>
  )
}
