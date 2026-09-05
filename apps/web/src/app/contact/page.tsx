import type { Metadata } from 'next'
import Link from 'next/link'
import { MithilaHeader } from '@/components/home/MithilaHeader'
import { MithilaFooter } from '@/components/home/MithilaFooter'
import { ContactForm } from './ContactForm'
import { SITE_URL } from '@/lib/constants'

const SITE = SITE_URL
const PHONE_RAW   = '918898372628'
const PHONE_DISPLAY = '+91 8898372628'
const EMAIL       = 'contact@mithilajodi.com'

export const metadata: Metadata = {
  title: 'Contact Us — Mithila Jodi Support',
  description:
    'Get in touch with the Mithila Jodi team. Call or WhatsApp us at +91 8898372628, email us at contact@mithilajodi.com, or send a message using the contact form. We are here to help.',
  alternates: { canonical: `${SITE}/contact` },
  openGraph: {
    type: 'website',
    url: `${SITE}/contact`,
    siteName: 'Mithila Jodi',
    title: 'Contact Mithila Jodi — Get in Touch',
    description:
      'Reach the Mithila Jodi support team by phone, WhatsApp, or email. We are here to help with your profile, biodata, membership, or any other question.',
    images: ['/hero-couple.jpg'],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Contact Mithila Jodi',
    description: 'Call, WhatsApp or email the Mithila Jodi team. We are here to help.',
    images: ['/hero-couple.jpg'],
  },
}

const jsonLd = {
  '@context': 'https://schema.org',
  '@graph': [
    {
      '@type': 'ContactPage',
      '@id': `${SITE}/contact#webpage`,
      url: `${SITE}/contact`,
      name: 'Contact Us — Mithila Jodi Support',
      breadcrumb: { '@id': `${SITE}/contact#breadcrumb` },
      inLanguage: 'en',
    },
    {
      '@type': 'BreadcrumbList',
      '@id': `${SITE}/contact#breadcrumb`,
      itemListElement: [
        { '@type': 'ListItem', position: 1, name: 'Home',    item: SITE },
        { '@type': 'ListItem', position: 2, name: 'Contact', item: `${SITE}/contact` },
      ],
    },
    {
      '@type': 'Organization',
      '@id': `${SITE}/#organization`,
      name: 'Mithila Jodi',
      url: SITE,
      telephone: `+${PHONE_RAW}`,
      email: EMAIL,
      contactPoint: {
        '@type': 'ContactPoint',
        telephone: `+${PHONE_RAW}`,
        email: EMAIL,
        contactType: 'customer support',
        availableLanguage: ['English', 'Hindi'],
        areaServed: 'IN',
      },
    },
  ],
}

// ── Contact option cards ─────────────────────────────────────────────────────

function PhoneIcon() {
  return (
    <svg viewBox="0 0 24 24" width="24" height="24" fill="none" aria-hidden="true">
      <path
        d="M6.6 10.8c1.4 2.8 3.8 5.1 6.6 6.6l2.2-2.2c.3-.3.7-.4 1-.2 1.1.4 2.3.6 3.6.6.6 0 1 .4 1 1V20c0 .6-.4 1-1 1C10.6 21 3 13.4 3 4c0-.6.4-1 1-1h3.5c.6 0 1 .4 1 1 0 1.3.2 2.5.6 3.6.1.3 0 .7-.2 1L6.6 10.8Z"
        stroke="#7A1220" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"
      />
    </svg>
  )
}

function WhatsAppIcon() {
  return (
    <svg viewBox="0 0 24 24" width="24" height="24" fill="none" aria-hidden="true">
      <path
        d="M20.5 3.5A11.9 11.9 0 0 0 3.6 20.1L2 22l1.9-.5a11.9 11.9 0 1 0 16.6-18Z"
        stroke="#7A1220" strokeWidth="1.6" strokeLinejoin="round"
      />
      <path
        d="M9 11c.3.7.7 1.4 1.3 2 .6.6 1.3 1 2 1.3m-3.3-3.3c-.2-.4-.2-.9.1-1.2l.7-.8c.3-.3.3-.8.1-1.1L8.6 6.5c-.3-.4-.8-.4-1.1-.1l-.6.6A3.1 3.1 0 0 0 6.5 9c.2 1.3 1 3 2.5 4.5s3.2 2.3 4.5 2.5c.9.1 1.8-.2 2.4-.8l.6-.6c.3-.3.3-.8-.1-1.1l-1.4-1.1c-.3-.3-.8-.2-1.1.1l-.7.8c-.3.3-.8.4-1.2.1"
        stroke="#7A1220" strokeWidth="1.5" strokeLinecap="round"
      />
    </svg>
  )
}

function EmailIcon() {
  return (
    <svg viewBox="0 0 24 24" width="24" height="24" fill="none" aria-hidden="true">
      <rect x="3" y="5" width="18" height="14" rx="2" stroke="#7A1220" strokeWidth="1.6" />
      <path d="M3 7l9 6 9-6" stroke="#7A1220" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

const CONTACT_CARDS = [
  {
    icon: <PhoneIcon />,
    title: 'Call Us',
    desc: 'For general assistance and support.',
    detail: PHONE_DISPLAY,
    cta: 'Call Now',
    href: `tel:+${PHONE_RAW}`,
    primary: false,
  },
  {
    icon: <WhatsAppIcon />,
    title: 'WhatsApp Support',
    desc: 'For quick support and enquiries.',
    detail: PHONE_DISPLAY,
    cta: 'Chat on WhatsApp',
    href: `https://wa.me/${PHONE_RAW}`,
    primary: true,
  },
  {
    icon: <EmailIcon />,
    title: 'Email Us',
    desc: 'For detailed enquiries, feedback and support.',
    detail: EMAIL,
    cta: 'Send Email',
    href: `mailto:${EMAIL}`,
    primary: false,
  },
]

export default function ContactPage() {
  return (
    <div className="min-h-screen flex flex-col bg-paper overflow-x-clip">
      {/* eslint-disable-next-line react/no-danger */}
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <MithilaHeader />

      <main id="main-content" className="flex-1">

        {/* ── Hero ────────────────────────────────────────────── */}
        <section className="bg-cream py-14 sm:py-20">
          <div className="wrap max-w-2xl text-center">
            <nav aria-label="Breadcrumb" className="mb-6">
              <ol className="flex items-center justify-center gap-2 text-[13px] text-ink-soft">
                <li><Link href="/" className="hover:text-maroon transition-colors">Home</Link></li>
                <li aria-hidden="true" className="text-gold">›</li>
                <li className="text-maroon font-medium" aria-current="page">Contact</li>
              </ol>
            </nav>
            <p className="eyebrow mb-3">Get in Touch</p>
            <h1 className="section-heading text-3xl sm:text-4xl">Contact Mithila Jodi</h1>
            <div className="ornament-line w-20 mx-auto mt-4 mb-6" />
            <p className="text-ink-soft text-[17px] leading-relaxed max-w-xl mx-auto">
              Have a question, need help with your profile, or want to get in touch with our team?
              We are here to help.
            </p>
          </div>
        </section>

        {/* ── Contact cards ───────────────────────────────────── */}
        <section className="bg-paper py-12 sm:py-16" aria-label="Contact options">
          <div className="wrap max-w-3xl">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
              {CONTACT_CARDS.map(({ icon, title, desc, detail, cta, href, primary }) => (
                <div
                  key={title}
                  className={[
                    'relative flex flex-col gap-4 p-6 rounded-mj overflow-hidden',
                    primary
                      ? 'bg-cream border-2 border-gold shadow-mj'
                      : 'card',
                  ].join(' ')}
                >
                  {primary && (
                    <div className="absolute inset-x-0 top-0 h-[3px] bg-gradient-to-r from-maroon-deep/20 via-gold to-maroon-deep/20" />
                  )}

                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-maroon/8 flex items-center justify-center shrink-0">
                      {icon}
                    </div>
                    <h2 className="font-serif text-maroon text-[17px] leading-snug">{title}</h2>
                  </div>

                  <div className="flex-1">
                    <p className="text-ink-soft text-[13px] leading-relaxed mb-3">{desc}</p>
                    <p className={[
                      'font-serif font-medium leading-snug break-all',
                      primary ? 'text-maroon text-[15px]' : 'text-maroon text-[14px]',
                    ].join(' ')}>
                      {detail}
                    </p>
                  </div>

                  <a
                    href={href}
                    target={href.startsWith('http') ? '_blank' : undefined}
                    rel={href.startsWith('http') ? 'noopener noreferrer' : undefined}
                    className={[
                      'w-full text-center text-[14px] py-3 rounded-mj-sm',
                      primary ? 'btn-primary' : 'btn-ghost',
                    ].join(' ')}
                    aria-label={`${cta} — ${title}`}
                  >
                    {cta}
                  </a>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── Contact form ────────────────────────────────────── */}
        <section className="bg-cream py-12 sm:py-16" aria-label="Contact form">
          <div className="wrap max-w-2xl">
            <div className="text-center mb-8">
              <p className="eyebrow mb-2">Write to us</p>
              <h2 className="section-heading text-2xl">Send Us a Message</h2>
              <div className="ornament-line w-16 mx-auto mt-3 mb-4" />
              <p className="text-ink-soft text-[14px]">
                We will respond to your message as soon as we can.
              </p>
            </div>
            <ContactForm />
          </div>
        </section>

        {/* ── Safety notice ───────────────────────────────────── */}
        <section className="bg-paper py-8 sm:py-10" aria-label="Safety information">
          <div className="wrap max-w-2xl">
            <div className="flex gap-3 items-start rounded-mj-sm border border-gold/40 bg-cream px-5 py-4 shadow-mj-xs">
              <svg viewBox="0 0 22 22" width="20" height="20" fill="none" className="shrink-0 mt-0.5" aria-hidden="true">
                <path
                  d="M11 2 L19.5 6 L19.5 12 C19.5 16.4 15.8 19.9 11 21 C6.2 19.9 2.5 16.4 2.5 12 L2.5 6 Z"
                  stroke="#B98A2E" strokeWidth="1.5" strokeLinejoin="round"
                />
                <path d="M11 8 L11 11.5" stroke="#B98A2E" strokeWidth="1.8" strokeLinecap="round" />
                <circle cx="11" cy="14.5" r="0.9" fill="#B98A2E" />
              </svg>
              <div>
                <p className="text-[13px] font-semibold text-ink mb-1">Security Notice</p>
                <p className="text-[13px] text-ink-soft leading-relaxed">
                  For your security, never share your <strong className="text-ink">password</strong>,{' '}
                  <strong className="text-ink">OTP</strong>,{' '}
                  <strong className="text-ink">payment PIN</strong>,{' '}
                  <strong className="text-ink">card details</strong>, or other sensitive authentication
                  information through email, WhatsApp, or the contact form. Our team will never ask for these.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* ── Help link ───────────────────────────────────────── */}
        <section className="bg-cream py-10 sm:py-12">
          <div className="wrap max-w-2xl text-center">
            <p className="text-ink-soft text-[15px] mb-3">Still looking for an answer?</p>
            <Link
              href="/help"
              className="btn-ghost inline-flex items-center gap-2"
            >
              Visit our Help &amp; FAQ
              <svg viewBox="0 0 16 16" width="14" height="14" fill="none" aria-hidden="true">
                <path d="M3 8h10M9 4l4 4-4 4" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </Link>
          </div>
        </section>

      </main>

      <MithilaFooter />
    </div>
  )
}
