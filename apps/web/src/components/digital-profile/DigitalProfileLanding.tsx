import Image from 'next/image'
import Link from 'next/link'
import { DEMO_PROFILE, SAMPLE_PROFILE_PATH } from '@/lib/digitalProfileDemo'

/**
 * /digital-profile for visitors. Built to the product reference: the promise
 * ("your biodata, now beautifully shareable"), the sample profile as a real
 * product preview, Mithila fields, sharing, how it works, privacy, a
 * comparison, and the way in. All sample content comes from DEMO_PROFILE, the
 * same data the full sample page renders.
 */

const P = DEMO_PROFILE
const height = (cm: number | null) => {
  if (!cm) return ''
  const inches = Math.round(cm / 2.54)
  return `${Math.floor(inches / 12)}'${inches % 12}"`
}
const META = `${P.age} · ${P.gender} · ${height(P.heightCm)}`
const PILLS = [P.community?.caste, P.community?.selfGotra ? `${P.community.selfGotra} Gotra` : null].filter(Boolean) as string[]

// ─── Small pieces ───────────────────────────────────────────────────────────

const GOLD = '#B98A2E'

function Icon({ d, className = 'h-5 w-5' }: { d: string; className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d={d} />
    </svg>
  )
}
const ICON = {
  user: 'M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8Zm-7 8c.8-3.6 3.6-6 7-6s6.2 2.4 7 6',
  eye: 'M2 12s3.6-7 10-7 10 7 10 7-3.6 7-10 7S2 12 2 12Zm10 3a3 3 0 1 0 0-6 3 3 0 0 0 0 6Z',
  arrow: 'M5 12h14M13 6l6 6-6 6',
  shield: 'M12 3 19 6v5.5c0 4.4-3 7.9-7 9.5-4-1.6-7-5.1-7-9.5V6Z',
  lock: 'M6 11h12v9H6Zm2.5 0V8a3.5 3.5 0 0 1 7 0v3',
  pin: 'M12 21s-6.5-6.2-6.5-11a6.5 6.5 0 0 1 13 0c0 4.8-6.5 11-6.5 11Zm0-8.5a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5Z',
  layout: 'M4 5h16v14H4ZM4 10h16M10 10v9',
  list: 'M7 4h10l3 3v13H4V4h3Zm2 6h6m-6 4h6m-6 4h4',
  lotus: 'M12 20c-4.5 0-8-2-8-5 2.5 0 5 1.5 8 5Zm0 0c4.5 0 8-2 8-5-2.5 0-5 1.5-8 5Zm0 0c-2.5-2.5-3.5-6-2-10 1 1 2 3 2 5 0-2 1-4 2-5 1.5 4 .5 7.5-2 10Z',
  share: 'M18 8a3 3 0 1 0 0-6 3 3 0 0 0 0 6ZM6 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6Zm12 7a3 3 0 1 0 0-6 3 3 0 0 0 0 6ZM8.6 13.5l6.8 4M15.4 6.5l-6.8 4',
  device: 'M7 3h10v18H7ZM11 18h2',
  pen: 'M4 20l4.5-1 10-10-3.5-3.5-10 10ZM14 6.5l3.5 3.5',
  clock: 'M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18Zm0-13v4.5l3 2',
  doc: 'M7 3h7l4 4v14H7ZM14 3v4h4M10 12h5m-5 4h5',
  gear: 'M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6Zm7.4-1.5 1.6 1.2-2 3.4-1.9-.7a7 7 0 0 1-1.7 1l-.3 2h-4l-.3-2a7 7 0 0 1-1.7-1l-1.9.7-2-3.4 1.6-1.2a7 7 0 0 1 0-2l-1.6-1.2 2-3.4 1.9.7a7 7 0 0 1 1.7-1l.3-2h4l.3 2a7 7 0 0 1 1.7 1l1.9-.7 2 3.4-1.6 1.2a7 7 0 0 1 0 2Z',
  send: 'M21 3 10 14M21 3l-7 18-4-7-7-4Z',
  question: 'M9.5 9a2.5 2.5 0 1 1 3.5 2.3c-.6.3-1 .9-1 1.6V14M12 17.5v.01',
}

/** Madhubani-style lotus spray for corners. Decorative. */
function FloralSpray({ className = '', flip = false }: { className?: string; flip?: boolean }) {
  return (
    <svg viewBox="0 0 160 160" className={className} style={flip ? { transform: 'scaleX(-1)' } : undefined} aria-hidden="true">
      <g fill="none" stroke={GOLD} strokeWidth="1.2" strokeOpacity="0.7">
        <path d="M20 150C50 120 70 90 80 40" />
        <path d="M80 40c10 30 30 60 60 90" strokeOpacity="0.45" />
      </g>
      {[[34, 128, -30], [52, 104, -20], [66, 78, -12], [104, 92, 22], [122, 112, 30]].map(([x, y, r], i) => (
        <path key={i} d="M0 0C-8-6-10-16-4-24 2-16 4-6 0 0Z" transform={`translate(${x} ${y}) rotate(${r}) scale(1.6)`} fill="#C9A24A" fillOpacity="0.35" stroke={GOLD} strokeWidth="0.8" />
      ))}
      <g transform="translate(80 40)">
        <path d="M0 0C-6-8-6-20 0-30 6-20 6-8 0 0Z" fill="#9E1C3E" />
        <path d="M0 0C-11-3-17-11-18-21-9-19-3-11 0 0ZM0 0C11-3 17-11 18-21 9-19 3-11 0 0Z" fill="#7A1220" />
        <path d="M0 0C-15 0-23-6-27-13-17-14-8-8 0 0ZM0 0C15 0 23-6 27-13 17-14 8-8 0 0Z" fill="#B8323F" />
        <circle cx="0" cy="-3" r="2.4" fill="#E4C572" />
      </g>
    </svg>
  )
}

function Eyebrow({ children }: { children: React.ReactNode }) {
  return <p className="text-[11px] font-semibold uppercase tracking-[0.26em] text-terra sm:text-[12px]">{children}</p>
}

// ─── The phone: the sample Digital Profile as a product preview ─────────────

function PhonePreview() {
  return (
    <div className="relative mx-auto w-[260px] sm:w-[290px]" aria-hidden="true">
      <div className="overflow-hidden rounded-[40px] border-[9px] border-[#211915] bg-[#211915] shadow-[0_30px_60px_-24px_rgba(58,20,12,0.6)]">
        <div className="relative overflow-hidden rounded-[31px] bg-cream">
          {/* app bar */}
          <div className="flex items-center justify-between px-3.5 pb-2 pt-3">
            <Icon d="M15 6l-6 6 6 6" className="h-4 w-4 text-maroon" />
            <span className="flex items-center gap-1.5">
              <Image src="/logo-mark.png" alt="" width={24} height={22} className="h-[22px] w-auto" />
              <span className="font-serif text-[14px] leading-none text-maroon">Mithila Jodi</span>
            </span>
            <Icon d="M4 7h16M4 12h16M4 17h16" className="h-4 w-4 text-maroon" />
          </div>
          {/* photo */}
          <div className="relative mx-3 overflow-hidden rounded-[18px]">
            <Image src={P.photos[0]} alt="" width={640} height={800} className="aspect-[5/4] w-full object-cover object-[center_22%]" priority />
          </div>
          <div className="relative -mt-4 flex justify-center">
            <span className="grid h-8 w-8 place-items-center rounded-full border border-gold/60 bg-cream text-maroon"><Icon d={ICON.lotus} className="h-4 w-4" /></span>
          </div>
          {/* identity */}
          <div className="px-4 pb-3 pt-1 text-center">
            <p className="font-serif text-[20px] leading-tight text-maroon">{P.displayName}</p>
            <p className="mt-0.5 text-[11.5px] text-ink-soft">{META}</p>
            <p className="mt-1 flex items-center justify-center gap-1 text-[11.5px] text-ink"><Icon d={ICON.pin} className="h-3 w-3 text-maroon" />{P.location?.current}</p>
            <p className="text-[11px] italic text-[#9A6F1E]">Originally from {P.location?.native}</p>
            <div className="mt-2 flex flex-wrap justify-center gap-1.5">
              {PILLS.map(x => <span key={x} className="rounded-full border border-gold/50 bg-paper px-2 py-0.5 text-[10px] text-maroon">{x}</span>)}
            </div>
            <span className="mt-3 inline-block w-full rounded-full bg-maroon-gradient py-2 text-[12px] font-semibold text-cream">View Full Profile</span>
          </div>
          {/* tabs */}
          <div className="grid grid-cols-4 border-t border-gold/25 bg-paper-2/60 px-1 py-1.5 text-center text-[9.5px] text-ink-soft">
            {[['About', ICON.user], ['Education', ICON.doc], ['Family', ICON.lotus], ['Lifestyle', ICON.clock]].map(([l, d], i) => (
              <span key={l} className={`flex flex-col items-center gap-0.5 ${i === 0 ? 'text-maroon' : ''}`}><Icon d={d} className="h-3.5 w-3.5" />{l}</span>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

/** The compact card in "Here's what your family will see". */
function PreviewCard() {
  return (
    <div className="overflow-hidden rounded-[18px] border border-gold/35 bg-white p-2.5 shadow-mj-sm">
      <Image src={P.photos[0]} alt={`${P.displayName}, sample Digital Profile`} width={640} height={800} className="aspect-[16/10] w-full rounded-[12px] object-cover object-[center_22%]" />
      <div className="px-1.5 pb-1.5 pt-2.5">
        <p className="font-serif text-[18px] leading-tight text-maroon">{P.displayName}</p>
        <p className="mt-0.5 text-[12px] text-ink-soft">{META}</p>
        <p className="mt-1 flex items-center gap-1 text-[12px] text-ink"><Icon d={ICON.pin} className="h-3.5 w-3.5 text-maroon" />{P.location?.current}</p>
        <p className="flex items-center gap-1 text-[12px] italic text-[#9A6F1E]"><Icon d={ICON.pin} className="h-3.5 w-3.5" />Originally from {P.location?.native}</p>
        <div className="mt-2 flex flex-wrap gap-1.5">
          {PILLS.map(x => <span key={x} className="rounded-full border border-gold/45 bg-paper px-2.5 py-0.5 text-[11px] text-maroon">{x}</span>)}
        </div>
      </div>
    </div>
  )
}

// ─── Content ────────────────────────────────────────────────────────────────

const BENEFITS: Array<[string, string]> = [
  ['Beautiful layout', ICON.layout], ['All important details', ICON.list], ['Mithila cultural fields', ICON.lotus],
  ['Easy to share', ICON.share], ['Works on any device', ICON.device],
]

const ROOTS: Array<{ title: string; sub: string; deva?: boolean; icon: React.ReactNode }> = [
  { title: 'गोत्र', sub: 'Your family lineage', deva: true, icon: <Icon d="M5 19c6-1 11-6 13-14-7 1-12 6-13 14Zm0 0 7-7" className="h-9 w-9" /> },
  { title: 'मातृक गोत्र', sub: 'Maternal lineage', deva: true, icon: <Icon d="M12 21v-7m0 0c-3 0-6-2-6-5s3-5 6-6c3 1 6 3 6 6s-3 5-6 5Zm-3 7h6M9 9h.01M12 7h.01M15 9h.01M12 11h.01" className="h-9 w-9" /> },
  { title: 'मूल / ग्राम', sub: 'Your ancestral roots', deva: true, icon: <Icon d="M4 21h16M6 21V10m12 11V10M4 10h16L12 4ZM10 21v-5h4v5M9 13h.01M15 13h.01" className="h-9 w-9" /> },
  { title: 'Native Village', sub: 'Where your family comes from', icon: <Icon d={ICON.pin} className="h-9 w-9" /> },
]

const MORE: Array<[string, string, string]> = [
  ['Share', 'Send one beautiful link on WhatsApp.', ICON.share],
  ['Update', 'Your latest details always appear.', ICON.pen],
  ['Control', 'Choose what people can see.', ICON.shield],
  ['Expire', 'Set an expiry date or turn it off anytime.', ICON.clock],
]

const STEPS: Array<[string, string, string]> = [
  ['01', 'Create your profile', ICON.doc], ['02', 'Choose what to share', ICON.gear],
  ['03', 'Send your link', ICON.send], ['04', 'Stay in control', ICON.shield],
]

const PRIVACY = ['You choose every section', 'Private by default', 'Links that expire', 'Turn it off instantly', 'Know when it is opened', 'Kept out of Google']

const COMPARE: Array<[string, string, string]> = [
  ['Share', 'One link (WhatsApp ready)', 'Send file / attachment'],
  ['Updates', 'Always current', 'Need a new PDF'],
  ['Privacy', 'You control what people see', 'Once shared, can’t recall'],
  ['Expiry', 'Set expiry or turn off anytime', 'No expiry'],
  ['WhatsApp', 'Open with one tap', 'Upload / attach file'],
]

function Check() {
  return (
    <svg viewBox="0 0 16 16" className="h-4 w-4 shrink-0" aria-hidden="true">
      <circle cx="8" cy="8" r="7.2" fill={GOLD} />
      <path d="M4.6 8.3 7 10.6l4.4-4.8" fill="none" stroke="#FFFAF0" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

const WA = 'M12 2a10 10 0 0 0-8.6 15.1L2 22l5-1.3A10 10 0 1 0 12 2Zm5.2 14.1c-.2.6-1.3 1.2-1.8 1.2-.5.1-1 .2-3.3-.7-2.8-1.1-4.6-4-4.7-4.2-.1-.2-1.1-1.5-1.1-2.8 0-1.3.7-2 1-2.3.2-.3.5-.3.7-.3h.5c.2 0 .4 0 .6.5l.8 2c.1.2.1.4 0 .6l-.4.6-.4.4c-.1.2-.3.3-.1.6.2.3.8 1.3 1.7 2.1 1.1 1 2 1.3 2.3 1.4.3.1.5.1.6-.1l.9-1.1c.2-.3.4-.2.7-.1l1.9.9c.3.1.5.2.5.3.1.2.1.7-.1 1.4Z'

// ─── Page ───────────────────────────────────────────────────────────────────

export function DigitalProfileLanding({ ctaHref, member }: { ctaHref: string; member?: boolean }) {
  const cta = member ? 'Go to My Digital Profile' : 'Create My Digital Profile'
  return (
    <div className="overflow-x-clip">
      {/* ── Hero ── */}
      <section className="relative bg-[radial-gradient(ellipse_80%_70%_at_80%_20%,#FBEEDF,transparent_70%)] pb-10 pt-8 sm:pb-14 sm:pt-12" aria-labelledby="dp-h1">
        <FloralSpray className="pointer-events-none absolute -right-6 bottom-0 hidden h-56 w-56 opacity-80 lg:block" />
        <div className="wrap grid items-center gap-9 lg:grid-cols-[1.08fr_0.92fr]">
          <div>
            <Eyebrow>Mithila Jodi Digital Profile</Eyebrow>
            <h1 id="dp-h1" className="mt-3 font-display text-[36px] leading-[1.06] text-maroon sm:text-[48px] lg:text-[56px]">
              Your Biodata, Now <span className="block text-[#9A6F1E]">Beautifully Shareable.</span>
            </h1>
            <p className="mt-3 text-[17px] text-ink sm:text-[19px]">A private digital matrimonial profile rooted in Mithila.</p>
            <p className="mt-3 max-w-xl text-[15px] leading-relaxed text-ink-soft sm:text-[16px]">
              Share one beautiful link with family and potential matches. Show your story, education, career, family
              and Mithila roots exactly the way you choose.
            </p>
            <div className="mt-6 flex max-w-sm flex-col gap-3">
              <Link href={ctaHref} className="btn-primary justify-center gap-2 rounded-full px-6 py-3.5 text-[16px]">
                <Icon d={ICON.user} className="h-[18px] w-[18px]" />{cta}<Icon d={ICON.arrow} className="h-4 w-4" />
              </Link>
              <Link href={SAMPLE_PROFILE_PATH} className="btn justify-center gap-2 rounded-full border border-maroon/40 bg-cream px-6 py-3.5 text-[16px] font-semibold text-maroon hover:bg-white">
                <Icon d={ICON.eye} className="h-[18px] w-[18px]" />View Sample Profile<Icon d={ICON.arrow} className="h-4 w-4" />
              </Link>
            </div>
            <ul className="mt-5 flex flex-wrap items-center gap-x-5 gap-y-2 text-[14px] text-ink">
              <li className="flex items-center gap-1.5"><Icon d={ICON.shield} className="h-[18px] w-[18px] text-terra" />Free</li>
              <li className="flex items-center gap-1.5"><Icon d={ICON.lock} className="h-[18px] w-[18px] text-[#9A6F1E]" />Private</li>
              <li className="flex items-center gap-1.5">
                <svg viewBox="0 0 24 24" className="h-[18px] w-[18px]" fill="#1F7A47" aria-hidden="true"><path d={WA} /></svg>WhatsApp Ready
              </li>
            </ul>
          </div>

          <div className="relative">
            <PhonePreview />
            <p className="pointer-events-none absolute -right-2 top-14 hidden w-32 rotate-[-6deg] font-hand text-[19px] leading-snug text-[#9A6F1E] xl:block" aria-hidden="true">
              A beautiful link for a brighter beginning <span className="text-maroon">♥</span>
            </p>
          </div>
        </div>
      </section>

      {/* ── See it before you create it ── */}
      <section className="wrap" aria-labelledby="dp-see">
        <div className="grid items-center gap-6 rounded-[24px] border border-gold/30 bg-[#FBF0EA] p-5 shadow-mj-xs sm:p-7 lg:grid-cols-[1fr_minmax(0,300px)_minmax(0,250px)]">
          <div>
            <Eyebrow>See it before you create it</Eyebrow>
            <h2 id="dp-see" className="mt-2 font-display text-[28px] leading-tight text-maroon sm:text-[34px]">Here’s what your family will see.</h2>
            <p className="mt-2 text-[15.5px] text-ink-soft">A clean, elegant and culturally rooted digital profile.</p>
            <Link href={SAMPLE_PROFILE_PATH} className="btn-primary mt-5 inline-flex gap-2 rounded-full px-6 py-3 text-[15px]">
              Open Full Sample Profile<Icon d={ICON.arrow} className="h-4 w-4" />
            </Link>
          </div>
          <PreviewCard />
          <ul className="grid gap-2">
            {BENEFITS.map(([t, d]) => (
              <li key={t} className="flex items-center gap-3 rounded-[12px] border border-gold/25 bg-cream px-3.5 py-2.5 text-[14px] text-ink">
                <span className="text-[#9A6F1E]"><Icon d={d} /></span>{t}
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* ── Mithila fields ── */}
      <section className="relative py-10 sm:py-14" aria-labelledby="dp-roots">
        <FloralSpray className="pointer-events-none absolute left-0 top-2 hidden h-28 w-28 opacity-40 sm:block" />
        <FloralSpray flip className="pointer-events-none absolute right-0 top-2 hidden h-28 w-28 opacity-40 sm:block" />
        <div className="wrap">
          <h2 id="dp-roots" className="text-center font-display text-[24px] leading-tight text-ink sm:text-[30px]">
            Built for the way <span className="text-[#9A6F1E]">Mithila families</span> look at a biodata
          </h2>
          <ul className="mt-6 grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
            {ROOTS.map(r => (
              <li key={r.title} className="flex flex-col items-center rounded-[16px] border border-gold/40 bg-white px-3 py-5 text-center shadow-mj-xs">
                <span className="text-[#9A6F1E]">{r.icon}</span>
                <span className={`mt-2 text-[20px] leading-tight text-maroon sm:text-[22px] ${r.deva ? 'font-deva' : 'font-serif'}`}>{r.title}</span>
                <span className="mt-1 text-[13px] text-ink-soft">{r.sub}</span>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* ── Sharing ── */}
      <section className="wrap" aria-label="Sharing">
        <div className="grid gap-8 lg:grid-cols-2 lg:gap-0">
          <div className="lg:border-r lg:border-gold/30 lg:pr-10">
            <h2 className="font-display text-[26px] text-maroon sm:text-[30px]">One link. Send it anywhere.</h2>
            <p className="mt-2 text-[15.5px] text-ink">No PDF attachment. No complicated forms. Just send your Mithila Jodi profile link.</p>
            <ol className="mt-6 flex items-start justify-between gap-2 text-center text-[13.5px] text-ink">
              <li className="flex w-24 flex-col items-center gap-2">
                <span className="grid h-16 w-14 place-items-center rounded-[10px] border-2 border-maroon text-maroon"><Icon d={ICON.user} className="h-7 w-7" /></span>Your Profile
              </li>
              <li className="pt-5 text-[22px] text-ink" aria-hidden="true">→</li>
              <li className="flex w-24 flex-col items-center gap-2">
                <svg viewBox="0 0 24 24" className="h-16 w-16" fill="#25D366" aria-hidden="true"><path d={WA} /></svg>WhatsApp
              </li>
              <li className="pt-5 text-[22px] text-ink" aria-hidden="true">→</li>
              <li className="flex w-24 flex-col items-center gap-2">
                <span className="grid h-16 w-16 place-items-center text-maroon">
                  <svg viewBox="0 0 32 32" className="h-14 w-14" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" aria-hidden="true"><circle cx="12" cy="11" r="4.5" /><circle cx="22" cy="12.5" r="3.5" /><path d="M4 26c.8-5 4-7.5 8-7.5s7.2 2.5 8 7.5M19.5 19c3.5-.6 7 1.3 8 6" /></svg>
                </span>Family / Potential Match
              </li>
            </ol>
          </div>
          <div className="lg:pl-10">
            <h2 className="font-display text-[26px] text-maroon sm:text-[30px]">One link. More than a biodata.</h2>
            <ul className="mt-5 grid grid-cols-1 gap-3 min-[420px]:grid-cols-2">
              {MORE.map(([t, b, d]) => (
                <li key={t} className="flex items-start gap-3 rounded-[14px] border border-gold/25 bg-white p-3.5 shadow-mj-xs">
                  <span className="mt-0.5 text-[#9A6F1E]"><Icon d={d} className="h-6 w-6" /></span>
                  <span><span className="block text-[15px] font-semibold text-ink">{t}</span><span className="block text-[13px] leading-snug text-ink-soft">{b}</span></span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      {/* ── How it works ── */}
      <section className="wrap mt-10 sm:mt-14" aria-labelledby="dp-how">
        <div className="rounded-[24px] border border-gold/25 bg-[#FBF0EA] px-4 py-6 sm:px-6">
          <h2 id="dp-how" className="text-center font-display text-[26px] text-maroon sm:text-[30px]">How It Works</h2>
          <ol className="mt-5 grid grid-cols-2 gap-3 lg:grid-cols-[1fr_auto_1fr_auto_1fr_auto_1fr] lg:items-center">
            {STEPS.map(([n, t, d], i) => (
              <li key={n} className="contents">
                <div className="flex items-center gap-3 rounded-[14px] bg-cream px-3 py-3 shadow-mj-xs">
                  <span className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-[#F6E3B8] text-[#9A6F1E]"><Icon d={d} /></span>
                  <span><span className="block font-display text-[20px] leading-none text-maroon">{n}</span><span className="mt-1 block text-[13px] leading-snug text-ink">{t}</span></span>
                </div>
                {i < STEPS.length - 1 && <span className="hidden text-[20px] text-ink-soft lg:block" aria-hidden="true">→</span>}
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* ── Privacy ── */}
      <section className="wrap mt-5" aria-labelledby="dp-privacy">
        <div className="relative overflow-hidden rounded-[20px] border border-gold/30 bg-white px-5 py-5 shadow-mj-xs sm:px-7">
          <FloralSpray flip className="pointer-events-none absolute -bottom-6 -right-4 hidden h-28 w-28 opacity-40 sm:block" />
          <div className="flex items-start gap-4">
            <span className="hidden h-12 w-12 shrink-0 place-items-center rounded-full bg-maroon text-cream sm:grid"><Icon d={ICON.lock} className="h-6 w-6" /></span>
            <div className="min-w-0">
              <h2 id="dp-privacy" className="font-display text-[24px] text-maroon sm:text-[28px]">Your Privacy, Our Priority</h2>
              <p className="text-[14.5px] text-ink-soft">You decide what your profile reveals.</p>
              <ul className="mt-4 grid grid-cols-2 gap-x-4 gap-y-2.5 sm:grid-cols-3 lg:grid-cols-6">
                {PRIVACY.map(x => <li key={x} className="flex items-center gap-2 text-[13px] leading-snug text-ink"><Check />{x}</li>)}
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* ── Comparison + FAQ ── */}
      <section className="wrap mt-10 grid gap-5 pb-8 sm:mt-14 sm:pb-10 lg:grid-cols-[1.55fr_1fr]" aria-label="Comparison and questions">
        <div className="min-w-0">
          <h2 className="font-display text-[24px] text-maroon sm:text-[28px]">Digital Profile vs Traditional Biodata</h2>
          <div className="mt-3 overflow-x-auto rounded-[14px] border border-gold/30 bg-white">
            <table className="w-full text-left text-[12.5px] sm:text-[13.5px]">
              <thead>
                <tr>
                  <th scope="col" className="bg-paper-2/70 px-2.5 py-2.5 font-semibold text-ink sm:px-3">Feature</th>
                  <th scope="col" className="bg-maroon px-2.5 py-2.5 font-semibold leading-snug text-cream sm:px-3">Mithila Jodi Digital Profile</th>
                  <th scope="col" className="bg-ink-soft px-2.5 py-2.5 font-semibold leading-snug text-cream sm:px-3">Traditional Biodata (PDF)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-paper-3">
                {COMPARE.map(([f, a, b]) => (
                  <tr key={f}>
                    <th scope="row" className="px-2.5 py-2.5 font-semibold text-ink sm:px-3">{f}</th>
                    <td className="px-2.5 py-2.5 leading-snug text-ink sm:px-3">{a}</td>
                    <td className="px-2.5 py-2.5 leading-snug text-ink-soft sm:px-3">{b}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
        <div className="relative overflow-hidden rounded-[20px] border border-gold/30 bg-white p-5 shadow-mj-xs sm:p-6">
          <FloralSpray flip className="pointer-events-none absolute -bottom-6 -right-6 h-32 w-32 opacity-35" />
          <div className="relative flex items-start gap-3">
            <span className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-maroon text-cream"><Icon d={ICON.question} className="h-6 w-6" /></span>
            <div>
              <h2 className="font-display text-[22px] leading-tight text-maroon">Frequently Asked Questions</h2>
              <p className="mt-1.5 text-[14px] text-ink-soft">Find answers to common questions about Mithila Jodi Digital Profile.</p>
            </div>
          </div>
          <Link href="/help#digital-profile" className="btn relative mt-5 inline-flex gap-2 rounded-full border border-maroon/40 bg-cream px-6 py-2.5 text-[15px] font-semibold text-maroon hover:bg-white">
            View All FAQs<Icon d={ICON.arrow} className="h-4 w-4" />
          </Link>
        </div>
      </section>

      {/* ── Marriage Biodata ── a small pointer to the PDF maker, not a banner. */}
      <section className="wrap pb-10 sm:pb-14" aria-labelledby="dp-biodata">
        <div className="mx-auto flex max-w-3xl flex-col gap-2.5 rounded-[16px] border border-gold/40 bg-cream px-4 py-3.5 shadow-mj-xs sm:flex-row sm:items-center sm:gap-5 sm:px-6 sm:py-5">
          <div className="flex min-w-0 items-start gap-3 sm:items-center">
            <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full border border-gold/40 bg-paper-2 text-maroon" aria-hidden="true">
              <Icon d={ICON.doc} className="h-5 w-5" />
            </span>
            <div className="min-w-0">
              <h2 id="dp-biodata" className="font-display text-[18px] leading-tight text-maroon sm:text-[21px]">Create your Marriage Biodata</h2>
              <p className="mt-1 text-[13.5px] leading-snug text-ink-soft sm:text-[14.5px]">Download a beautiful PDF biodata to print or share with family.</p>
            </div>
          </div>
          <Link
            href={member ? '/biodata' : '/marriage-biodata'}
            className="btn-primary ml-[52px] shrink-0 gap-2 self-start rounded-full px-5 py-2.5 text-[14.5px] sm:ml-auto sm:self-center"
          >
            Create Marriage Biodata<Icon d={ICON.arrow} className="h-4 w-4" />
          </Link>
        </div>
      </section>
    </div>
  )
}
