import type { Metadata } from 'next'
import Link from 'next/link'
import { MithilaHeader } from '@/components/home/MithilaHeader'
import { MithilaFooter } from '@/components/home/MithilaFooter'
import { SITE_URL } from '@/lib/constants'

export const metadata: Metadata = {
  title: 'Help & Support',
  description:
    'How Mithila Jodi works — creating an account, building a marriage biodata in your language, privacy controls, and getting help.',
  alternates: { canonical: `${SITE_URL}/help` },
}

const FAQS = [
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
    a: 'You control your visibility. Your biodata is shown to verified families you approve, and you can make your profile discoverable or hidden at any time from Settings.',
  },
  {
    q: 'Does it cost anything?',
    a: 'Creating an account, building a profile, and generating a biodata PDF are free. Sending interests and messaging require a paid membership: Mithila Member (₹151/year, 151 interests) or Mithila Premium (₹499/year, unlimited interests). You can receive and accept interests on a Free account.',
  },
  {
    q: 'Is Mithila Jodi available outside India?',
    a: 'Mithila Jodi is currently focused on the Mithila (Maithili) community within India.',
  },
]

export default function HelpPage() {
  return (
    <div className="min-h-screen flex flex-col bg-paper overflow-x-clip">
      <MithilaHeader />
      <main className="flex-1 wrap py-14 max-w-3xl">
        <div className="text-center mb-10">
          <p className="eyebrow mb-3">Help &amp; Support</p>
          <h1 className="section-heading">How can we help?</h1>
          <div className="ornament-line w-24 mx-auto mt-4" />
        </div>

        <div className="space-y-4">
          {FAQS.map(({ q, a }) => (
            <div key={q} className="card p-6">
              <h2 className="font-serif text-lg text-maroon mb-2">{q}</h2>
              <p className="text-ink-soft text-[15px] leading-relaxed">{a}</p>
            </div>
          ))}
        </div>

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
