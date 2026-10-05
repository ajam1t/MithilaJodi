import Link from 'next/link'
import { MithilaHeader } from '@/components/home/MithilaHeader'
import { MithilaFooter } from '@/components/home/MithilaFooter'
import { pageMetadata, breadcrumbJsonLd, faqJsonLd, jsonLdScript } from '@/lib/seo'
import { DIGITAL_PROFILE_FAQ } from '@/lib/digitalProfileFaq'

export const metadata = pageMetadata({
  path: '/help',
  title: 'Help & Support — Your Questions Answered',
  description:
    'Answers about Mithila Jodi — gotra, maternal gotra and mool, creating an account, marriage biodata in your language, who can see your profile, and what it costs.',
  keywords: ['Mithila Jodi help', 'Mithila matrimony questions', 'Mithila biodata help'],
})

/** `more` adds "read more" links under an answer; the answer text itself is what FAQPage carries. */
const FAQS: Array<{ q: string; a: string; more?: Array<{ href: string; label: string }> }> = [
  {
    q: 'What is Mithila Jodi?',
    a: 'Mithila Jodi is a matrimonial platform for the Mithila (Maithili) community of India. It brings matchmaking, marriage biodata, wedding invitations, astrology and Mithila culture together in one place, rooted in the community’s values.',
  },
  {
    q: 'What is gotra, and why does it matter in marriage?',
    a: 'Gotra is a patrilineal lineage traced to a common Vedic ancestor, and many Hindu and Mithila families traditionally avoid same-gotra marriage. It is commonly asked during matrimonial matching.',
    more: [{ href: '/blogs/gotra-family-lineage/what-is-gotra', label: 'What Is Gotra?' }],
  },
  {
    q: 'What are maternal gotra and mool in Mithila?',
    a: "Maternal gotra is the gotra of the mother's side, and mool refers to a family's ancestral origin or native place in Mithila tradition. Both are often considered during matrimonial matching.",
    more: [
      { href: '/blogs/gotra-family-lineage/what-is-maternal-gotra', label: 'Maternal gotra' },
      { href: '/blogs/gotra-family-lineage/what-is-mool-in-mithila', label: 'Mool in Mithila' },
    ],
  },
  {
    q: 'Is Mithila Jodi only for the Mithila and Maithil community?',
    a: "Mithila Jodi is designed specifically for Mithila and Maithili families, capturing gotra, mool and native-place details that matter to the community's marriage traditions.",
  },
  {
    q: 'How do I create an account?',
    a: 'Enter your Indian mobile number, verify the one-time password (OTP) sent to you, and accept the Terms and Privacy Policy. Your account and profile are free.',
  },
  {
    q: 'What is a marriage biodata?',
    a: 'A marriage biodata is a structured profile with your personal, family, and cultural details (gotra, kul, mool, gram). On Mithila Jodi you can create one in English, Hindi, Maithili, or Sanskrit and download it as a PDF.',
  },
  {
    q: 'Who can see my profile?',
    a: 'You choose one of three levels. Public means it may appear on our homepage and the Mithila matrimonial profiles page, which do not require an account — your name, photo and community details are visible there, while your date of birth, contact details and address are never included. Members only means it appears in search for signed-in members and nowhere public. Private means it is hidden entirely. You can change this at any time when editing your profile.',
  },
  {
    q: 'How does Mithila matrimonial matching work?',
    a: 'Search covers the fields Maithil families actually ask about — gotra, mool, gram, native district and current city — alongside age, education, diet and how soon each family is looking to marry. Every result carries a match score that lists the reasons behind it, and a sagotra match is flagged as something to check rather than quietly scored down. If nothing matches your filters exactly, the search widens one filter at a time and tells you which.',
  },
  {
    q: 'Can I share my matrimonial profile with another family?',
    a: 'Yes. From your profile you can create a shareable link and send it on WhatsApp. Whoever opens it sees your profile without creating an account, and you decide section by section what the link shows — contact details are off unless you include them. Each link expires on a date you choose and you can turn it off at any time.',
  },
  {
    q: 'Can I create a Mithila wedding invitation card?',
    a: 'Yes, free and without logging in. The invitation card maker offers Madhubani and Mithila-inspired designs; add your wedding details and download or share the card straight to WhatsApp.',
  },
  {
    q: 'Does it cost anything?',
    a: 'No. Mithila Jodi is currently free for all members. Creating an account, building a profile, generating a biodata PDF, searching, sending and accepting interests, and messaging your matches are all included at no cost.',
  },
  {
    q: 'Is Mithila Jodi available outside India?',
    a: 'Mithila Jodi is currently focused on the Mithila (Maithili) community within India.',
  },
]

export default function HelpPage() {
  const breadcrumb = breadcrumbJsonLd([
    { name: 'Mithila Jodi', path: '/' },
    { name: 'Help & Support', path: '/help' },
  ])

  return (
    <div className="min-h-screen flex flex-col bg-paper overflow-x-clip">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={jsonLdScript(breadcrumb, faqJsonLd([...FAQS, ...DIGITAL_PROFILE_FAQ]))}
      />
      <MithilaHeader />
      <main id="main-content" className="flex-1 wrap py-14 max-w-3xl">
        <div className="text-center mb-10">
          <p className="eyebrow mb-3">Help &amp; Support</p>
          <h1 className="section-heading">How can we help?</h1>
          <div className="ornament-line w-24 mx-auto mt-4" />
        </div>

        <div className="space-y-4">
          {FAQS.map(({ q, a, more }) => (
            <div key={q} className="card p-6">
              <h2 className="font-serif text-lg text-maroon mb-2">{q}</h2>
              <p className="text-ink-soft text-[15px] leading-relaxed">{a}</p>
              {more && (
                <p className="mt-2 text-[14px]">
                  Read more:{' '}
                  {more.map((m, i) => (
                    <span key={m.href}>
                      {i > 0 && ' · '}
                      <Link href={m.href} className="text-maroon underline underline-offset-2">{m.label}</Link>
                    </span>
                  ))}
                </p>
              )}
            </div>
          ))}
        </div>

        {/* Linked from the Digital Profile page's "View All FAQs". */}
        <section id="digital-profile" className="mt-12 scroll-mt-24" aria-labelledby="faq-dp">
          <p className="eyebrow mb-2 text-center">Digital Profile</p>
          <h2 id="faq-dp" className="section-heading mb-6 text-center text-[24px] sm:text-[28px]">Digital Profile questions</h2>
          <div className="space-y-4">
            {DIGITAL_PROFILE_FAQ.map(({ q, a }) => (
              <div key={q} className="card p-6">
                <h3 className="font-serif text-lg text-maroon mb-2">{q}</h3>
                <p className="text-ink-soft text-[15px] leading-relaxed">{a}</p>
              </div>
            ))}
          </div>
          <p className="mt-5 text-center text-[14px]">
            <Link href="/digital-profile" className="text-maroon underline underline-offset-2">About Digital Profiles</Link>
          </p>
        </section>

        <div className="mt-10 text-center">
          <p className="text-ink-soft text-[15px]">
            Still need help? Review our{' '}
            <Link href="/legal/terms" className="text-maroon hover:underline">Terms</Link> and{' '}
            <Link href="/legal/privacy" className="text-maroon hover:underline">Privacy Policy</Link>.
          </p>
          <div className="mt-6 flex justify-center gap-4">
            <Link href="/" className="btn-ghost">← Back to Home</Link>
            <Link href="/register" className="btn-primary">Create Your Profile Free</Link>
          </div>
        </div>
      </main>
      <MithilaFooter />
    </div>
  )
}
