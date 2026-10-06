import Image from 'next/image'

/*
 * Decorative visuals for the About page. Server components, no JavaScript:
 * motion is CSS in styles/about.css. Everything here is aria-hidden — what it
 * shows is said in real text on the page.
 */

/** An abstract, fictitious person — head and shoulders, never a likeness. */
function Medallion({ tone }: { tone: 'maroon' | 'gold' }) {
  const fill = tone === 'maroon' ? '#7A1220' : '#B98A2E'
  return (
    <div className="flex flex-col items-center gap-2">
      <div className="grid h-[84px] w-[84px] place-items-center rounded-full border border-gold/50 bg-cream shadow-mj-xs ring-4 ring-cream sm:h-[100px] sm:w-[100px]">
        <svg viewBox="0 0 48 48" className="h-12 w-12 sm:h-14 sm:w-14">
          <circle cx="24" cy="17" r="8" fill={fill} opacity="0.9" />
          <path d="M9 41c1.6-8 7.6-12.5 15-12.5S37.4 33 39 41" fill={fill} opacity="0.9" />
          {tone === 'gold' && <circle cx="24" cy="13.2" r="1.1" fill="#FFFAF0" />}
        </svg>
      </div>
      {/* Two quiet rules suggest a profile without pretending to be one. */}
      <span className="h-1.5 w-12 rounded-full bg-gold/30" />
      <span className="-mt-1 h-1.5 w-8 rounded-full bg-gold/20" />
    </div>
  )
}

export function HeroConnection() {
  return (
    <div aria-hidden="true" className="relative mx-auto aspect-[4/3] w-full max-w-[440px] select-none">
      {/* Soft ground */}
      <div className="absolute inset-[6%] rounded-full bg-[radial-gradient(circle,rgba(228,197,114,0.22),transparent_68%)]" />

      <svg viewBox="0 0 400 300" className="absolute inset-0 h-full w-full" fill="none">
        {/* Faint guide arcs */}
        <path d="M40 210 C 120 270, 280 270, 360 210" stroke="#B98A2E" strokeOpacity="0.18" strokeDasharray="2 6" />
        {/* The connection — drawn once on load */}
        <path
          className="ab-hero-line"
          pathLength={1}
          d="M128 141 C 165 108, 235 108, 272 141"
          stroke="#B98A2E"
          strokeWidth="1.6"
          strokeLinecap="round"
        />
      </svg>

      {/* Position on the outer box, motion on the inner one: the entrance
          animation sets `transform`, which would cancel the centring. */}
      <div className="absolute left-[23%] top-[47%] -translate-x-1/2 -translate-y-1/2">
        <div className="ab-hero-a"><Medallion tone="maroon" /></div>
      </div>
      <div className="absolute left-[77%] top-[47%] -translate-x-1/2 -translate-y-1/2">
        <div className="ab-hero-b"><Medallion tone="gold" /></div>
      </div>

      {/* Where the two meet: a small heart on the line (its midpoint is
          y≈116 of 300), with the Mithila Jodi mark above it. */}
      <div className="absolute left-1/2 top-[38.75%] -translate-x-1/2 -translate-y-1/2">
        <span className="ab-hero-node grid h-7 w-7 place-items-center rounded-full border border-gold bg-cream text-maroon shadow-mj-xs">
          <svg viewBox="0 0 24 24" className="h-3.5 w-3.5" fill="currentColor"><path d="M12 20s-7.5-4.6-7.5-10.2A4.3 4.3 0 0 1 12 7.2a4.3 4.3 0 0 1 7.5 2.6C19.5 15.4 12 20 12 20Z" /></svg>
        </span>
      </div>
      <div className="absolute left-1/2 top-[16%] -translate-x-1/2 -translate-y-1/2">
        <span className="ab-hero-node flex items-center gap-1.5 whitespace-nowrap rounded-full border border-gold/50 bg-cream px-3 py-1.5 shadow-mj-xs">
          <Image src="/logo-mark.png" alt="" width={22} height={20} className="h-5 w-auto" />
          <span className="font-serif text-[13px] font-bold text-maroon">Mithila Jodi</span>
        </span>
      </div>

      {/* Cultural details, just at the edges */}
      {[
        { t: 'परिवार', c: 'left-[6%] top-[9%]' },
        { t: 'गोत्र', c: 'right-[8%] top-[11%]' },
        { t: 'मूल', c: 'left-[12%] bottom-[7%]' },
        { t: 'ग्राम', c: 'right-[10%] bottom-[9%]' },
      ].map(l => (
        <span key={l.t} lang="hi" className={`ab-hero-label absolute font-deva text-[13px] text-[#8A6516]/75 sm:text-[14px] ${l.c}`}>
          {l.t}
        </span>
      ))}
    </div>
  )
}

/** व्यक्ति → परिवार → संस्कार → Mithila Jodi → जोड़ी, on one gold line. */
export function StoryLine() {
  const nodes: Array<{ hi?: string; en: string; brand?: boolean; end?: boolean }> = [
    { hi: 'व्यक्ति', en: 'The person' },
    { hi: 'परिवार', en: 'Family' },
    { hi: 'संस्कार', en: 'Values' },
    { en: 'Mithila Jodi', brand: true },
    { hi: 'जोड़ी', en: 'The match', end: true },
  ]
  return (
    <div data-mj-reveal className="relative mx-auto w-full max-w-[300px]">
      <span className="ab-story-line absolute bottom-6 left-[27px] top-6 w-px bg-gradient-to-b from-gold/30 via-gold to-maroon/60" aria-hidden="true" />
      <ol className="relative flex flex-col gap-4">
        {nodes.map(n => (
          <li key={n.en} className="ab-story-node flex items-center gap-4">
            <span
              aria-hidden="true"
              className={
                n.brand
                  ? 'grid h-[54px] w-[54px] shrink-0 place-items-center rounded-full border border-gold bg-maroon shadow-mj-xs'
                  : n.end
                    ? 'grid h-[54px] w-[54px] shrink-0 place-items-center rounded-full border border-gold bg-gold-lt/40'
                    : 'grid h-[54px] w-[54px] shrink-0 place-items-center rounded-full border border-gold/40 bg-cream'
              }
            >
              {n.brand ? (
                <Image src="/logo-mark.png" alt="" width={30} height={28} className="h-7 w-auto rounded-sm bg-cream p-0.5" />
              ) : (
                <span className={`h-2 w-2 rotate-45 ${n.end ? 'bg-maroon' : 'bg-gold'}`} />
              )}
            </span>
            <span className="flex flex-col leading-tight">
              {n.hi && <span lang="hi" className={`font-deva text-[19px] ${n.end ? 'text-maroon' : 'text-ink'}`}>{n.hi}</span>}
              <span className={n.brand ? 'font-serif text-[16px] font-bold uppercase tracking-[0.14em] text-maroon' : 'text-[12px] uppercase tracking-[0.16em] text-ink-soft'}>
                {n.en}
              </span>
            </span>
          </li>
        ))}
      </ol>
    </div>
  )
}
