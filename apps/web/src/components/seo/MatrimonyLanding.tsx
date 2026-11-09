import Link from 'next/link'
import { MithilaHeader } from '@/components/home/MithilaHeader'
import { MithilaFooter } from '@/components/home/MithilaFooter'
import { MobileBottomNav } from '@/components/home/MobileBottomNav'
import { ExploreGrid } from '@/app/explore/ExploreGrid'
import { getPublicShowcaseProfiles } from '@/lib/publicProfiles'
import type { SearchCard } from '@/types/profile'
import { breadcrumbJsonLd, canonicalUrl, faqJsonLd, jsonLdScript } from '@/lib/seo'

/*
 * /maithil-brides and /maithil-grooms.
 *
 * Two pages for the two things families actually type into a search engine.
 * Each shows the featured profiles of that side only — the same consented,
 * admin-curated showcase as /explore, through the same privacy-safe projection
 * (lib/publicProfiles) — and then answers, in its own words, the questions a
 * family on that side of the search has. Nothing here states a member count, a
 * success rate or a verification claim the product does not make.
 */

export type LandingKind = 'brides' | 'grooms'

type Copy = {
  path: string
  gender: 'female' | 'male'
  h1: string
  lede: string
  gridHeading: string
  empty: string
  sections: Array<{ h: string; p: string[] }>
  faq: Array<{ q: string; a: string }>
  other: { href: string; label: string }
}

export const LANDING: Record<LandingKind, Copy> = {
  brides: {
    path: '/maithil-brides',
    gender: 'female',
    h1: 'Maithil Brides',
    lede: 'Profiles of Maithil brides, read the way a Mithila family reads them: gotra, mool and native place first, then education, work and where she lives now.',
    gridHeading: 'Featured brides',
    empty: 'Featured bride profiles appear here as members choose to be shown publicly.',
    sections: [
      {
        h: 'What a groom’s family looks for first',
        p: [
          'In a Maithil match the first questions are rarely about salary. They are about gotra and mool, the family’s ancestral village (gram), and how the two households are already connected. On most matrimonial sites those answers sit in a free-text box, if they are there at all. On Mithila Jodi each one is its own field on the profile, so you can search by it and see it on every card.',
          'A marriage within the same gotra (sagotra) is traditionally avoided. Search leaves sagotra profiles out by default once your own gotra is on your profile, and the match score never presents a sagotra pair as a good match.',
        ],
      },
      {
        h: 'How a bride’s privacy is kept',
        p: [
          'Many families are not comfortable with a daughter’s photograph and phone number being open to everyone, and they should not have to be. A member chooses who can see her photos — everyone, signed-in members only, her matches, or only people she approves one by one. Her phone number is never shown on a profile; contact details are shared only after both sides have accepted an interest and she has agreed to the request.',
          'Date of birth, address and family details are not shown on public pages such as this one. Any member can block or report a profile, and reports are reviewed by the Mithila Jodi team.',
        ],
      },
      {
        h: 'Parents and relatives can run the profile',
        p: [
          'A profile can be created by the bride herself or by a parent, sibling or relative on her behalf — the form asks who is filling it in. Families who prefer to share details the traditional way can send a Digital Profile link or a marriage biodata on WhatsApp instead of asking the other side to sign up.',
        ],
      },
    ],
    faq: [
      { q: 'Is it free to view and contact Maithil bride profiles?', a: 'Yes. Creating a profile, searching, sending interests and messaging accepted matches are free on Mithila Jodi. There are no paid plans at present.' },
      { q: 'Can I search brides by gotra, mool or village?', a: 'Yes. Signed-in members can filter by gotra, mool, gram, native district, current city, age, height, education, profession and marital status. Profiles of your own gotra are left out by default.' },
      { q: 'Why can’t I see a bride’s photo or phone number?', a: 'Each member decides who sees her photos, and may keep them for accepted matches or approve requests one at a time. Phone numbers are never displayed on a profile; they are shared only after a mutual match and her approval.' },
      { q: 'What is the minimum age for a bride’s profile?', a: 'Eighteen, India’s legal age of marriage for women. The date of birth is checked when the profile is created.' },
    ],
    other: { href: '/maithil-grooms', label: 'Looking for a groom? See Maithil grooms' },
  },
  grooms: {
    path: '/maithil-grooms',
    gender: 'male',
    h1: 'Maithil Grooms',
    lede: 'Profiles of Maithil grooms with what a bride’s family asks about first — gotra, mool and native place — alongside education, profession and the city he works in.',
    gridHeading: 'Featured grooms',
    empty: 'Featured groom profiles appear here as members choose to be shown publicly.',
    sections: [
      {
        h: 'Roots and work, on one card',
        p: [
          'A bride’s family usually wants two things answered together: where the family is from, and where the groom is settled now. Many Maithil grooms work far from Mithila — in Delhi, Mumbai, Bengaluru, Gujarat or abroad — while the family home is in Darbhanga, Madhubani, Saharsa or across the border in Janakpur. A profile here carries both: native district and ancestral village on one line, current city and profession on the next.',
          'Gotra and mool are separate fields rather than a note in the description, so a family can rule out a sagotra match before a single phone call. Search leaves your own gotra out by default.',
        ],
      },
      {
        h: 'A score that says why',
        p: [
          'Every profile a member sees carries a match score built from the things Maithil families weigh: gotra, roots, age, location, community, education, lifestyle and the timeline each side has in mind. The card lists what matched and what did not, so a high number is never a mystery and a sagotra pair is never shown as a good match.',
        ],
      },
      {
        h: 'From interest to a conversation between families',
        p: [
          'When a profile looks right, send an interest — with a short note if you wish. If the other side accepts, the two of you can message on Mithila Jodi, and either side can ask for the other’s contact details, which are shared only when the owner agrees. From there most families do what they have always done: the elders talk.',
          'If the groom’s family would rather send details than sign up, a Digital Profile link or a marriage biodata in Maithili, Hindi, English or Sanskrit can be shared on WhatsApp in a minute.',
        ],
      },
    ],
    faq: [
      { q: 'Is Mithila Jodi free for a groom’s or a bride’s family?', a: 'Yes, for both. Creating a profile, searching, sending interests and messaging accepted matches cost nothing, and there are no paid plans at present.' },
      { q: 'Can I find grooms from my native district who work in another city?', a: 'Yes. Signed-in members can filter by native district and by current city separately, and also by gotra, mool, gram, age, height, education, profession and marital status.' },
      { q: 'How do I know a profile is genuine?', a: 'Every account is tied to a mobile number confirmed by OTP, photographs are reviewed, and any member can report a profile for the team to look at. Mithila Jodi does not claim to have verified a member’s education, income or family details, so families should make their own enquiries as they would for any proposal.' },
      { q: 'What is the minimum age for a groom’s profile?', a: 'Twenty-one, India’s legal age of marriage for men. The date of birth is checked when the profile is created.' },
    ],
    other: { href: '/maithil-brides', label: 'Looking for a bride? See Maithil brides' },
  },
}

export async function MatrimonyLanding({ kind }: { kind: LandingKind }) {
  const c = LANDING[kind]
  let profiles: SearchCard[] = []
  let loadError = false
  try {
    profiles = (await getPublicShowcaseProfiles()).filter(p => p.gender === c.gender)
  } catch {
    loadError = true
  }

  const breadcrumb = breadcrumbJsonLd([
    { name: 'Mithila Jodi', path: '/' },
    { name: 'Mithila Matrimonial Profiles', path: '/explore' },
    { name: c.h1, path: c.path },
  ])
  const collection = {
    '@context': 'https://schema.org',
    '@type': 'CollectionPage',
    name: c.h1,
    url: canonicalUrl(c.path),
    description: c.lede,
    inLanguage: 'en-IN',
    isPartOf: { '@type': 'WebSite', name: 'Mithila Jodi', url: canonicalUrl('/') },
  }

  return (
    <div className="min-h-screen flex flex-col bg-paper overflow-x-clip">
      <script type="application/ld+json" dangerouslySetInnerHTML={jsonLdScript(breadcrumb, collection, faqJsonLd(c.faq))} />
      <MithilaHeader />
      <main id="main-content" className="flex-1">
        <section className="wrap py-8 sm:py-12" aria-labelledby="landing-heading">
          <nav aria-label="Breadcrumb" className="mb-5 text-[12.5px] text-ink-soft">
            <Link href="/" className="hover:text-maroon">Home</Link> <span aria-hidden="true">/</span>{' '}
            <Link href="/explore" className="hover:text-maroon">Profiles</Link> <span aria-hidden="true">/</span>{' '}
            <span className="text-maroon">{c.h1}</span>
          </nav>
          <header className="text-center mb-8 max-w-2xl mx-auto">
            <h1 id="landing-heading" className="font-serif text-[28px] sm:text-4xl text-maroon">{c.h1}</h1>
            <p className="text-[15px] sm:text-base text-ink-soft mt-3 leading-relaxed">{c.lede}</p>
            <div className="mt-5 flex flex-wrap items-center justify-center gap-3">
              <Link href="/register" className="btn-primary px-6 py-2.5 text-[14.5px]">Create a free profile</Link>
              <Link href="/explore" className="text-[14px] font-semibold text-maroon hover:underline underline-offset-2">See all featured profiles →</Link>
            </div>
            <p className="mt-3 text-[12.5px] text-ink-soft">Free to join. No paid plans. Phone numbers are never shown on a profile.</p>
          </header>

          <h2 className="font-serif text-maroon text-[19px] sm:text-[22px] text-center mb-5">{c.gridHeading}</h2>
          {profiles.length === 0 && !loadError ? (
            <div className="card p-8 text-center max-w-md mx-auto">
              <p className="text-sm text-ink-soft leading-relaxed">{c.empty}</p>
              <Link href="/register" className="mt-3 inline-block text-[14px] font-semibold text-maroon hover:underline">Join free to search every profile →</Link>
            </div>
          ) : (
            <ExploreGrid initialProfiles={profiles} initialError={loadError} />
          )}
        </section>

        <section className="wrap pb-10 sm:pb-14" aria-label={`About ${c.h1} on Mithila Jodi`}>
          <div className="max-w-2xl mx-auto">
            {c.sections.map(s => (
              <div key={s.h} className="mt-7 first:mt-0">
                <h2 className="font-serif text-maroon text-[19px] sm:text-[22px] leading-tight">{s.h}</h2>
                {s.p.map(t => <p key={t.slice(0, 24)} className="text-ink-soft text-[14.5px] leading-relaxed mt-2.5">{t}</p>)}
              </div>
            ))}

            <h2 className="font-serif text-maroon text-[19px] sm:text-[22px] leading-tight mt-9">Questions families ask</h2>
            <dl className="mt-3 divide-y divide-paper-3 border-y border-paper-3">
              {c.faq.map(f => (
                <div key={f.q} className="py-3.5">
                  <dt className="text-[15px] font-semibold text-ink">{f.q}</dt>
                  <dd className="mt-1.5 text-[14.5px] leading-relaxed text-ink-soft">{f.a}</dd>
                </div>
              ))}
            </dl>

            <h2 className="font-serif text-maroon text-[17px] leading-tight mt-8">Read next</h2>
            <ul className="mt-2 space-y-1.5 text-[14.5px]">
              <li><Link href={c.other.href} className="text-maroon hover:underline underline-offset-2">{c.other.label}</Link></li>
              <li><Link href="/gotra" className="text-maroon hover:underline underline-offset-2">Gotras of Mithila and the sagotra rule</Link></li>
              <li><Link href="/match-score" className="text-maroon hover:underline underline-offset-2">How the match score is worked out</Link></li>
              <li><Link href="/marriage-biodata" className="text-maroon hover:underline underline-offset-2">Make a marriage biodata in Maithili, Hindi, English or Sanskrit</Link></li>
              <li><Link href="/safety" className="text-maroon hover:underline underline-offset-2">Safety and privacy on Mithila Jodi</Link></li>
            </ul>

            <div className="mt-8 rounded-mj border border-gold/40 bg-cream p-5 text-center shadow-mj-xs">
              <p className="font-serif text-[19px] text-maroon">जहाँ परंपरा मिले, प्रेम से</p>
              <p className="mt-1.5 text-[14px] text-ink-soft">Create a profile in a few minutes — for yourself, or for a son, daughter, brother or sister.</p>
              <Link href="/register" className="btn-primary mt-3.5 inline-flex px-6 py-2.5 text-[14.5px]">Join Mithila Jodi free</Link>
            </div>
          </div>
        </section>
      </main>
      <MithilaFooter className="pb-16 lg:pb-0" />
      <MobileBottomNav />
    </div>
  )
}
