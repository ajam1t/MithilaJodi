import Link from 'next/link'
import { MithilaHeader } from '@/components/home/MithilaHeader'
import { MithilaFooter } from '@/components/home/MithilaFooter'
import { MobileBottomNav } from '@/components/home/MobileBottomNav'
import { GuideFaq } from '@/components/roots/GuideFaq'
import { WEIGHTS } from '@/lib/matchScore'
import { breadcrumbJsonLd, faqJsonLd, jsonLdScript, organizationJsonLd, pageMetadata } from '@/lib/seo'

/*
 * The public explanation of the Mithila Jodi match score. Everything here is
 * read from, or describes, lib/matchScore.ts — the weights are imported, not
 * copied — so the page cannot drift from what members are actually shown.
 * The score is a transparent rule-based calculation; it is described as such,
 * never as machine learning.
 */

export const metadata = pageMetadata({
  path: '/match-score',
  title: 'Match Score — How Mithila Jodi Scores Every Rishta',
  description:
    'A match percentage built for Maithil families: location, gotra, age, community, roots, timeline, lifestyle, education and family — with sagotra matches never shown as good, and every score explained.',
  keywords: [
    'matrimony match score', 'match percentage matrimony', 'maithil matrimony compatibility', 'mithila matrimony match',
    'gotra match score', 'sagotra check', 'maithil brahmin matrimony matching', 'compatibility score marriage',
  ],
})

const FACTORS: Array<{ key: keyof typeof WEIGHTS; label: string; deva: string; what: string }> = [
  { key: 'location', label: 'Location', deva: 'स्थान', what: 'Where you each live, work and come from — and whether it is a place you listed in your preferences.' },
  { key: 'gotra', label: 'Gotra', deva: 'गोत्र', what: 'Your gotras — and maternal gotras too, which most sites ignore. The same gotra is never scored: it is a gate (see below).' },
  { key: 'age', label: 'Age', deva: 'आयु', what: 'Whether each of you falls within the age range the other asked for.' },
  { key: 'community', label: 'Community', deva: 'समाज', what: 'Caste and sub-caste, against the communities you said you would consider.' },
  { key: 'timeline', label: 'Marriage timeline', deva: 'समय', what: 'Whether you both hope to marry on a similar timeline.' },
  { key: 'lifestyle', label: 'Lifestyle', deva: 'जीवनशैली', what: 'Diet, smoking and drinking — and your stated diet preference.' },
  { key: 'roots', label: 'Family roots', deva: 'मूल', what: 'Native places and the Mithila region — how close your families’ roots are.' },
  { key: 'education', label: 'Education', deva: 'शिक्षा', what: 'How your levels of education sit together.' },
  { key: 'family', label: 'Family', deva: 'परिवार', what: 'Family type and family values.' },
]
const TOTAL = FACTORS.reduce((n, f) => n + WEIGHTS[f.key], 0)

const BANDS = [
  { band: 'Excellent', range: '80 and above', note: 'Most of what both families asked for lines up.' },
  { band: 'Strong', range: '65 – 79', note: 'A good fit on the things that matter most.' },
  { band: 'Good', range: '50 – 64', note: 'Worth a look — read the reasons.' },
  { band: 'Fair', range: 'below 50', note: 'Some important things differ.' },
]

const FAQ = [
  {
    q: 'How is the Mithila Jodi match score worked out?',
    a: `Nine factors are weighed — location (${WEIGHTS.location}), gotra (${WEIGHTS.gotra}), age (${WEIGHTS.age}), community (${WEIGHTS.community}), marriage timeline (${WEIGHTS.timeline}), lifestyle (${WEIGHTS.lifestyle}), family roots (${WEIGHTS.roots}), education (${WEIGHTS.education}) and family (${WEIGHTS.family}) — using both profiles and both families’ stated preferences. The result is a percentage with the reasons behind it.`,
  },
  {
    q: 'What happens if both families have the same gotra?',
    a: 'Sagotra matches are traditionally avoided in Maithil marriage, so the same gotra is not treated as a few lost points. It is a gate: the pair is flagged, and the score is held at 40 or below, so it can never appear as a good match. Maternal gotras are checked too — a clash with a maternal gotra lowers the gotra score.',
  },
  {
    q: 'What if a profile has missing details?',
    a: 'A factor neither family has filled in is left out of the calculation rather than scored as a zero or a guess. The score also carries a confidence — how much of the picture it was built on — so a high score from only a few details is not shown as a strong match.',
  },
  {
    q: 'Is the match score the same as kundli matching?',
    a: 'No. The match score compares two profiles and two families’ preferences. Kundli matching (Ashtakoot guna milan) compares two horoscopes from birth details — Mithila Jodi has a free Kundli Match tool for that, and many families look at both.',
  },
  {
    q: 'Where do I see my match score?',
    a: 'On every profile you open after signing in, in search results and in your Feed’s recommendations — each with the reasons, such as “Lives in a location you listed in your preferences”. Joining Mithila Jodi is free.',
  },
]

export default function MatchScorePage() {
  const crumbs = breadcrumbJsonLd([{ name: 'Mithila Jodi', path: '/' }, { name: 'Match Score', path: '/match-score' }])
  return (
    <div className="min-h-screen flex flex-col bg-paper overflow-x-clip">
      <script type="application/ld+json" dangerouslySetInnerHTML={jsonLdScript(organizationJsonLd(), faqJsonLd(FAQ), crumbs)} />
      <MithilaHeader />
      <main id="main-content" className="flex-1">
        {/* ── Hero: the score, as members see it ── */}
        <section className="mjs-hero">
          <div className="wrap max-w-5xl grid items-center gap-8 py-10 sm:py-14 md:grid-cols-[1.1fr_0.9fr]">
            <div>
              <p className="eyebrow mb-2">✦ Mithila Jodi Match Score</p>
              <h1 className="font-serif text-maroon text-[32px] sm:text-[44px] leading-[1.08]">
                Every rishta, scored the way <span className="text-[#9A6F1E]">Maithil families think.</span>
              </h1>
              <p className="font-deva text-[18px] text-[#9A6F1E] mt-2" lang="hi">हर रिश्ते का मिलान, परिवार की नज़र से</p>
              <p className="mt-4 max-w-xl text-[15.5px] leading-relaxed text-ink">
                Open any profile and you see how well it fits <em>you</em> — as a percentage, with the reasons. Gotra, location,
                age, community, roots and more, weighed from both profiles and both families’ preferences.
              </p>
              <div className="mt-6 flex flex-wrap gap-3">
                <Link href="/register?start=1" className="btn-primary px-6 py-3 text-[15px]">See your matches — free →</Link>
                <Link href="/explore" className="btn-ghost px-6 py-3 text-[15px]">Browse profiles</Link>
              </div>
            </div>
            <div className="mjs-sample" aria-label="An example of a match score">
              <p className="mjs-sample-tag">Example</p>
              <div className="mjs-ring">
                <svg viewBox="0 0 120 120" aria-hidden="true">
                  <circle cx="60" cy="60" r="50" fill="none" stroke="rgba(185,138,46,.2)" strokeWidth="8" />
                  <circle cx="60" cy="60" r="50" fill="none" stroke="url(#mjsG)" strokeWidth="8" strokeLinecap="round" pathLength={100} strokeDasharray="79 100" transform="rotate(-90 60 60)" className="mjs-ring-fill" />
                  <defs><linearGradient id="mjsG" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stopColor="#E9C977" /><stop offset="1" stopColor="#B98A2E" /></linearGradient></defs>
                </svg>
                <span><b>79</b><small>Strong</small></span>
              </div>
              <ul className="mjs-reasons">
                <li><span>✓</span>Lives in a location you listed in your preferences</li>
                <li><span>✓</span>Gotra and maternal gotra are both clear</li>
                <li><span>✓</span>Both families have roots in Mithila</li>
                <li><span>✓</span>Comparable level of education</li>
              </ul>
            </div>
          </div>
        </section>

        {/* ── The nine factors ── */}
        <section className="wrap max-w-4xl py-10 sm:py-12" aria-labelledby="mjs-factors">
          <p className="eyebrow mb-1">How it is worked out</p>
          <h2 id="mjs-factors" className="font-serif text-maroon text-[26px] sm:text-[32px]">Nine things families ask, weighed</h2>
          <p className="mt-2 max-w-2xl text-[15px] text-ink-soft">Out of {TOTAL} points. A transparent calculation from both profiles and both families’ stated preferences — no hidden ranking.</p>
          <ol className="mjs-factors mt-6">
            {FACTORS.map((f) => (
              <li key={f.key}>
                <div className="flex items-baseline justify-between gap-3">
                  <p className="font-serif text-[18px] text-maroon">{f.label} <span className="font-deva text-[14px] text-[#9A6F1E]" lang="hi">{f.deva}</span></p>
                  <p className="text-[13px] font-semibold text-ink-soft tabular-nums">{WEIGHTS[f.key]} pts</p>
                </div>
                <span className="mjs-bar" aria-hidden="true"><i style={{ width: `${Math.round((WEIGHTS[f.key] / 18) * 100)}%` }} /></span>
                <p className="mt-1.5 text-[13.5px] leading-snug text-ink-soft">{f.what}</p>
              </li>
            ))}
          </ol>
        </section>

        {/* ── Three rules ── */}
        <section className="wrap max-w-5xl pb-10 sm:pb-12" aria-labelledby="mjs-rules">
          <h2 id="mjs-rules" className="font-serif text-maroon text-[26px] sm:text-[32px] text-center">Three rules that make it trustworthy</h2>
          <div className="mjs-rules mt-6">
            <article>
              <p className="mjs-rule-n">01</p>
              <h3>Gotra is a gate, not points</h3>
              <p>Sagotra matches are traditionally avoided. The same gotra is flagged and the score is held at 40 or below — so it can never look like a good match. <Link href="/gotra" className="font-semibold text-maroon underline underline-offset-2">Check two gotras →</Link></p>
            </article>
            <article>
              <p className="mjs-rule-n">02</p>
              <h3>Blank is never scored</h3>
              <p>If neither family filled something in, it is left out — not counted as zero, not guessed. Each score carries how much of the picture it was built on.</p>
            </article>
            <article>
              <p className="mjs-rule-n">03</p>
              <h3>Every score explains itself</h3>
              <p>You see the reasons, not just a number — “Lives in a location you listed”, “Gotra and maternal gotra are both clear”. Open a profile for the full breakdown, factor by factor.</p>
            </article>
          </div>
        </section>

        {/* ── Bands ── */}
        <section className="wrap max-w-4xl pb-10 sm:pb-12" aria-labelledby="mjs-bands">
          <h2 id="mjs-bands" className="font-serif text-maroon text-[24px] sm:text-[28px]">What the percentage means</h2>
          <dl className="mjs-bands mt-4">
            {BANDS.map(b => (
              <div key={b.band} data-band={b.band.toLowerCase()}>
                <dt><b>{b.band}</b><span>{b.range}</span></dt>
                <dd>{b.note}</dd>
              </div>
            ))}
          </dl>
          <p className="mt-4 text-[13.5px] text-ink-soft">
            Looking at horoscopes too? The <Link href="/astrology/kundli-match" className="font-semibold text-maroon underline underline-offset-2">Kundli Match</Link> tool
            compares two birth charts (Ashtakoot guna milan) — a different question from the match score, and many families look at both.
          </p>
        </section>

        <section className="wrap max-w-3xl pb-12">
          <GuideFaq items={FAQ} />
          <div className="mt-8 rounded-[24px] border border-line bg-cream p-6 text-center">
            <p className="font-serif text-[22px] text-maroon">See how every profile fits you</p>
            <p className="mt-1 text-[14px] text-ink-soft">Free for every member. Your number stays private.</p>
            <Link href="/register?start=1" className="btn-primary mt-4 inline-flex px-6 py-3 text-[15px]">Join Mithila Jodi →</Link>
          </div>
        </section>
      </main>
      <MithilaFooter className="pb-16 lg:pb-0" />
      <MobileBottomNav />
    </div>
  )
}
