import Image from 'next/image'
import Link from 'next/link'

const TRUST = [
  { title: 'Based on Vedic tradition', text: 'Lahiri sidereal zodiac, whole-sign houses, the North Indian chart.', icon: 'M12 3c2 3 2 6 0 9-2-3-2-6 0-9Zm-7 5c3 0 6 2 7 5-3 0-6-2-7-5Zm14 0c-1 3-4 5-7 5 1-3 4-5 7-5ZM4 16h16' },
  { title: 'Mithila astrological practice', text: 'Ashtakoota, Manglik and muhurat as Mithila families use them.', icon: 'M4 20V10l8-6 8 6v10M9 20v-6h6v6M12 4V2' },
  { title: 'Simple & easy to use', text: 'Birth details or a PIN code — results explained in plain words.', icon: 'M5 12l4 4 10-10' },
  { title: 'Private & secure', text: 'Free, no login, and nothing you enter is stored.', icon: 'M12 3l7 3v5c0 5-3 8-7 10-4-2-7-5-7-10V6l7-3Z' },
]

export function HubTrust() {
  return (
    <ul className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4" role="list">
      {TRUST.map(t => (
        <li key={t.title} className="flex flex-col items-center rounded-[16px] border border-[#C99532]/30 bg-[#FFFCF6] px-3 py-4 text-center shadow-mj-xs sm:flex-row sm:items-start sm:gap-3 sm:px-4 sm:text-left">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[radial-gradient(circle_at_35%_30%,#9B2233,#650C28)] ring-2 ring-[#E8C878]/60">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#F1D58A" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d={t.icon} /></svg>
          </span>
          <span className="mt-2 sm:mt-0">
            <span className="block font-serif text-[15px] leading-tight text-maroon sm:text-[17px]">{t.title}</span>
            <span className="mt-1 block text-[12px] leading-snug text-ink-soft sm:text-[13px]">{t.text}</span>
          </span>
        </li>
      ))}
    </ul>
  )
}

/** Sunset over the river, palaces and the wedding — the page's closing note. */
export function HubClosing() {
  return (
    <section className="relative isolate overflow-hidden" aria-labelledby="closing-title">
      <Image
        src="/hero-couple.jpg"
        alt="A Mithila wedding by the river at sunset, the couple exchanging garlands before the palaces"
        fill
        sizes="100vw"
        className="-z-10 object-cover object-[50%_32%]"
      />
      <div className="absolute inset-0 -z-10 bg-[linear-gradient(180deg,#FCF5E7_0%,rgba(252,245,231,0.82)_22%,rgba(232,145,42,0.22)_60%,rgba(101,12,40,0.55)_100%)]" />
      <div className="absolute inset-0 -z-10 bg-[radial-gradient(ellipse_60%_70%_at_50%_45%,rgba(255,248,236,0.85),rgba(255,248,236,0.2)_70%,transparent)]" />
      <div className="wrap flex min-h-[260px] flex-col items-center justify-center py-12 text-center sm:min-h-[340px]">
        <svg width="46" height="26" viewBox="0 0 46 26" aria-hidden="true" className="mb-2">
          <path d="M23 2c3 5 3 10 0 15-3-5-3-10 0-15ZM11 9c5 0 10 3 12 8-5 0-10-3-12-8Zm24 0c-2 5-7 8-12 8 2-5 7-8 12-8ZM6 21h34" fill="#E98AA6" stroke="#C99532" strokeWidth="0.8" />
        </svg>
        <h2 id="closing-title" className="font-hand text-[34px] leading-tight text-[#8B1235] sm:text-[46px]">
          Same Stars.<br className="sm:hidden" /> A Brighter Together. <span aria-hidden="true">❤️</span>
        </h2>
        <p className="mt-2 text-[15px] text-ink sm:text-[17px]">Let ancient wisdom guide your new beginning.</p>
        <div className="mt-6 flex flex-col gap-3 sm:flex-row">
          <Link href="/astrology/kundli-match" className="kd-cta !min-h-[48px] !text-[15px]">Match two kundlis</Link>
          <Link href="/register" className="btn-ghost min-h-[48px] !px-6 bg-[#FFFCF6]/80">Create your free profile</Link>
        </div>
      </div>
    </section>
  )
}
