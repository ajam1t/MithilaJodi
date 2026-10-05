import Link from 'next/link'
import { DigitalProfileView } from '@/components/digital-profile/DigitalProfileView'
import { DEMO_PROFILE } from '@/lib/digitalProfileDemo'

/**
 * /digital-profile for visitors: what a Digital Profile is, the demo, and the
 * way in. Plain, specific language throughout — this page is what search
 * engines and answer engines read to learn what the product is.
 */

export const DIGITAL_PROFILE_FAQ: Array<{ q: string; a: string }> = [
  {
    q: 'What is a Mithila Jodi Digital Profile?',
    a: 'It is an online matrimonial profile you share with a link. It shows your details, photos and Mithila roots — gotra, maternal gotra, mool and native village — on a page designed for phones, so a family can open it straight from WhatsApp without an account.',
  },
  {
    q: 'How is a Digital Profile different from a marriage biodata?',
    a: 'A marriage biodata is a document — a PDF you download, print or forward. A Digital Profile is a living page: it always shows your latest details, you choose what it shows, you can make the link expire or turn it off, and you can see when it has been opened. Many families use both.',
  },
  {
    q: 'Can I share my Digital Profile on WhatsApp?',
    a: 'Yes. Your dashboard has a Share on WhatsApp button with a message you can edit, and a Copy Link button for anywhere else. The message contains only your link — no details from your profile.',
  },
  {
    q: 'Can I control what information people see?',
    a: 'Yes. Under “What people can see” you switch each section on or off — photos, about you, education, career, location, family, gotra, maternal gotra, mool, native village, lifestyle, what you are looking for and horoscope. Your contact details are off unless you turn them on.',
  },
  {
    q: 'Can I make my profile link expire?',
    a: 'Yes. Pick the date it stops working, change it later, or choose no expiry. After the date, anyone opening the link sees that it has expired.',
  },
  {
    q: 'Can I deactivate my shared profile link?',
    a: 'Yes. Turn the link off and it stops working immediately, everywhere it has been forwarded. When you want to share again you make a new link; the old one stays off.',
  },
  {
    q: 'Can I see how many times my profile was opened?',
    a: 'Yes. Your dashboard shows total opens, unique visitors and the date it was last opened, with a short list of recent activity. Your own visits and WhatsApp’s link previews are not counted, and no one’s identity, IP address or location is recorded.',
  },
  {
    q: 'Do I need to create a separate marriage biodata?',
    a: 'No. The Digital Profile is built from your Mithila Jodi profile. If your family also wants a printable document, the free marriage biodata maker makes one in Maithili, Hindi, English or Sanskrit.',
  },
  {
    q: 'Is the Digital Profile free?',
    a: 'Yes. Creating a Mithila Jodi account, building your profile and sharing your Digital Profile are free.',
  },
  {
    q: 'Who can view my Digital Profile?',
    a: 'Only people who have your link. It is not listed in search results — the page is kept out of Google — and you can turn the link off at any time. Because links can be forwarded, choose what it shows with that in mind.',
  },
  {
    q: 'Can I update my Digital Profile after sharing it?',
    a: 'Yes. The link always shows your current profile, so edits appear for everyone who already has it. You can also change what the link shows at any time without sending a new one.',
  },
]

const STEPS = [
  { t: 'Create your profile', b: 'Join Mithila Jodi free and fill in your details — gotra, mool and native village included.' },
  { t: 'Choose what to share', b: 'Switch each section on or off. Contact details stay private unless you decide otherwise.' },
  { t: 'Send your link', b: 'Share on WhatsApp or copy the link. It opens beautifully on any phone, no account needed.' },
  { t: 'Stay in control', b: 'See when it is opened, set an expiry date, or turn the link off whenever you like.' },
]

const CONTROLS = [
  { t: 'You choose every section', b: 'Photos, family, horoscope, gotra — each one on or off.' },
  { t: 'Private by default', b: 'Mobile number, email and address are never shown unless you turn them on.' },
  { t: 'Links that expire', b: 'Set a date, change it, or choose no expiry.' },
  { t: 'Turn it off instantly', b: 'One tap stops the link everywhere it was forwarded.' },
  { t: 'Know when it is opened', b: 'Opens, unique visitors and recent activity — no tracking of who.' },
  { t: 'Kept out of Google', b: 'Your profile is reached only through your link.' },
]

function Cta({ href, label, className = '' }: { href: string; label: string; className?: string }) {
  return <Link href={href} className={`btn-primary justify-center px-6 py-3 text-[15px] ${className}`}>{label}</Link>
}

export function DigitalProfileLanding({ ctaHref, member }: { ctaHref: string; member?: boolean }) {
  const cta = member ? 'Go to my Digital Profile' : 'Create My Digital Profile'
  return (
    <>
      {/* ── Hero ── */}
      <section className="dp-hero px-4 pb-12 pt-10 text-center sm:pb-16 sm:pt-14" aria-labelledby="dp-h1">
        <nav aria-label="Breadcrumb" className="relative mx-auto mb-6 max-w-3xl text-[12px] text-cream/75">
          <Link href="/" className="hover:text-cream">Home</Link> <span aria-hidden="true">›</span> <span aria-current="page">Digital Profile</span>
        </nav>
        <p className="relative text-[11px] font-semibold uppercase tracking-[0.34em] text-gold-lt">Mithila Jodi</p>
        <h1 id="dp-h1" className="relative mx-auto mt-3 max-w-3xl font-serif text-[34px] leading-[1.1] sm:text-[50px]">
          Mithila Jodi Digital Profile
        </h1>
        <p className="relative mt-3 font-serif text-[19px] italic text-gold-lt sm:text-[23px]">Your story. Your roots. Your future.</p>
        <p className="relative mx-auto mt-4 max-w-xl text-[15px] leading-relaxed text-cream/90 sm:text-[16px]">
          Create a beautiful, shareable matrimonial profile rooted in Mithila — and send it to family and potential matches with one link.
        </p>
        <div className="relative mt-7 flex flex-col items-center justify-center gap-3 sm:flex-row">
          <Link href={ctaHref} className="btn bg-gold-lt px-6 py-3 text-[15px] font-semibold text-maroon-deep shadow-mj hover:-translate-y-px">{cta}</Link>
          <a href="#demo" className="rounded-mj-sm border border-gold-lt/60 px-6 py-3 text-[15px] text-cream hover:bg-cream/10">See the demo profile ↓</a>
        </div>
        <p className="relative mt-4 text-[12.5px] text-cream/70">Free · Built for phones · You decide what it shows</p>
      </section>

      {/* ── What is it ── */}
      <section className="bg-cream px-4 py-10 sm:py-14" aria-labelledby="dp-what">
        <div className="mx-auto max-w-3xl">
          <p className="eyebrow mb-1.5 text-center">Definition</p>
          <h2 id="dp-what" className="text-center font-serif text-[26px] text-maroon sm:text-[32px]">What is a Digital Profile?</h2>
          <div className="ornament-line mx-auto mb-5 mt-2 w-16" />
          <p className="text-[15.5px] leading-relaxed text-ink">
            A <strong>Digital Profile</strong> is a shareable online matrimonial profile for Mithila and Maithili families. Instead of
            forwarding a PDF, you send one link. Whoever opens it — a relative, a family friend, a potential match — sees your
            profile on a page made for their phone, without needing an account.
          </p>
          <p className="mt-3 text-[15.5px] leading-relaxed text-ink-soft">
            It is built from your <Link href="/" className="text-maroon underline underline-offset-2">Mithila Jodi</Link> profile,
            so it always shows your latest details, and it reads the way a Maithil family reads a profile: name and age first,
            then gotra, maternal gotra, mool and native village, then education, career and family. You choose what it shows,
            you can make the link expire, and you can turn it off at any time.
          </p>
        </div>
      </section>

      {/* ── Demo ── */}
      <section id="demo" className="scroll-mt-20 bg-paper px-4 py-10 sm:py-14" aria-labelledby="dp-demo">
        <div className="mx-auto max-w-5xl lg:grid lg:grid-cols-[minmax(0,1fr)_minmax(0,500px)] lg:gap-10">
          <div className="mx-auto max-w-xl text-center lg:sticky lg:top-28 lg:self-start lg:pt-10 lg:text-left">
            <p className="eyebrow mb-1.5">Demo profile</p>
            <h2 id="dp-demo" className="font-serif text-[26px] leading-tight text-maroon sm:text-[32px]">See how a Digital Profile looks</h2>
            <p className="mt-3 text-[15px] leading-relaxed text-ink-soft">
              This is <strong className="text-ink">Amit Jha</strong> — a fictional profile we wrote to show the real thing. Scroll
              through it the way a family would after opening a link on WhatsApp.
            </p>
            <ul className="mx-auto mt-5 max-w-sm space-y-2 text-left text-[14px] text-ink">
              {['Mithila roots shown the way families read them', 'A rotating “at a glance” card', 'Every section is the owner’s choice', 'No phone number unless they share it'].map(x => (
                <li key={x} className="flex gap-2.5"><span className="text-marigold" aria-hidden="true">◆</span>{x}</li>
              ))}
            </ul>
          </div>
          <div className="mx-auto mt-6 w-full max-w-[500px] overflow-hidden rounded-[28px] border-[7px] border-[#2B211C] bg-paper shadow-mj lg:mt-0">
            <DigitalProfileView profile={DEMO_PROFILE} profileId={null} mode="demo" />
          </div>
        </div>
      </section>

      {/* ── Conversion ── */}
      <section className="bg-maroon-gradient px-4 py-10 text-center text-cream sm:py-12" aria-labelledby="dp-pdf">
        <h2 id="dp-pdf" className="font-serif text-[24px] leading-tight sm:text-[30px]">Your story deserves more than a PDF.</h2>
        <p className="mx-auto mt-2.5 max-w-xl text-[15px] leading-relaxed text-cream/90">
          Create your own Mithila Jodi Digital Profile and share it privately with family and potential matches.
        </p>
        <Link href={ctaHref} className="btn mt-5 bg-gold-lt px-6 py-3 text-[15px] font-semibold text-maroon-deep">{cta}</Link>
      </section>

      {/* ── How it works ── */}
      <section className="bg-cream px-4 py-10 sm:py-14" aria-labelledby="dp-how">
        <div className="mx-auto max-w-5xl">
          <h2 id="dp-how" className="text-center font-serif text-[26px] text-maroon sm:text-[32px]">How it works</h2>
          <div className="ornament-line mx-auto mb-6 mt-2 w-16" />
          <ol className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {STEPS.map((s, i) => (
              <li key={s.t} className="rounded-mj border border-gold/30 bg-paper p-4">
                <span className="grid h-8 w-8 place-items-center rounded-full bg-maroon font-serif text-[15px] text-gold-lt">{i + 1}</span>
                <h3 className="mt-2.5 font-serif text-[18px] text-maroon">{s.t}</h3>
                <p className="mt-1 text-[14px] leading-relaxed text-ink-soft">{s.b}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* ── Privacy & control ── */}
      <section className="bg-paper-2 px-4 py-10 sm:py-14" aria-labelledby="dp-control">
        <div className="mx-auto max-w-5xl">
          <h2 id="dp-control" className="text-center font-serif text-[26px] text-maroon sm:text-[32px]">Private, and always in your hands</h2>
          <p className="mx-auto mt-2 max-w-2xl text-center text-[15px] text-ink-soft">
            A link on WhatsApp travels. So the Digital Profile is built around what the link shows and how long it works.
          </p>
          <ul className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {CONTROLS.map(c => (
              <li key={c.t} className="rounded-mj border border-gold/30 bg-cream p-4">
                <h3 className="font-serif text-[17px] text-maroon">{c.t}</h3>
                <p className="mt-1 text-[14px] leading-relaxed text-ink-soft">{c.b}</p>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* ── vs biodata ── */}
      <section className="bg-cream px-4 py-10 sm:py-14" aria-labelledby="dp-vs">
        <div className="mx-auto max-w-3xl">
          <h2 id="dp-vs" className="text-center font-serif text-[26px] text-maroon sm:text-[32px]">Digital Profile or marriage biodata?</h2>
          <div className="ornament-line mx-auto mb-5 mt-2 w-16" />
          <div className="overflow-x-auto rounded-mj border border-gold/30">
            <table className="w-full min-w-[480px] bg-white text-left text-[14px]">
              <thead className="bg-paper-2 text-[12px] uppercase tracking-wide text-maroon">
                <tr><th className="px-3 py-2.5"> </th><th className="px-3 py-2.5">Digital Profile</th><th className="px-3 py-2.5">Marriage Biodata</th></tr>
              </thead>
              <tbody className="divide-y divide-paper-3 text-ink">
                {[
                  ['What it is', 'A living page, shared by link', 'A document — PDF or print'],
                  ['Stays up to date', 'Yes, always your latest details', 'A fixed copy'],
                  ['Choose what it shows', 'Any time, even after sharing', 'Before you download'],
                  ['Expiry and turn off', 'Yes', 'No — a file cannot be recalled'],
                  ['See when it is opened', 'Yes', 'No'],
                  ['Languages', 'English', 'Maithili, Hindi, English, Sanskrit'],
                ].map(([a, b, c]) => (
                  <tr key={a}><th scope="row" className="px-3 py-2.5 font-medium text-ink-soft">{a}</th><td className="px-3 py-2.5">{b}</td><td className="px-3 py-2.5">{c}</td></tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="mt-3 text-center text-[14px] text-ink-soft">
            Need a traditional document as well? <Link href="/marriage-biodata" className="text-maroon underline underline-offset-2">Make a free marriage biodata</Link>.
          </p>
        </div>
      </section>

      {/* ── FAQ ── */}
      <section className="bg-paper px-4 py-10 sm:py-14" aria-labelledby="dp-faq">
        <div className="mx-auto max-w-3xl">
          <h2 id="dp-faq" className="text-center font-serif text-[26px] text-maroon sm:text-[32px]">Questions families ask</h2>
          <div className="ornament-line mx-auto mb-5 mt-2 w-16" />
          <div className="space-y-2.5">
            {DIGITAL_PROFILE_FAQ.map(f => (
              <details key={f.q} className="group rounded-mj border border-gold/30 bg-cream px-4 py-3 open:shadow-mj-xs">
                <summary className="cursor-pointer list-none pr-6 font-serif text-[16.5px] leading-snug text-maroon [&::-webkit-details-marker]:hidden">
                  <h3 className="inline">{f.q}</h3>
                  <span className="float-right -mr-6 text-gold transition-transform group-open:rotate-45" aria-hidden="true">＋</span>
                </summary>
                <p className="mt-2 text-[14.5px] leading-relaxed text-ink-soft">{f.a}</p>
              </details>
            ))}
          </div>
          <p className="mt-5 text-center text-[14px] text-ink-soft">
            More about Mithila Jodi: <Link href="/about" className="text-maroon underline underline-offset-2">about us</Link> ·{' '}
            <Link href="/safety" className="text-maroon underline underline-offset-2">safety</Link> ·{' '}
            <Link href="/astrology/kundli-match" className="text-maroon underline underline-offset-2">Kundli match</Link>
          </p>
        </div>
      </section>

      {/* ── Final CTA ── */}
      <section className="dp-hero px-4 py-12 text-center sm:py-16" aria-labelledby="dp-ready">
        <h2 id="dp-ready" className="relative font-serif text-[26px] sm:text-[34px]">Ready to create yours?</h2>
        <p className="relative mx-auto mt-2 max-w-md text-[15px] text-cream/90">It takes a few minutes, and you can change everything later.</p>
        <Cta href={ctaHref} label={member ? 'Go to my Digital Profile' : 'Create Your Digital Profile — Free'} className="relative mt-6 !bg-gold-lt !text-maroon-deep" />
      </section>
    </>
  )
}
