import Link from 'next/link'
import { MithilaHeader } from '@/components/home/MithilaHeader'
import { MithilaFooter } from '@/components/home/MithilaFooter'
import { MobileBottomNav } from '@/components/home/MobileBottomNav'
import { COMPETITORS, MJ_FEATURES } from '@/lib/compare'
import { breadcrumbJsonLd, jsonLdScript, organizationJsonLd, pageMetadata } from '@/lib/seo'

export const metadata = pageMetadata({
  path: '/compare',
  title: 'Mithila Jodi vs All-India Matrimony Sites',
  description:
    'How Mithila Jodi compares with all-India matrimony sites for a Maithil match: free for every member, built around gotra, mool and gram, gotra checked in every match.',
  keywords: ['maithil matrimony site', 'best matrimony site for maithil', 'free matrimony site', 'mithila jodi vs', 'matrimony site alternative'],
})

export default function CompareHubPage() {
  const crumbs = breadcrumbJsonLd([{ name: 'Mithila Jodi', path: '/' }, { name: 'Compare', path: '/compare' }])
  return (
    <div className="min-h-screen flex flex-col bg-paper overflow-x-clip">
      <script type="application/ld+json" dangerouslySetInnerHTML={jsonLdScript(organizationJsonLd(), crumbs)} />
      <MithilaHeader />
      <main id="main-content" className="flex-1">
        <section className="wrap max-w-3xl py-10 sm:py-14 text-center">
          <p className="eyebrow mb-2">Compare</p>
          <h1 className="font-serif text-maroon text-[26px] sm:text-[34px] leading-tight">Mithila Jodi and the all-India matrimony sites</h1>
          <div className="ornament-line w-16 mx-auto my-4" />
          <p className="text-ink-soft text-[15px] sm:text-[16px] leading-relaxed">
            The big matrimony sites serve every community in India. Mithila Jodi serves one — Maithil families — so it can
            put gotra, mool and gram first and check gotra in every match. It is free for every member.
          </p>
          <p className="mt-3 text-[14px]">
            <Link href="/match-score" className="font-semibold text-maroon underline underline-offset-2">See how the match score works →</Link>
          </p>
          <ul className="mt-8 grid sm:grid-cols-3 gap-3 text-left">
            {COMPETITORS.map(c => (
              <li key={c.slug}>
                <Link href={`/compare/${c.slug}`} className="card block p-4 h-full hover:border-gold transition-colors">
                  <span className="block font-serif text-maroon text-[17px] leading-tight">{c.name} alternative</span>
                  <span className="block text-ink-soft text-[13px] mt-1">For Maithil families →</span>
                </Link>
              </li>
            ))}
          </ul>
        </section>
        <section className="bg-paper-2 py-9 sm:py-11">
          <div className="wrap max-w-3xl">
            <h2 className="font-serif text-maroon text-[21px] sm:text-[25px] leading-tight">What you get on Mithila Jodi</h2>
            <ul className="mt-4 space-y-2.5">
              {MJ_FEATURES.map(f => (
                <li key={f.title} className="flex items-start gap-2.5 text-ink text-[15px] leading-relaxed">
                  <span className="text-green font-bold mt-0.5" aria-hidden="true">✓</span>
                  <span><strong className="font-semibold">{f.title}.</strong> <span className="text-ink-soft">{f.body}</span></span>
                </li>
              ))}
            </ul>
            <div className="mt-7 text-center">
              <Link href="/register" className="btn-primary px-7 py-3 text-[15px]">Create a free profile →</Link>
            </div>
            <p className="text-[12px] text-ink-soft mt-8 leading-relaxed text-center">
              Shaadi.com, Jeevansathi and BharatMatrimony are trademarks of their respective owners. Mithila Jodi is an
              independent service and is not affiliated with any of them.
            </p>
          </div>
        </section>
      </main>
      <MithilaFooter className="pb-16 lg:pb-0" />
      <MobileBottomNav />
    </div>
  )
}
