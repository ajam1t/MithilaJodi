import type { Metadata } from 'next'
import Link from 'next/link'
import { MithilaHeader } from '@/components/home/MithilaHeader'
import { MithilaFooter } from '@/components/home/MithilaFooter'

export const metadata: Metadata = {
  title: 'Blogs',
  description:
    'Stories, traditions, and guidance on Maithili marriage, Mithila culture, and creating a marriage biodata — coming soon on Mithila Jodi.',
}

export default function BlogsPage() {
  return (
    <div className="min-h-screen flex flex-col bg-paper overflow-x-clip">
      <MithilaHeader />
      <main className="flex-1 wrap py-20 text-center max-w-2xl">
        <p className="eyebrow mb-3">Mithila Jodi Journal</p>
        <h1 className="section-heading">Blogs — Coming Soon</h1>
        <div className="ornament-line w-24 mx-auto my-5" />
        <p className="text-ink-soft text-[16px] leading-relaxed">
          We&apos;re preparing thoughtful articles on Maithili marriage traditions, Madhubani
          heritage, and practical guidance for creating a marriage biodata. Check back soon.
        </p>
        <div className="mt-8 flex justify-center gap-4">
          <Link href="/" className="btn-ghost">← Back to Home</Link>
          <Link href="/register" className="btn-primary">Create Your Profile Free</Link>
        </div>
      </main>
      <MithilaFooter />
    </div>
  )
}
