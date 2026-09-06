import Link from 'next/link'
import { MithilaHeader } from '@/components/home/MithilaHeader'
import { MithilaFooter } from '@/components/home/MithilaFooter'
import { MobileBottomNav } from '@/components/home/MobileBottomNav'
import { ExploreGrid } from './ExploreGrid'
import { getPublicShowcaseProfiles } from '@/lib/publicProfiles'
import type { SearchCard } from '@/types/profile'
import { pageMetadata, breadcrumbJsonLd, canonicalUrl, jsonLdScript } from '@/lib/seo'

// Server-render the curated showcase on each request so the first meaningful
// profile content is present in the initial HTML (crawlable, no JS required).
export const dynamic = 'force-dynamic'

export const metadata = pageMetadata({
  path: '/explore',
  title: 'Mithila Matrimonial Profiles — Maithil Brides & Grooms',
  description:
    'Browse Maithil brides and grooms featured on Mithila Jodi. Profiles show gotra, mool and native place. Create a free account to search the full community and send an interest.',
  keywords: [
    'Mithila matrimonial profiles', 'Maithil bride', 'Maithil groom',
    'Mithila bride', 'Mithila groom', 'Mithila matrimony', 'Maithil matrimony',
  ],
})

/**
 * The public window onto the community.
 *
 * Only the admin-curated showcase appears here, and only profiles the member set
 * to 'public'. The projection in lib/publicProfiles masks the surname to an
 * initial and drops free-text and every private field — no date of birth, phone,
 * email, address, family or horoscope detail reaches this page. Individual member
 * profiles live under the authenticated area and are noindex; nothing here links
 * a search engine to one.
 */
export default async function ExplorePage() {
  let initialProfiles: SearchCard[] = []
  let loadError = false
  try {
    initialProfiles = await getPublicShowcaseProfiles()
  } catch {
    loadError = true
  }

  const breadcrumb = breadcrumbJsonLd([
    { name: 'Mithila Jodi', path: '/' },
    { name: 'Mithila Matrimonial Profiles', path: '/explore' },
  ])

  // CollectionPage rather than ItemList: the page is a curated selection that
  // changes, and asserting a fixed list of people would be a claim about
  // individuals that this projection deliberately does not make.
  const collection = {
    '@context': 'https://schema.org',
    '@type': 'CollectionPage',
    name: 'Mithila Matrimonial Profiles',
    url: canonicalUrl('/explore'),
    description:
      'Featured Maithil brides and grooms on Mithila Jodi, shown with gotra, mool and native place.',
    inLanguage: 'en-IN',
    isPartOf: { '@type': 'WebSite', name: 'Mithila Jodi', url: canonicalUrl('/') },
    about: { '@type': 'Thing', name: 'Mithila and Maithil community matrimonial matching' },
  }

  return (
    <div className="min-h-screen flex flex-col bg-paper overflow-x-clip">
      <script type="application/ld+json" dangerouslySetInnerHTML={jsonLdScript(breadcrumb, collection)} />

      <MithilaHeader />
      <main id="main-content" className="flex-1">
        <section className="wrap py-8 sm:py-12" aria-labelledby="explore-heading">
          <header className="text-center mb-8 max-w-2xl mx-auto">
            <h1 id="explore-heading" className="font-serif text-2xl sm:text-3xl text-maroon">
              Mithila Matrimonial Profiles
            </h1>
            <p className="text-sm sm:text-base text-ink-soft mt-2 leading-relaxed">
              Maithil brides and grooms featured from our community, shown the way Mithila families
              read a profile — <span className="text-maroon">gotra, mool and native place</span> first.
              Surnames are shortened and contact details are never shown here.
            </p>
          </header>

          <ExploreGrid initialProfiles={initialProfiles} initialError={loadError} />
        </section>

        {/* Explanatory copy and internal links sit BELOW the profiles, so the
            product stays the first thing on the page. */}
        <section className="wrap pb-10 sm:pb-14" aria-labelledby="explore-about-heading">
          <div className="max-w-2xl mx-auto">
            <h2 id="explore-about-heading" className="font-serif text-maroon text-[19px] sm:text-[22px] leading-tight">
              Matrimonial matching built for the Mithila community
            </h2>
            <p className="text-ink-soft text-[14px] leading-relaxed mt-2.5">
              Most matrimonial sites treat gotra, mool and ancestral village as afterthoughts, which
              is why Maithil families end up asking for them over the phone anyway. On Mithila Jodi
              they are part of the profile and part of the matching, alongside age, education,
              location and the timeline each family has in mind.
            </p>
            <p className="text-ink-soft text-[14px] leading-relaxed mt-2.5">
              The profiles above are a small featured selection. Members can search the full
              community by gotra, mool, gram, native district and city — and every match carries a
              score that explains itself rather than showing a bare percentage.
            </p>

            <h3 className="font-serif text-maroon text-[16px] leading-tight mt-5">
              Start without an account
            </h3>
            <ul className="mt-2 space-y-1.5 text-[14px]">
              <li>
                <Link href="/marriage-biodata" className="text-maroon hover:underline underline-offset-2">
                  Create a Mithila marriage biodata
                </Link>
                <span className="text-ink-soft"> — free, in Maithili, Hindi, English or Sanskrit, with a PDF to download.</span>
              </li>
              <li>
                <Link href="/marriage-invitation" className="text-maroon hover:underline underline-offset-2">
                  Design a Mithila wedding invitation card
                </Link>
                <span className="text-ink-soft"> — Madhubani-inspired designs you can share on WhatsApp.</span>
              </li>
              <li>
                <Link href="/about" className="text-maroon hover:underline underline-offset-2">
                  Read how Mithila Jodi works
                </Link>
                <span className="text-ink-soft"> — who it is for and how families are involved.</span>
              </li>
              <li>
                <Link href="/safety" className="text-maroon hover:underline underline-offset-2">
                  See how profiles are verified and kept private
                </Link>
                <span className="text-ink-soft"> — mobile verification, photo review and reporting.</span>
              </li>
            </ul>

            <p className="text-[14px] text-ink-soft leading-relaxed mt-5">
              <Link href="/register" className="text-maroon font-semibold hover:underline underline-offset-2">
                Create a free Mithila Jodi account
              </Link>{' '}
              to search every profile, send an interest and share your biodata with families directly.
            </p>
          </div>
        </section>
      </main>
      <MithilaFooter className="pb-16 lg:pb-0" />
      <MobileBottomNav />
    </div>
  )
}
