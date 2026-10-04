import Image from 'next/image'
import Link from 'next/link'
import { ZodiacWheel } from '../kundli/ZodiacWheel'

/** Domes, a temple shikhara, ghats and lamps — a Mithila skyline in silhouette. */
function Skyline() {
  return (
    <svg viewBox="0 0 1200 120" preserveAspectRatio="xMidYMax slice" className="absolute inset-x-0 bottom-0 h-[64px] sm:h-[96px] w-full" aria-hidden="true">
      <defs>
        <linearGradient id="ahSky" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#1A2347" /><stop offset="1" stopColor="#0B1126" /></linearGradient>
        <linearGradient id="ahWater" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#E8912A" stopOpacity="0.35" /><stop offset="1" stopColor="#E8912A" stopOpacity="0" /></linearGradient>
      </defs>
      <path
        fill="url(#ahSky)"
        d="M0 120V92h40V80h8V68c0-8 6-14 14-16 0-4 2-6 2-6s2 2 2 6c8 2 14 8 14 16v12h10V58l6-6v-8l4-8 4 8v8l6 6v34h18V74c0-12 10-22 22-24 0-6 3-9 3-9s3 3 3 9c12 2 22 12 22 24v18h26V86h10V64l8-22 4-14 4 14 8 22v22h10v6h40V78h6V66c0-10 8-18 18-20 0-5 2-8 2-8s2 3 2 8c10 2 18 10 18 20v12h6v14h46V60l10-24 6-20 6 20 10 24v32h24V80c0-14 12-26 26-28 0-7 4-10 4-10s4 3 4 10c14 2 26 14 26 28v12h30V72h8V62c0-7 5-12 12-14 0-3 2-5 2-5s2 2 2 5c7 2 12 7 12 14v10h8v20h40V56l8-6V40l6-12 6 12v10l8 6v36h26V82c0-11 9-20 20-22 0-5 3-8 3-8s3 3 3 8c11 2 20 11 20 22v10h34V70l10-26 5-16 5 16 10 26v22h30V80h8V70c0-8 6-14 14-16 0-4 2-6 2-6s2 2 2 6c8 2 14 8 14 16v10h8v12h36V66c0-12 10-22 22-24 0-6 3-9 3-9s3 3 3 9c12 2 22 12 22 24v26h38V120Z"
      />
      <rect x="0" y="104" width="1200" height="16" fill="url(#ahWater)" />
      {[118, 262, 455, 612, 790, 968, 1104].map((x, i) => <rect key={i} x={x} y={96 - (i % 3) * 6} width="4" height="7" rx="1" fill="#F1B85A" opacity="0.8" />)}
    </svg>
  )
}

function Planet({ className, from, to, ring = false }: { className: string; from: string; to: string; ring?: boolean }) {
  const id = `ap-${from.slice(1)}`
  return (
    <svg viewBox="0 0 40 40" className={`absolute ${className}`} aria-hidden="true">
      <defs><radialGradient id={id} cx="35%" cy="30%" r="70%"><stop offset="0" stopColor={from} /><stop offset="1" stopColor={to} /></radialGradient></defs>
      <circle cx="20" cy="20" r="12" fill={`url(#${id})`} />
      {ring && <ellipse cx="20" cy="20" rx="19" ry="5" fill="none" stroke="#E8C878" strokeOpacity="0.6" transform="rotate(-18 20 20)" />}
    </svg>
  )
}

const TRUST = [
  { label: 'Authentic Vedic methods', icon: 'M12 3c2 3 2 6 0 9-2-3-2-6 0-9Zm-7 5c3 0 6 2 7 5-3 0-6-2-7-5Zm14 0c-1 3-4 5-7 5 1-3 4-5 7-5ZM4 16h16' },
  { label: 'Simple & easy to use', icon: 'M5 12l4 4 10-10' },
  { label: '100% private & secure', icon: 'M12 3l7 3v5c0 5-3 8-7 10-4-2-7-5-7-10V6l7-3Z' },
]

/**
 * The hub's cinematic band: a navy night sky over a Mithila skyline, the
 * zodiac, and the couple from the site's own wedding illustration in a
 * jharokha arch. Compact by design so the tools are reached at once.
 */
export function AstroHero() {
  return (
    <section className="astro-hero relative overflow-hidden" aria-labelledby="astro-title">
      <div className="astro-hero-stars" aria-hidden="true" />
      <div className="astro-hero-stars astro-hero-stars--b" aria-hidden="true" />
      <Planet className="hidden sm:block w-12 left-[38%] top-[12%]" from="#C9A27A" to="#4A3426" ring />
      <Planet className="hidden sm:block w-16 left-[2%] top-[40%] opacity-80" from="#8A99B8" to="#1E2846" />
      <Planet className="w-12 sm:w-20 right-[3%] top-[4%] sm:right-[24%] sm:top-[6%] opacity-90" from="#E9E3CF" to="#6B6A72" />

      <div className="wrap relative h-[300px] sm:h-[340px] lg:h-[360px]">
        {/* Zodiac and couple */}
        <div className="absolute right-[-70px] top-[22px] w-[230px] sm:right-[-10px] sm:top-[-8px] sm:w-[360px] lg:right-[13%] lg:w-[400px] opacity-90" aria-hidden="true">
          <div className="kd-wheel-spin"><ZodiacWheel size={400} decorative theme="dark" /></div>
        </div>
        <div className="astro-arch absolute bottom-[40px] right-[10px] w-[118px] h-[156px] sm:bottom-[52px] sm:right-[64px] sm:w-[190px] sm:h-[244px] lg:right-[22%] lg:w-[210px] lg:h-[270px]">
          <Image
            src="/hero-couple.jpg"
            alt="A Mithila bride and groom exchanging garlands"
            fill
            priority
            sizes="(max-width: 640px) 118px, 210px"
            className="object-cover object-[44%_18%] scale-[1.35] origin-[44%_22%]"
          />
        </div>
        <p className="hidden lg:block absolute right-0 top-[44%] max-w-[210px] font-hand text-[24px] leading-tight text-gold-lt/90 -rotate-6" aria-hidden="true">
          Same Stars,<br />A Brighter Together ♡
        </p>

        {/* Copy */}
        <div className="relative z-10 pt-6 sm:pt-10 lg:pt-12 max-w-[62%] sm:max-w-[58%] lg:max-w-[52%]">
          <nav aria-label="Breadcrumb" className="hidden sm:block mb-3">
            <ol className="flex items-center gap-2 text-[12px] text-[#C9C2B0]">
              <li><Link href="/" className="hover:text-gold-lt transition-colors">Home</Link></li>
              <li aria-hidden="true" className="text-gold/60">›</li>
              <li className="text-gold-lt" aria-current="page">Astrology</li>
            </ol>
          </nav>
          <p className="hidden sm:block text-[11px] uppercase tracking-[0.32em] text-[#E8C878]/85">Discover · Understand · Find harmony</p>
          <h1 id="astro-title" className="astro-gold-text font-serif text-[30px] sm:text-[46px] lg:text-[58px] leading-[1.02] sm:mt-2">
            Astrology &amp; Kundli
          </h1>
          <p className="mt-2 font-serif text-[15px] sm:text-[21px] lg:text-[24px] text-[#FFF8EC] leading-snug">
            Traditional Mithila Jyotish, for a brighter tomorrow
          </p>
          <p className="mt-1.5 hidden sm:block text-[14px] lg:text-[16px] text-[#D9D2C2]">Explore powerful astrology tools based on authentic Vedic tradition.</p>
          <ul className="mt-4 sm:mt-6 flex flex-col sm:flex-row sm:flex-wrap gap-x-6 gap-y-1.5 text-[11px] sm:text-[13px] text-[#EDE6D6]">
            {TRUST.map(t => (
              <li key={t.label} className="flex items-center gap-2">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#E8C878" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d={t.icon} /></svg>
                {t.label}
              </li>
            ))}
          </ul>
        </div>
      </div>
      <Skyline />
    </section>
  )
}
