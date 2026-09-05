import type { Metadata } from 'next'
import Link from 'next/link'
import { MithilaHeader } from '@/components/home/MithilaHeader'
import { MithilaFooter } from '@/components/home/MithilaFooter'
import { SITE_URL } from '@/lib/constants'

const SITE = SITE_URL

export const metadata: Metadata = {
  title: 'Safety & Verification — Mithila Jodi',
  description:
    'How Mithila Jodi approaches safety, verification, and privacy for matrimonial members and families. Learn how to stay safe, report suspicious profiles, and protect your personal information.',
  alternates: { canonical: `${SITE}/safety` },
  openGraph: {
    type: 'website',
    url: `${SITE}/safety`,
    siteName: 'Mithila Jodi',
    title: 'Safety & Verification — Mithila Jodi',
    description:
      'Understand how Mithila Jodi protects member privacy, what verification really means, and how to stay safe on a Mithila matrimonial platform.',
    images: ['/hero-couple.jpg'],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Safety & Verification — Mithila Jodi',
    description: 'Your privacy, verification, and safety on Mithila Jodi matrimonial platform — explained honestly.',
    images: ['/hero-couple.jpg'],
  },
}

const jsonLd = {
  '@context': 'https://schema.org',
  '@graph': [
    {
      '@type': 'WebPage',
      '@id': `${SITE}/safety#webpage`,
      url: `${SITE}/safety`,
      name: 'Safety & Verification — Mithila Jodi',
      breadcrumb: { '@id': `${SITE}/safety#breadcrumb` },
      inLanguage: 'en',
    },
    {
      '@type': 'BreadcrumbList',
      '@id': `${SITE}/safety#breadcrumb`,
      itemListElement: [
        { '@type': 'ListItem', position: 1, name: 'Home',   item: SITE },
        { '@type': 'ListItem', position: 2, name: 'Safety', item: `${SITE}/safety` },
      ],
    },
    {
      '@type': 'FAQPage',
      mainEntity: [
        { '@type': 'Question', name: 'Does Mithila Jodi verify every profile?', acceptedAnswer: { '@type': 'Answer', text: 'Mobile numbers are verified at registration via OTP. Profile photographs are reviewed by the team before they appear to other members. Other profile details publish immediately and are reviewed if they are reported or flagged. Mithila Jodi does not perform identity document checks or background verification.' } },
        { '@type': 'Question', name: 'What does Mobile Verified mean?', acceptedAnswer: { '@type': 'Answer', text: 'The member confirmed their mobile number by entering a one-time password sent to that number. It confirms the number is active and accessible. It does not verify identity beyond phone number ownership.' } },
        { '@type': 'Question', name: 'Should I share my OTP or password?', acceptedAnswer: { '@type': 'Answer', text: 'No. Never share your OTP, password, or any authentication credential with anyone — including people claiming to be from Mithila Jodi. The platform will never ask for your password or OTP.' } },
        { '@type': 'Question', name: 'Should I send money to another member?', acceptedAnswer: { '@type': 'Answer', text: 'No. Do not send money to someone you have only connected with through a matrimonial platform. Requests for financial transfers are a serious warning sign.' } },
      ],
    },
  ],
}

// ── Icons ────────────────────────────────────────────────────────────────────

function ShieldIcon({ size = 24 }: { size?: number }) {
  return (
    <svg viewBox="0 0 24 24" width={size} height={size} fill="none" aria-hidden="true">
      <path d="M12 3 L20 6.5 V12 C20 16.5 16.5 20.3 12 21.5 C7.5 20.3 4 16.5 4 12 V6.5 Z"
        stroke="#7A1220" strokeWidth="1.6" strokeLinejoin="round" />
      <path d="M9 12 L11 14 L15 10" stroke="#B98A2E" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

function LockIcon() {
  return (
    <svg viewBox="0 0 24 24" width="20" height="20" fill="none" aria-hidden="true">
      <rect x="5" y="11" width="14" height="10" rx="2" stroke="#7A1220" strokeWidth="1.6" />
      <path d="M8 11V7a4 4 0 0 1 8 0v4" stroke="#7A1220" strokeWidth="1.6" strokeLinecap="round" />
      <circle cx="12" cy="16" r="1.2" fill="#B98A2E" />
    </svg>
  )
}

function CheckBadge() {
  return (
    <svg viewBox="0 0 22 22" width="22" height="22" fill="none" aria-hidden="true">
      <circle cx="11" cy="11" r="9" fill="#7A1220" opacity="0.08" />
      <circle cx="11" cy="11" r="9" stroke="#7A1220" strokeWidth="1.4" />
      <path d="M7.5 11.5 L10 14 L14.5 8.5" stroke="#B98A2E" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

function WarnDiamond() {
  return (
    <svg viewBox="0 0 20 20" width="18" height="18" fill="none" aria-hidden="true">
      <path d="M10 2 L18 10 L10 18 L2 10 Z" stroke="#B98A2E" strokeWidth="1.5" strokeLinejoin="round" />
      <path d="M10 7 V10.5" stroke="#B98A2E" strokeWidth="1.8" strokeLinecap="round" />
      <circle cx="10" cy="13.5" r="0.8" fill="#B98A2E" />
    </svg>
  )
}

// ── Safety checklist items ───────────────────────────────────────────────────

const SAFETY_TIPS = [
  { tip: 'Never share your OTP or password with anyone, including people claiming to be from Mithila Jodi support.' },
  { tip: 'Never share banking PINs, card details, account numbers, or UPI credentials with a prospective match or their family.' },
  { tip: 'Do not send money to someone you have only met through a matrimonial platform, regardless of the reason given.' },
  { tip: 'Be cautious of urgent financial requests or pressure to act quickly — these are common warning signs of fraud.' },
  { tip: 'Take time to verify important information independently before making decisions.' },
  { tip: 'Involve trusted family members in the review process where appropriate.' },
  { tip: 'Be thoughtful before sharing personal contact information such as your home address or personal email.' },
  { tip: 'Report any profile that appears suspicious, fake, or inappropriate to Mithila Jodi immediately.' },
]

const FAMILY_TIPS = [
  'Review profiles together and discuss important details openly.',
  'Verify information such as education, employment, and family background through your own networks.',
  'Take time before making decisions — there is no pressure to respond quickly.',
  'Arrange initial interactions or meetings in familiar, safe environments with family present.',
  "Use the platform's privacy controls to manage how much information is visible and to whom.",
]

const FAQS = [
  {
    q: 'Does Mithila Jodi verify every profile?',
    a: 'Mobile numbers are verified at registration via OTP. Profile photographs are reviewed by the team before they appear to other members. Other profile details publish immediately when a member saves them, and are reviewed if reported or flagged — so please do not treat an active profile as a vetted one. Mithila Jodi does not currently perform identity document checks, government ID verification, or background checks. Members should exercise their own judgement and involve trusted family members in the matching process.',
  },
  {
    q: 'What does Mobile Verified mean?',
    a: 'A Mobile Verified member has confirmed their mobile number by entering a one-time password (OTP) sent to that number during registration. This confirms the number is active and that someone with access to it completed the registration. It does not verify a member\'s identity beyond ownership of that phone number.',
  },
  {
    q: 'Can I report a suspicious profile?',
    a: 'Yes. Open the profile and use the Report button on it — choose a reason and add any detail that helps. The same screen has a Block button, which stops that member from reaching you. If you are not signed in, or you would rather not use the in-profile option, you can also report through the Contact form on this site by selecting "Report a Profile" as the reason. Reports are reviewed by the Mithila Jodi team.',
  },
  {
    q: 'Can I block another member?',
    a: 'Yes. The block feature is available on member profiles. Blocking a member removes them from your search results, withdraws any pending interests between you, and closes any shared conversation. The block can be removed at any time.',
  },
  {
    q: 'Is my phone number visible to other members?',
    a: 'No. Your mobile number is never shown to other members or visitors. It is used only for account login, OTP verification, and internal communication. Contact details are stored separately from your public profile and are never included in search results or profile views.',
  },
  {
    q: 'Should I share my OTP or password?',
    a: 'No — never. Do not share your OTP, password, or any authentication credential with anyone, including people claiming to be from Mithila Jodi. The platform will never ask you for your password or OTP. Anyone requesting these details should be treated as suspicious.',
  },
  {
    q: 'Should I send money to another member?',
    a: 'No. Do not send money to someone you have only connected with through a matrimonial platform. Any request for money — regardless of the reason — is a serious warning sign. Report any such request to Mithila Jodi immediately.',
  },
]

// ── Page ─────────────────────────────────────────────────────────────────────

export default function SafetyPage() {
  return (
    <div className="min-h-screen flex flex-col bg-paper overflow-x-clip">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <MithilaHeader />

      <main id="main-content" className="flex-1">

        {/* ── Hero ──────────────────────────────────────────────── */}
        <section className="bg-cream py-14 sm:py-20">
          <div className="wrap max-w-2xl text-center">
            <nav aria-label="Breadcrumb" className="mb-6">
              <ol className="flex items-center justify-center gap-2 text-[13px] text-ink-soft">
                <li><Link href="/" className="hover:text-maroon transition-colors">Home</Link></li>
                <li aria-hidden="true" className="text-gold">›</li>
                <li className="text-maroon font-medium" aria-current="page">Safety &amp; Verification</li>
              </ol>
            </nav>

            <div className="flex items-center justify-center mb-5">
              <div className="w-14 h-14 rounded-full bg-maroon/8 border border-gold/30 flex items-center justify-center">
                <ShieldIcon size={28} />
              </div>
            </div>

            <p className="eyebrow mb-3">Trust &amp; Safety</p>
            <h1 className="section-heading text-3xl sm:text-4xl">Safety &amp; Verification</h1>
            <div className="ornament-line w-20 mx-auto mt-4 mb-6" />
            <p className="text-ink-soft text-[17px] leading-relaxed max-w-xl mx-auto">
              Your trust matters. Mithila Jodi is designed to help individuals and families connect
              with greater confidence while keeping privacy and responsible communication at the
              heart of the experience.
            </p>
            <div className="mt-8">
              <Link
                href="/contact"
                className="btn-ghost inline-flex items-center gap-2"
              >
                <svg viewBox="0 0 18 18" width="15" height="15" fill="none" aria-hidden="true">
                  <path d="M9 2 L16 5.5 V10 C16 13.5 12.8 16.5 9 17.5 C5.2 16.5 2 13.5 2 10 V5.5 Z"
                    stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />
                  <path d="M6 9.5 L8 11.5 L12 7.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
                Report a Profile
              </Link>
            </div>
          </div>
        </section>

        {/* ── Section 1: Your Safety Matters ────────────────────── */}
        <section className="bg-paper py-12 sm:py-16" aria-labelledby="s1-heading">
          <div className="wrap max-w-3xl">
            <p className="eyebrow mb-2">Why it matters</p>
            <h2 id="s1-heading" className="section-heading text-2xl mb-4">Your Safety Matters</h2>
            <div className="ornament-line w-16 mb-6" />
            <div className="space-y-4 text-ink-soft text-[16px] leading-relaxed">
              <p>
                Matrimonial matchmaking involves sharing personal and family information with people
                you may not yet know well. That requires care. Mithila Jodi is built with privacy
                controls and review processes to give you more confidence, but the most important
                layer of protection is your own judgement.
              </p>
              <p>
                Only share information you are comfortable sharing. Use the platform&apos;s privacy
                settings to control what others can see. Involve trusted family members in the
                process. And if something feels wrong, trust that instinct — report it.
              </p>
            </div>

            <div className="mt-8 grid grid-cols-1 sm:grid-cols-2 gap-4">
              {[
                { title: 'Profile privacy',            body: 'You control whether your profile is discoverable. You can make it visible or hidden at any time from your profile settings.' },
                { title: 'Contact info is protected',  body: 'Your mobile number and email address are never shown to other members or visitors. They are used only for account login and internal communication.' },
                { title: 'Responsible communication',  body: 'Communicate thoughtfully and give yourself time to assess a match. There is no rush, and genuine matches will respect your pace.' },
                { title: 'Report suspicious behaviour', body: 'If any profile, message, or interaction makes you uncomfortable, report it. The Mithila Jodi team reviews all reports.' },
              ].map(({ title, body }) => (
                <div key={title} className="card p-5 flex gap-3">
                  <div className="shrink-0 mt-0.5"><CheckBadge /></div>
                  <div>
                    <h3 className="font-serif text-maroon text-[15px] mb-1">{title}</h3>
                    <p className="text-ink-soft text-[13px] leading-relaxed">{body}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── Section 2: Verification ────────────────────────────── */}
        <section className="bg-cream py-12 sm:py-16" aria-labelledby="s2-heading">
          <div className="wrap max-w-3xl">
            <p className="eyebrow mb-2">What is actually checked</p>
            <h2 id="s2-heading" className="section-heading text-2xl mb-4">Verification at Mithila Jodi</h2>
            <div className="ornament-line w-16 mb-4" />
            <p className="text-ink-soft text-[16px] leading-relaxed mb-8">
              Verification on Mithila Jodi is honest and specific. We only display verification
              indicators for processes that genuinely happen. We do not claim identity
              verification, government ID checks, or background screening — those are not currently
              offered.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">

              {/* Mobile Verified */}
              <div className="card p-5 flex flex-col gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-full bg-maroon/8 flex items-center justify-center shrink-0">
                    <svg viewBox="0 0 20 20" width="18" height="18" fill="none" aria-hidden="true">
                      <rect x="5" y="2" width="10" height="16" rx="2" stroke="#7A1220" strokeWidth="1.5" />
                      <path d="M9 15h2" stroke="#B98A2E" strokeWidth="1.5" strokeLinecap="round" />
                    </svg>
                  </div>
                  <h3 className="font-serif text-maroon text-[15px]">Mobile Verified</h3>
                </div>
                <p className="text-ink-soft text-[13px] leading-relaxed flex-1">
                  The member confirmed their mobile number via a one-time password (OTP) at
                  registration. Every registered member on Mithila Jodi has completed this step.
                </p>
                <p className="text-[11px] text-ink-soft/70 border-t border-gold/20 pt-3 leading-relaxed">
                  This confirms the mobile number was active at registration. It does not verify
                  personal identity beyond phone number ownership.
                </p>
              </div>

              {/* Photo Reviewed */}
              <div className="card p-5 flex flex-col gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-full bg-maroon/8 flex items-center justify-center shrink-0">
                    <svg viewBox="0 0 20 20" width="18" height="18" fill="none" aria-hidden="true">
                      <rect x="2" y="4" width="16" height="12" rx="2" stroke="#7A1220" strokeWidth="1.5" />
                      <circle cx="10" cy="10" r="3" stroke="#B98A2E" strokeWidth="1.4" />
                      <path d="M7 4 L7.8 2.5 H12.2 L13 4" stroke="#7A1220" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </div>
                  <h3 className="font-serif text-maroon text-[15px]">Photo Reviewed</h3>
                </div>
                <p className="text-ink-soft text-[13px] leading-relaxed flex-1">
                  All photographs uploaded to Mithila Jodi go through a review queue before
                  appearing on any profile. Photos that do not meet community guidelines are
                  rejected and not displayed.
                </p>
                <p className="text-[11px] text-ink-soft/70 border-t border-gold/20 pt-3 leading-relaxed">
                  Photos are reviewed for appropriateness. This is not an identity authentication
                  or facial verification process.
                </p>
              </div>

              {/* Profile Reviewed */}
              <div className="card p-5 flex flex-col gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-full bg-maroon/8 flex items-center justify-center shrink-0">
                    <svg viewBox="0 0 20 20" width="18" height="18" fill="none" aria-hidden="true">
                      <circle cx="10" cy="7" r="3" stroke="#7A1220" strokeWidth="1.5" />
                      <path d="M4 17c0-3.3 2.7-6 6-6s6 2.7 6 6" stroke="#7A1220" strokeWidth="1.5" strokeLinecap="round" />
                      <path d="M13 4.5 L14.5 6 L17.5 3" stroke="#B98A2E" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </div>
                  <h3 className="font-serif text-maroon text-[15px]">Profile Reviewed</h3>
                </div>
                <p className="text-ink-soft text-[13px] leading-relaxed flex-1">
                  Profiles go through an internal review by the Mithila Jodi team before becoming
                  active on the platform. Profiles that do not meet guidelines may be rejected or
                  returned for correction.
                </p>
                <p className="text-[11px] text-ink-soft/70 border-t border-gold/20 pt-3 leading-relaxed">
                  This is an internal quality and guideline check. It is not an identity document
                  verification or background check.
                </p>
              </div>

            </div>

            {/* Not offered notice */}
            <div className="mt-6 flex gap-3 items-start rounded-mj-sm border border-gold/30 bg-paper px-5 py-4">
              <WarnDiamond />
              <p className="text-[13px] text-ink-soft leading-relaxed">
                <strong className="text-ink">Not currently offered:</strong> Mithila Jodi does not
                currently perform government ID verification, Aadhaar/PAN checks, background
                screening, or facial authentication. Members should independently verify information
                that matters to their family.
              </p>
            </div>
          </div>
        </section>

        {/* ── Section 3: Privacy & Visibility ───────────────────── */}
        <section className="bg-paper py-12 sm:py-16" aria-labelledby="s3-heading">
          <div className="wrap max-w-3xl">
            <p className="eyebrow mb-2">What you control</p>
            <h2 id="s3-heading" className="section-heading text-2xl mb-4">Privacy &amp; Profile Visibility</h2>
            <div className="ornament-line w-16 mb-6" />
            <p className="text-ink-soft text-[16px] leading-relaxed mb-8">
              Your profile information belongs to you. Mithila Jodi gives you meaningful control
              over what is visible and to whom. Sensitive personal and family information is
              protected and not publicly exposed.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {[
                { label: 'Profile discoverability', body: 'You can make your profile visible in search results or hidden at any time from your profile settings. Hidden profiles cannot be found in searches.' },
                { label: 'Mobile number',            body: 'Your registered mobile number is never shown to other members or site visitors. It is stored securely and used only for account authentication.' },
                { label: 'Email address',            body: 'Your email address is not exposed to other members. If you have provided one for notifications, it is held privately.' },
                { label: 'Profile photograph',       body: 'Uploaded photographs go through a review process. You control whether a photo is set as your primary profile photo.' },
                { label: 'Family information',       body: 'Family details such as parents\' names, siblings, and native gram are part of your profile and shared within the platform\'s privacy controls.' },
                { label: 'Gotra, Maternal Gotra & Mool', body: 'These lineage details are included in your profile. They are shared with members who can view your profile based on your discoverability settings.' },
                { label: 'Marriage biodata',         body: 'Your biodata can be generated as a PDF and shared privately — outside the platform. Share it only with families you are comfortable sharing with.' },
                { label: 'Horoscope',                body: 'If you upload a horoscope, it is part of your profile. Share it with care and only when you are comfortable doing so.' },
              ].map(({ label, body }) => (
                <div key={label} className="card p-4 flex gap-3 items-start">
                  <div className="shrink-0 mt-0.5"><LockIcon /></div>
                  <div>
                    <h3 className="font-serif text-maroon text-[14px] mb-1">{label}</h3>
                    <p className="text-ink-soft text-[13px] leading-relaxed">{body}</p>
                  </div>
                </div>
              ))}
            </div>

            <p className="mt-6 text-[13px] text-ink-soft">
              For full details on how your information is handled, see the{' '}
              <Link href="/legal/privacy" className="text-maroon hover:underline underline-offset-2">Privacy Policy</Link>.
            </p>
          </div>
        </section>

        {/* ── Section 4: Safety checklist ───────────────────────── */}
        <section className="bg-cream py-12 sm:py-16" aria-labelledby="s4-heading">
          <div className="wrap max-w-3xl">
            <p className="eyebrow mb-2">Practical guidance</p>
            <h2 id="s4-heading" className="section-heading text-2xl mb-4">Stay Safe While Using Mithila Jodi</h2>
            <div className="ornament-line w-16 mb-6" />
            <p className="text-ink-soft text-[16px] leading-relaxed mb-8">
              These are practical steps you can take to protect yourself and your family throughout
              the matchmaking process.
            </p>

            <ul className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {SAFETY_TIPS.map(({ tip }) => (
                <li key={tip} className="card p-4 flex gap-3 items-start">
                  <span className="shrink-0 mt-0.5">
                    <svg viewBox="0 0 18 18" width="16" height="16" fill="none" aria-hidden="true">
                      <circle cx="9" cy="9" r="7.5" fill="#7A1220" opacity="0.1" />
                      <path d="M5.5 9.5 L7.5 11.5 L12.5 6.5" stroke="#7A1220" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </span>
                  <p className="text-[14px] text-ink leading-snug">{tip}</p>
                </li>
              ))}
            </ul>
          </div>
        </section>

        {/* ── Section 5: Report a Profile ───────────────────────── */}
        <section className="bg-paper py-12 sm:py-16" aria-labelledby="s5-heading">
          <div className="wrap max-w-3xl">
            <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-6">
              <div className="flex-1">
                <p className="eyebrow mb-2">Flag suspicious activity</p>
                <h2 id="s5-heading" className="section-heading text-2xl mb-4">Report a Profile</h2>
                <div className="ornament-line w-16 mb-6" />
                <div className="space-y-4 text-ink-soft text-[16px] leading-relaxed">
                  <p>
                    If you believe a profile is fake, misleading, abusive, or suspicious — report
                    it. Every report is reviewed by the Mithila Jodi team.
                  </p>
                  <p>
                    The quickest way is from the profile itself: open it and use the{' '}
                    <strong className="text-ink">Report</strong> button, then choose a reason. The
                    same screen has a <strong className="text-ink">Block</strong> button, which stops
                    that member from reaching you.
                  </p>
                  <p>
                    If you are not signed in, or you would rather not report from the profile, use
                    the{' '}
                    <Link href="/contact" className="text-maroon hover:underline underline-offset-2">Contact page</Link>{' '}
                    and select <strong className="text-ink">&ldquo;Report a Profile&rdquo;</strong>{' '}
                    from the reason dropdown. Include the name or profile details of the member you
                    are reporting and a description of your concern.
                  </p>
                  <p>
                    Reports can be made for any of the following concerns: fake or impersonated
                    profile, harassment, inappropriate photograph, spam, underage member, suspected
                    fraud, or other suspicious behaviour.
                  </p>
                </div>
              </div>
              <div className="shrink-0 flex flex-col items-start sm:items-center gap-4 sm:pt-10">
                <Link href="/contact" className="btn-primary">
                  Report a Profile
                </Link>
              </div>
            </div>
          </div>
        </section>

        {/* ── Section 6: Block a Member ─────────────────────────── */}
        <section className="bg-cream py-12 sm:py-16" aria-labelledby="s6-heading">
          <div className="wrap max-w-3xl">
            <p className="eyebrow mb-2">Control your interactions</p>
            <h2 id="s6-heading" className="section-heading text-2xl mb-4">Block a Member</h2>
            <div className="ornament-line w-16 mb-6" />
            <div className="space-y-4 text-ink-soft text-[16px] leading-relaxed mb-8">
              <p>
                If you do not want further interaction with a specific member, you can block them.
                When you block a member:
              </p>
            </div>
            <ul className="space-y-3 mb-6">
              {[
                'The blocked member no longer appears in your search results.',
                'Any pending interests between you are automatically withdrawn.',
                'Any shared conversation is closed.',
                'The block is private — the other member is not informed.',
                'You can unblock them at any time from their profile.',
              ].map(item => (
                <li key={item} className="flex items-start gap-3 text-[15px] text-ink">
                  <CheckBadge />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
            <p className="text-ink-soft text-[15px] leading-relaxed">
              The block option is available on member profile pages. If you are unable to find it or
              need assistance, contact us via the{' '}
              <Link href="/contact" className="text-maroon hover:underline underline-offset-2">Contact page</Link>.
            </p>
          </div>
        </section>

        {/* ── Section 7: Family Involvement ─────────────────────── */}
        <section className="bg-paper py-12 sm:py-16" aria-labelledby="s7-heading">
          <div className="wrap max-w-3xl">
            <p className="eyebrow mb-2">A platform for families</p>
            <h2 id="s7-heading" className="section-heading text-2xl mb-4">Family Involvement</h2>
            <div className="ornament-line w-16 mb-6" />
            <p className="text-ink-soft text-[16px] leading-relaxed mb-8">
              Mithila Jodi is designed with the understanding that matrimonial matchmaking in the
              Mithila community is a family process, not just an individual decision. Involving
              trusted family members at appropriate stages adds an important layer of consideration
              and confidence.
            </p>

            <ul className="space-y-3">
              {FAMILY_TIPS.map(tip => (
                <li key={tip} className="flex items-start gap-3 text-[15px] text-ink">
                  <span className="shrink-0 mt-1">
                    <svg viewBox="0 0 8 8" width="8" height="8" aria-hidden="true">
                      <path d="M4 0 L8 4 L4 8 L0 4 Z" fill="#B98A2E" />
                    </svg>
                  </span>
                  <span>{tip}</span>
                </li>
              ))}
            </ul>

            <p className="mt-6 text-[14px] text-ink-soft leading-relaxed">
              Mithila Jodi does not perform family verification or act as an intermediary between
              families. Family involvement is encouraged as a personal practice — the platform
              supports it by providing privacy controls and information sharing tools.
            </p>
          </div>
        </section>

        {/* ── Section 8: Our Commitment ─────────────────────────── */}
        <section className="bg-cream py-12 sm:py-16" aria-labelledby="s8-heading">
          <div className="wrap max-w-3xl">
            <div className="card p-7 sm:p-10">
              <div className="h-[3px] bg-gradient-to-r from-maroon-deep/20 via-gold to-maroon-deep/20 -mx-7 sm:-mx-10 -mt-7 sm:-mt-10 mb-8 rounded-t-mj" />
              <div className="flex items-start gap-5">
                <div className="shrink-0 w-12 h-12 rounded-full bg-maroon/8 border border-gold/30 flex items-center justify-center">
                  <ShieldIcon size={22} />
                </div>
                <div>
                  <p className="eyebrow mb-2">What we stand for</p>
                  <h2 id="s8-heading" className="font-serif text-maroon text-[22px] sm:text-[26px] mb-4 leading-snug">Our Commitment</h2>
                  <div className="space-y-3 text-ink-soft text-[15px] leading-relaxed">
                    <p>
                      Mithila Jodi is committed to operating the platform responsibly — with honest
                      verification, meaningful privacy controls, and genuine moderation of profiles
                      and photographs.
                    </p>
                    <p>
                      We do not make claims we cannot support. We do not pretend that technology
                      replaces human judgement in matrimonial matchmaking. We do not expose sensitive
                      member information to other users.
                    </p>
                    <p>
                      We will continue to improve the platform&apos;s safety and verification
                      capabilities over time — with transparency about what each feature does and
                      what it does not.
                    </p>
                    <p>
                      If you have concerns, feedback, or need assistance, we are here.{' '}
                      <Link href="/contact" className="text-maroon hover:underline underline-offset-2">
                        Contact us
                      </Link>{' '}
                      at any time.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ── FAQ ───────────────────────────────────────────────── */}
        <section id="faq" className="bg-paper py-12 sm:py-16" aria-label="Safety FAQ">
          <div className="wrap max-w-2xl">
            <div className="text-center mb-8">
              <p className="eyebrow mb-2">Common questions</p>
              <h2 className="section-heading text-2xl">Safety &amp; Verification FAQ</h2>
              <div className="ornament-line w-16 mx-auto mt-3" />
            </div>

            <div className="space-y-3">
              {FAQS.map(({ q, a }) => (
                <details key={q} className="card p-5 group">
                  <summary className="font-serif text-maroon text-[16px] sm:text-[17px] cursor-pointer list-none flex items-start justify-between gap-3">
                    <span>{q}</span>
                    <span className="text-gold text-xl leading-none shrink-0 transition-transform group-open:rotate-45" aria-hidden="true">+</span>
                  </summary>
                  <p className="text-ink-soft text-[14px] sm:text-[15px] leading-relaxed mt-3">{a}</p>
                </details>
              ))}
            </div>

            <div className="mt-10 flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/contact" className="btn-primary">Report a Profile</Link>
              <Link href="/help" className="btn-ghost">Help &amp; FAQ</Link>
            </div>
          </div>
        </section>

      </main>

      <MithilaFooter />
    </div>
  )
}
