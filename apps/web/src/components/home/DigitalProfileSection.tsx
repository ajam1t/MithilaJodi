import Link from 'next/link'
import '@/styles/digital-profile.css'
import { DemoPortrait } from '@/components/digital-profile/DemoPortrait'

/**
 * Homepage introduction to Digital Profiles. A static miniature of the demo's
 * opening card rather than the live renderer — the homepage should not pay
 * for the rotating card's script just to show a thumbnail.
 */
export function DigitalProfileSection() {
  return (
    <section id="digital-profile" className="bg-cream py-10 sm:py-14" aria-labelledby="home-dp">
      <div className="wrap grid items-center gap-8 lg:grid-cols-2">
        <div data-mj-reveal className="text-center lg:text-left">
          <p className="eyebrow mb-1.5">Digital Profiles</p>
          <h2 id="home-dp" className="font-serif text-[24px] leading-tight text-maroon sm:text-[30px] lg:text-[34px]">
            Beautiful profiles. Rooted in Mithila.
          </h2>
          <div className="ornament-line mx-auto mt-2 w-16 lg:mx-0" />
          <p className="mx-auto mt-3.5 max-w-lg text-[15px] leading-relaxed text-ink-soft lg:mx-0">
            Create a private, shareable matrimonial profile for your family and future match — gotra, mool and native
            village included. Send one link on WhatsApp, choose exactly what it shows, and turn it off whenever you like.
          </p>
          <ul className="mx-auto mt-4 inline-block space-y-1.5 text-left text-[14px] text-ink lg:mx-0">
            {['Opens beautifully on any phone — no app, no account', 'You choose every section; contact stays private', 'Set an expiry and see when it is opened'].map(x => (
              <li key={x} className="flex gap-2.5"><span className="text-marigold" aria-hidden="true">◆</span>{x}</li>
            ))}
          </ul>
          <div className="mt-5 flex flex-col justify-center gap-2.5 sm:flex-row lg:justify-start">
            <Link href="/digital-profile" className="btn-primary justify-center px-6 py-3 text-[15px]">Create Digital Profile</Link>
            <Link href="/digital-profile#demo" className="btn-ghost justify-center px-6 py-3 text-[15px]">Explore Digital Profiles</Link>
          </div>
        </div>

        <Link href="/digital-profile#demo" data-mj-reveal aria-label="See the demo Digital Profile"
          className="group mx-auto block w-full max-w-[340px] overflow-hidden rounded-[28px] border-[6px] border-[#2B211C] bg-paper shadow-mj transition-transform hover:-translate-y-1">
          <div className="dp-hero px-5 pb-6 pt-7 text-center">
            <p className="relative text-[9.5px] font-semibold uppercase tracking-[0.3em] text-gold-lt">Mithila Jodi · Digital Profile</p>
            <div className="dp-portrait relative mt-4 scale-[0.85]">
              <span className="dp-portrait-ring" aria-hidden="true" />
              <span className="dp-portrait-img"><DemoPortrait /></span>
            </div>
            <p className="relative mt-2 font-serif text-[26px] leading-tight">Amit Jha</p>
            <p className="relative text-[13px] text-cream/85">32 · Male · 6&apos;0&quot;</p>
            <p className="relative mt-1.5 text-[13px] text-cream">Mumbai, Maharashtra</p>
            <p className="relative text-[12px] italic text-gold-lt">Originally from Madhubani</p>
            <div className="relative mt-3 flex flex-wrap justify-center gap-1.5">
              <span className="dp-pill !text-[11.5px]">Maithil Brahmin</span>
              <span className="dp-pill !text-[11.5px]">Kashyapa Gotra</span>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-2 p-3">
            {[['Maternal gotra', 'Shandilya'], ['Mool', 'Sodarpur'], ['Native village', 'Rajnagar'], ['Career', 'Product Manager']].map(([l, v]) => (
              <div key={l} className="dp-tile">
                <p className="text-[9.5px] uppercase tracking-[0.12em] text-ink-soft">{l}</p>
                <p className="font-serif text-[14px] text-maroon">{v}</p>
              </div>
            ))}
          </div>
          <p className="pb-3 text-center text-[11px] font-semibold uppercase tracking-[0.18em] text-terra">Demo profile · tap to explore</p>
        </Link>
      </div>
    </section>
  )
}
