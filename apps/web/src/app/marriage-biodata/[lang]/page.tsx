import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { MithilaHeader } from '@/components/home/MithilaHeader'
import { MithilaFooter } from '@/components/home/MithilaFooter'
import { MobileBottomNav } from '@/components/home/MobileBottomNav'
import { GuideFaq } from '@/components/roots/GuideFaq'
import { BIODATA_LABELS } from '@/lib/biodata'
import { BIODATA_LANGUAGE_PAGES, biodataLabelRows, getBiodataLanguagePage } from '@/lib/biodataLanguagePages'
import { breadcrumbJsonLd, faqJsonLd, jsonLdScript, organizationJsonLd, pageMetadata } from '@/lib/seo'

type Props = { params: Promise<{ lang: string }> }

export function generateStaticParams() {
  return BIODATA_LANGUAGE_PAGES.map(p => ({ lang: p.slug }))
}
export const dynamicParams = false

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const page = getBiodataLanguagePage((await params).lang)
  if (!page) return { title: 'Page not found', robots: { index: false } }
  return pageMetadata({
    path: `/marriage-biodata/${page.slug}`,
    title: page.title,
    description: page.description,
    keywords: [
      `marriage biodata in ${page.name.toLowerCase()}`, `${page.name.toLowerCase()} biodata`,
      `${page.name.toLowerCase()} biodata format`, `${page.name.toLowerCase()} biodata for marriage pdf`,
      'mithila marriage biodata', 'gotra mool biodata',
    ],
  })
}

export default async function BiodataLanguagePage({ params }: Props) {
  const page = getBiodataLanguagePage((await params).lang)
  if (!page) notFound()
  const rows = biodataLabelRows(page.code)
  const docTitle = BIODATA_LABELS[page.code].title
  const makerHref = `/marriage-biodata?lang=${page.code}`
  const path = `/marriage-biodata/${page.slug}`

  // Short and factual — every answer restates what the maker itself does.
  const faq = [
    {
      q: `What does a ${page.name} biodata contain?`,
      a: `The same sections as the English one, with every heading in ${page.name}: community details (gotra, maternal gotra, mool and gram), personal details, education and career, family, astrology and birth details, and contact. The table on this page shows each ${page.name} heading beside its English name. Every field is optional and blank sections are left out.`,
    },
    {
      q: 'Is it free?',
      a: 'Yes. There is no charge and no limit on how many times you use it.',
    },
    {
      q: 'Do I need to log in?',
      a: 'No. The maker runs in your browser and nothing you type is uploaded or saved. That also means a draft is lost when you close the tab, so download it before you leave.',
    },
    {
      q: `How do I download the ${page.name} biodata?`,
      a: `Open the maker with ${page.native} selected, fill in your details and press "Download PDF" for an A4 PDF, or "Image for WhatsApp" for a high-resolution image. You can type your own entries in Devanagari.`,
    },
  ]

  const crumbs = breadcrumbJsonLd([
    { name: 'Mithila Jodi', path: '/' },
    { name: 'Marriage Biodata Maker', path: '/marriage-biodata' },
    { name: `Biodata in ${page.name}`, path },
  ])

  return (
    <div className="min-h-screen flex flex-col bg-paper overflow-x-clip">
      <script type="application/ld+json" dangerouslySetInnerHTML={jsonLdScript(organizationJsonLd(), faqJsonLd(faq), crumbs)} />
      <MithilaHeader />
      <main id="main-content" className="flex-1">
        <section className="py-9 sm:py-12" style={{ background: 'radial-gradient(ellipse 90% 85% at 50% 0%, #FFFAF0 0%, #F5EBDD 100%)' }}>
          <div className="wrap max-w-3xl text-center">
            <nav aria-label="Breadcrumb" className="mb-3">
              <ol className="flex items-center justify-center gap-2 text-[12.5px] text-ink-soft">
                <li><Link href="/" className="hover:text-maroon">Home</Link></li>
                <li aria-hidden="true" className="text-gold">›</li>
                <li><Link href="/marriage-biodata" className="hover:text-maroon">Biodata maker</Link></li>
                <li aria-hidden="true" className="text-gold">›</li>
                <li className="text-maroon" aria-current="page">{page.name}</li>
              </ol>
            </nav>
            <h1 className="font-serif text-maroon text-[27px] sm:text-[36px] leading-tight">Marriage Biodata in {page.name}</h1>
            <p className="font-deva text-gold text-[18px] sm:text-[21px] mt-1.5" lang={page.code}>{docTitle}</p>
            <div className="ornament-line w-16 mx-auto mt-3" />
            <p className="text-ink text-[15px] sm:text-[16px] leading-relaxed mt-4">
              The free Mithila Jodi biodata maker prints every heading in {page.name} ({page.native}) — with gotra,
              mool and gram near the top, where a Maithil family looks first. No login, nothing uploaded.
            </p>
            <div className="flex flex-wrap gap-3 justify-center mt-5">
              <Link href={makerHref} className="btn-primary">Make a {page.name} biodata →</Link>
            </div>
          </div>
        </section>

        <section className="wrap max-w-3xl py-9 sm:py-11">
          <h2 className="font-serif text-maroon text-[21px] sm:text-[25px] leading-tight">{page.name} biodata field names</h2>
          <p className="text-ink-soft text-[14px] mt-1">
            The headings and labels the {page.name} biodata uses, beside the English ones.
          </p>
          <div className="card mt-5 overflow-x-auto">
            <table className="w-full text-left text-[14px]">
              <thead>
                <tr className="border-b border-paper-3 text-ink-soft text-[12px] uppercase tracking-wider">
                  <th scope="col" className="px-4 py-2.5 font-semibold">English</th>
                  <th scope="col" className="px-4 py-2.5 font-semibold">{page.name}</th>
                </tr>
              </thead>
              <tbody>
                {rows.map(r => (
                  <tr key={r.key} className="border-b border-paper-3 last:border-0">
                    <td className="px-4 py-2 text-ink">{r.en}</td>
                    <td className="px-4 py-2 font-deva text-maroon text-[15px]" lang={page.code}>{r.local}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="text-[13.5px] text-ink-soft mt-4">
            Not sure how to spell your gotra or mool?{' '}
            <Link href="/gotra" className="text-maroon underline underline-offset-2">Check gotra</Link> ·{' '}
            <Link href="/mool" className="text-maroon underline underline-offset-2">Mool list</Link>
          </p>
        </section>

        <section className="bg-paper-2 py-9 sm:py-11">
          <div className="wrap max-w-3xl">
            <GuideFaq items={faq} />
          </div>
        </section>

        <section className="bg-maroon-gradient py-9 sm:py-11">
          <div className="wrap max-w-2xl text-center">
            <h2 className="font-serif text-cream text-[20px] sm:text-[25px] leading-tight">Ready to make it?</h2>
            <p className="text-paper-3 text-[14px] leading-relaxed mt-2.5">
              Four Madhubani designs, a live preview, and a PDF or WhatsApp image at the end. Free, no login.
            </p>
            <div className="flex flex-wrap gap-3 justify-center mt-4">
              <Link href={makerHref} className="btn bg-cream text-maroon border-cream hover:bg-paper">Open the maker in {page.name}</Link>
              {BIODATA_LANGUAGE_PAGES.filter(o => o.slug !== page.slug).map(o => (
                <Link key={o.slug} href={`/marriage-biodata/${o.slug}`} className="btn bg-transparent text-cream border-cream/40 hover:border-cream hover:bg-white/5">
                  Biodata in {o.name}
                </Link>
              ))}
            </div>
          </div>
        </section>
      </main>
      <MithilaFooter className="pb-16 lg:pb-0" />
      <MobileBottomNav />
    </div>
  )
}
