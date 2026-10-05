import Link from 'next/link'
import '@/styles/wedding.css'
import { SAMPLE_INVITE } from '@/lib/wedding/sample'
import { WeddingSite } from './site/WeddingSite'

const FEATURES = [
  ['✨', 'Opening animation', 'Madhubani art unfolds into शुभ विवाह and your names'],
  ['⏳', 'Live countdown', 'Days, hours and minutes to the muhurat'],
  ['🪔', 'Ceremony timeline', 'Tilak, Matkor, Haldi, Vivah, Vidai — or your own'],
  ['🌺', 'हमर मिथिला', 'Gaam, mool and gotra — only what you choose to show'],
  ['📍', 'Venue & directions', 'A map and one tap to Google Maps'],
  ['💌', 'WhatsApp replies', 'Guests answer हँ, अवश्य straight to your phone'],
  ['🎨', 'Five Mithila themes', 'Kohbar, Mithila Vivah, Madhubani Garden, Royal, Modern'],
  ['🔗', 'One link to share', 'Opens beautifully on any phone, no app needed'],
] as const

/** A phone showing the sample invitation — decorative, not interactive. */
export function PhonePreview({ className = '' }: { className?: string }) {
  return (
    <div className={`relative mx-auto w-[250px] sm:w-[280px] ${className}`} aria-hidden="true">
      <div className="overflow-hidden rounded-[34px] border-[9px] border-[#2B211C] bg-[#2B211C] shadow-mj">
        <div className="relative h-[480px] sm:h-[540px] overflow-hidden rounded-[25px] bg-white">
          <div className="pointer-events-none origin-top-left scale-[0.64] w-[156%]" inert>
            <WeddingSite invite={SAMPLE_INVITE} shareUrl="" mode="embedded" />
          </div>
        </div>
      </div>
    </div>
  )
}

/** Free card vs Premium experience — both free, for different needs. */
export function PremiumShowcase({ compact = false }: { compact?: boolean }) {
  return (
    <section id="premium" className="relative overflow-hidden bg-maroon-deep scroll-mt-20" aria-labelledby="premium-heading">
      <div className="gold-strip absolute top-0 inset-x-0" aria-hidden="true" />
      <div className="wrap relative grid gap-10 py-14 sm:py-16 lg:grid-cols-[1.1fr_0.9fr] lg:items-center">
        <div className="text-center lg:text-left">
          <p className="eyebrow !text-marigold mb-3">New · Free · No login</p>
          <h2 id="premium-heading" className="font-serif text-[30px] sm:text-[42px] leading-[1.1] text-cream">
            🌺 Premium Mithila Wedding Experience
          </h2>
          <p className="font-deva text-[18px] sm:text-[21px] text-gold-lt mt-3" lang="mai">अपन विवाह निमंत्रणके एकटा यादगार अनुभव बनाउ</p>
          <p className="text-paper-2/85 text-[15px] sm:text-[17px] leading-relaxed max-w-xl mx-auto lg:mx-0 mt-4">
            More than an invitation — your complete digital wedding story. A wedding website your guests open from
            WhatsApp, with the countdown, every ceremony, the venue and a way to reply.
          </p>
          {!compact && (
            <ul className="mt-7 grid gap-3 sm:grid-cols-2 text-left">
              {FEATURES.map(([icon, title, body]) => (
                <li key={title} className="flex gap-3 rounded-mj-sm border border-gold/25 bg-white/5 px-4 py-3">
                  <span className="text-[20px]" aria-hidden="true">{icon}</span>
                  <span><span className="block font-serif text-[16px] text-cream">{title}</span><span className="block text-[13px] text-paper-2/75 leading-snug">{body}</span></span>
                </li>
              ))}
            </ul>
          )}
          <div className="mt-8 flex flex-col sm:flex-row gap-3 justify-center lg:justify-start">
            <Link href="/marriage-invitation/premium#builder" className="btn justify-center text-center bg-gold-gradient text-maroon-deep font-semibold px-7 py-3.5 rounded-mj-sm shadow-mj-sm hover:-translate-y-px transition-transform">
              Create Premium Invitation →
            </Link>
            {compact && <Link href="/marriage-invitation/premium" className="btn justify-center text-center border border-gold/50 text-gold-lt px-6 py-3.5 rounded-mj-sm hover:bg-white/5">See everything it includes</Link>}
          </div>
          <p className="mt-4 text-[13px] text-paper-2/70">One short link to share. It is deleted automatically 180 days after you create it.</p>
        </div>
        <PhonePreview />
      </div>
    </section>
  )
}

/** Side by side: what each free tool is for. */
export function FreeVsPremium() {
  const rows: Array<[string, boolean, boolean]> = [
    ['Beautiful Mithila design', true, true],
    ['No login, no cost', true, true],
    ['Download as an image (PNG)', true, false],
    ['Interactive wedding website link', false, true],
    ['Opening animation and countdown', false, true],
    ['Ceremony timeline (Tilak to Vidai)', false, true],
    ['हमर मिथिला — gaam, mool, gotra', false, true],
    ['Venue map and directions', false, true],
    ['Guest replies on WhatsApp', false, true],
    ['Couple story and family section', false, true],
  ]
  return (
    <div className="overflow-x-auto rounded-mj border border-gold/30 bg-cream">
      <table className="w-full min-w-[480px] text-[14px]">
        <thead>
          <tr className="border-b border-gold/30 text-left">
            <th scope="col" className="px-4 py-3 font-medium text-ink-soft">Choose what suits you</th>
            <th scope="col" className="px-4 py-3 text-center font-serif text-[16px] text-maroon">Invitation card<span className="block font-sans text-[11px] font-normal text-ink-soft">Free</span></th>
            <th scope="col" className="px-4 py-3 text-center font-serif text-[16px] text-maroon">Premium experience<span className="block font-sans text-[11px] font-normal text-ink-soft">Free</span></th>
          </tr>
        </thead>
        <tbody>
          {rows.map(([label, free, premium]) => (
            <tr key={label} className="border-b border-gold/10 last:border-0">
              <th scope="row" className="px-4 py-2.5 text-left font-normal text-ink">{label}</th>
              {[free, premium].map((v, i) => (
                <td key={i} className="px-4 py-2.5 text-center">{v ? <span className="text-success-fg" aria-label="Included">✓</span> : <span className="text-ink-soft/50" aria-label="Not included">—</span>}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
