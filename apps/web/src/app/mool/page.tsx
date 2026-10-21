import Link from 'next/link'
import { MithilaHeader } from '@/components/home/MithilaHeader'
import { MithilaFooter } from '@/components/home/MithilaFooter'
import { MobileBottomNav } from '@/components/home/MobileBottomNav'
import { MoolList } from '@/components/roots/MoolList'
import { GuideFaq } from '@/components/roots/GuideFaq'
import { MOOL_GROUPS } from '@/lib/mithilaRoots'
import { breadcrumbJsonLd, faqJsonLd, jsonLdScript, organizationJsonLd, pageMetadata } from '@/lib/seo'

export const metadata = pageMetadata({
  path: '/mool',
  title: `Maithil Mool List — All ${MOOL_GROUPS.length} Mithila Mools`,
  description:
    `Find your mool: ${MOOL_GROUPS.length} Maithil Brahmin mools of the Mithila Panji, from Sarisab and Khandwala to Pandua and Digho — what mool means and how it is used in marriage.`,
  keywords: [
    'maithil mool list', 'mool list', 'maithil brahmin mool', 'mithila mool', 'what is mool',
    'mool in mithila marriage', 'sarisab mool', 'khandwala mool', 'mithila panji mool',
  ],
})

const FAQ = [
  {
    q: 'What is mool in Mithila?',
    a: 'Mool (मूल, “root”) is a Maithil family’s ancestral origin — the historical settlement its line traces back to. It is broader than gram, the ancestral village, and stays the same however far a family moves.',
  },
  {
    q: 'How do I find my mool?',
    a: 'Ask a grandparent or senior relative; mool is passed down through the father’s line and is part of the family’s oral heritage. The list on this page can help you recognise the name and its spelling.',
  },
  {
    q: 'Why do families ask for mool before a marriage?',
    a: 'Mool is shared with gotra and gram as part of a family’s introduction (parichay). It tells the other family where your roots lie, whether the two lines may be closely related, and which part of the Mithila community you come from.',
  },
  {
    q: 'Is mool the same as gotra?',
    a: 'No. Gotra is a lineage traced to a rishi; mool is the ancestral place of origin. Two families can share a gotra and differ in mool, or share a mool and differ in gotra — which is why biodatas list both.',
  },
]

export default function MoolPage() {
  const list = {
    '@type': 'ItemList',
    name: 'Mools of the Mithila Panji',
    numberOfItems: MOOL_GROUPS.length,
    itemListElement: MOOL_GROUPS.map((m, i) => ({ '@type': 'ListItem', position: i + 1, name: m.name })),
  }
  const crumbs = breadcrumbJsonLd([{ name: 'Mithila Jodi', path: '/' }, { name: 'Maithil Mool List', path: '/mool' }])
  return (
    <div className="min-h-screen flex flex-col bg-paper overflow-x-clip">
      <script type="application/ld+json" dangerouslySetInnerHTML={jsonLdScript(organizationJsonLd(), list, faqJsonLd(FAQ), crumbs)} />
      <MithilaHeader />
      <main id="main-content" className="flex-1">
        <section className="py-9 sm:py-12" style={{ background: 'radial-gradient(ellipse 90% 85% at 50% 0%, #FFFAF0 0%, #F5EBDD 100%)' }}>
          <div className="wrap max-w-3xl text-center">
            <p className="eyebrow !text-gold mb-2">✦ Mithila roots</p>
            <h1 className="font-serif text-maroon text-[27px] sm:text-[36px] leading-tight">Maithil Mool List</h1>
            <p className="font-deva text-gold text-[17px] sm:text-[19px] mt-1.5" lang="hi">मैथिल मूल सूची</p>
            <div className="ornament-line w-16 mx-auto mt-3" />
            <p className="text-ink text-[15px] sm:text-[16px] leading-relaxed mt-4">
              {MOOL_GROUPS.length} mools of the Mithila Panji, spelled as Maithil families write them — with what a mool is, how it differs
              from gotra and gram, and why it is asked before a marriage.
            </p>
          </div>
        </section>

        <section className="wrap max-w-4xl py-9 sm:py-11">
          <MoolList />
        </section>

        <section className="bg-paper-2 py-9 sm:py-11">
          <div className="wrap max-w-3xl space-y-4 text-ink text-[15px] leading-relaxed">
            <h2 className="font-serif text-maroon text-[21px] sm:text-[25px] leading-tight">Mool, gotra and gram</h2>
            <p>
              A Maithil family introduces itself with three things. <Link href="/gotra" className="text-maroon underline underline-offset-2">Gotra</Link> is
              the lineage, traced to a rishi. <strong>Mool</strong> is the ancestral origin — the old settlement the line
              comes from. <strong>Gram</strong> is the ancestral village. A family living in Delhi or Mumbai for three
              generations still has the same mool and gram.
            </p>
            <p>
              Like gotra, mool passes down the father’s line. Families compare it during the <em>parichay</em> because it
              shows whether two lines may be closely related, and places each family within the wider Mithila community.
            </p>
            <p>
              More in the Journal:{' '}
              <Link href="/blogs/gotra-family-lineage/what-is-mool-in-mithila" className="text-maroon underline underline-offset-2">What is mool?</Link> and{' '}
              <Link href="/blogs/gotra-family-lineage/what-is-gram-in-mithila" className="text-maroon underline underline-offset-2">What is gram?</Link>
            </p>
          </div>
        </section>

        <section className="wrap max-w-3xl py-9 sm:py-11">
          <GuideFaq items={FAQ} />
        </section>

        <section className="bg-maroon-gradient py-9 sm:py-11">
          <div className="wrap max-w-2xl text-center">
            <h2 className="font-serif text-cream text-[20px] sm:text-[25px] leading-tight">Put your mool where families look first</h2>
            <p className="text-paper-3 text-[14px] leading-relaxed mt-2.5">
              Mithila Jodi profiles and biodatas carry gotra, maternal gotra, mool and gram at the top. Free for every member.
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
