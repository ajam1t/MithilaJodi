import Link from 'next/link'
import { MithilaHeader } from '@/components/home/MithilaHeader'
import { MithilaFooter } from '@/components/home/MithilaFooter'
import { MobileBottomNav } from '@/components/home/MobileBottomNav'
import { GotraChecker } from '@/components/roots/GotraChecker'
import { GuideFaq } from '@/components/roots/GuideFaq'
import { GOTRAS } from '@/lib/mithilaRoots'
import { breadcrumbJsonLd, canonicalUrl, faqJsonLd, jsonLdScript, organizationJsonLd, pageMetadata } from '@/lib/seo'

export const metadata = pageMetadata({
  path: '/gotra',
  title: 'Maithil Gotra List — All 20 Mithila Gotras',
  description:
    'All 20 Maithil Brahmin gotras of the Mithila Panji in English and Devanagari, with a free gotra match checker for same-gotra and maternal-gotra rules.',
  keywords: [
    'maithil gotra list', 'maithil brahmin gotra', 'mithila gotra', 'gotra list', 'same gotra marriage',
    'sagotra marriage', 'gotra match checker', 'maternal gotra marriage', 'mithila panji gotra',
  ],
})

const FAQ = [
  {
    q: 'How many gotras are there in Mithila?',
    a: 'The Mithila Panji, the genealogical record kept for Maithil families, lists twenty gotras: Vatsa, Shandilya, Kashyapa, Parashara, Katyayana, Bharadwaja, Savarna, Gargya, Kaushika, Alambukasha, Krishnatreya, Gautama, Maudgalya, Vashishtha, Kaundinya, Upamanyu, Kapila, Vishnuvriddhi, Tandilya and Jatukarnya.',
  },
  {
    q: 'Can people with the same gotra marry in Mithila?',
    a: 'Traditionally, no. Two people with the same paternal gotra are counted as one lineage, so a sagotra match is avoided in Maithil practice. It is a custom, not a legal rule — the Hindu Marriage Act, 1955 does not mention gotra — and how strictly it is kept varies between families.',
  },
  {
    q: 'Does the maternal gotra matter?',
    a: 'In stricter practice, yes: one side’s paternal gotra should not be the other side’s maternal gotra. Many families treat this as something to discuss with elders rather than an automatic no. The checker on this page shows both checks.',
  },
  {
    q: 'Where should gotra appear on a marriage biodata?',
    a: 'Near the top, with maternal gotra, mool and gram beside it — they are the first things a Maithil family looks for. The free Mithila Jodi biodata maker places them there in English, Hindi, Maithili or Sanskrit.',
  },
]

export default function GotraHubPage() {
  const list = {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    name: 'Gotras of the Mithila Panji',
    numberOfItems: GOTRAS.length,
    itemListElement: GOTRAS.map((g, i) => ({ '@type': 'ListItem', position: i + 1, name: `${g.name} gotra`, url: canonicalUrl(`/gotra/${g.slug}`) })),
  }
  const crumbs = breadcrumbJsonLd([{ name: 'Mithila Jodi', path: '/' }, { name: 'Maithil Gotra List', path: '/gotra' }])

  return (
    <div className="min-h-screen flex flex-col bg-paper overflow-x-clip">
      <script type="application/ld+json" dangerouslySetInnerHTML={jsonLdScript(organizationJsonLd(), list, faqJsonLd(FAQ), crumbs)} />
      <MithilaHeader />
      <main id="main-content" className="flex-1">
        <section className="py-9 sm:py-12" style={{ background: 'radial-gradient(ellipse 90% 85% at 50% 0%, #FFFAF0 0%, #F5EBDD 100%)' }}>
          <div className="wrap max-w-3xl text-center">
            <p className="eyebrow !text-gold mb-2">✦ Mithila roots</p>
            <h1 className="font-serif text-maroon text-[27px] sm:text-[36px] leading-tight">Maithil Gotra List</h1>
            <p className="font-deva text-gold text-[17px] sm:text-[19px] mt-1.5" lang="hi">मैथिल गोत्र सूची</p>
            <div className="ornament-line w-16 mx-auto mt-3" />
            <p className="text-ink text-[15px] sm:text-[16px] leading-relaxed mt-4">
              The twenty gotras recorded in the Mithila Panji, in English and Devanagari — with a checker for the two
              traditional rules families apply before a match: no shared gotra, and no paternal gotra that is the other
              side’s maternal gotra.
            </p>
          </div>
        </section>

        <section className="wrap max-w-4xl py-9 sm:py-11">
          <h2 className="font-serif text-maroon text-[21px] sm:text-[25px] leading-tight">The 20 gotras</h2>
          <p className="text-ink-soft text-[14px] mt-1">Open a gotra for its lineage, its marriage rules and the gotras it can match with.</p>
          <ul className="mt-5 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
            {GOTRAS.map(g => (
              <li key={g.slug}>
                <Link href={`/gotra/${g.slug}`} className="card block px-4 py-3 h-full hover:border-gold transition-colors">
                  <span className="block font-serif text-maroon text-[17px] leading-tight">{g.name}</span>
                  <span className="block font-deva text-gold text-[15px] mt-0.5" lang="hi">{g.deva}</span>
                </Link>
              </li>
            ))}
          </ul>
        </section>

        <section className="wrap max-w-3xl pb-9 sm:pb-11">
          <GotraChecker />
        </section>

        <section className="bg-paper-2 py-9 sm:py-11">
          <div className="wrap max-w-3xl space-y-4 text-ink text-[15px] leading-relaxed">
            <h2 className="font-serif text-maroon text-[21px] sm:text-[25px] leading-tight">What a gotra is</h2>
            <p>
              A gotra is a lineage traced through the father’s line to an ancient rishi, so children carry their
              father’s gotra. Your <strong>maternal gotra</strong> is your mother’s father’s gotra — the line your
              mother was born into.
            </p>
            <p>
              In Mithila, gotra is read together with <Link href="/mool" className="text-maroon underline underline-offset-2">mool</Link>{' '}
              and gram — the family’s ancestral origin and village. Together they tell another family who you are and
              where your line comes from, which is why every Mithila Jodi profile and biodata shows them first.
            </p>
            <p>
              Read more in the Journal:{' '}
              <Link href="/blogs/gotra-family-lineage/what-is-gotra" className="text-maroon underline underline-offset-2">What is gotra?</Link>,{' '}
              <Link href="/blogs/gotra-family-lineage/what-is-maternal-gotra" className="text-maroon underline underline-offset-2">maternal gotra</Link> and{' '}
              <Link href="/blogs/gotra-family-lineage/same-gotra-marriage" className="text-maroon underline underline-offset-2">same-gotra marriage</Link>.
            </p>
          </div>
        </section>

        <section className="wrap max-w-3xl py-9 sm:py-11">
          <GuideFaq items={FAQ} />
        </section>

        <section className="bg-maroon-gradient py-9 sm:py-11">
          <div className="wrap max-w-2xl text-center">
            <h2 className="font-serif text-cream text-[20px] sm:text-[25px] leading-tight">Matches that check gotra for you</h2>
            <p className="text-paper-3 text-[14px] leading-relaxed mt-2.5">
              On Mithila Jodi every profile carries gotra, maternal gotra, mool and gram, and every match score flags a
              same-gotra clash. Free for every member.
            </p>
            <div className="flex flex-wrap gap-3 justify-center mt-4">
              <Link href="/register" className="btn bg-cream text-maroon border-cream hover:bg-paper">Create a free profile</Link>
              <Link href="/marriage-biodata" className="btn bg-transparent text-cream border-cream/40 hover:border-cream hover:bg-white/5">Make a biodata</Link>
            </div>
          </div>
        </section>
      </main>
      <MithilaFooter className="pb-16 lg:pb-0" />
      <MobileBottomNav />
    </div>
  )
}
