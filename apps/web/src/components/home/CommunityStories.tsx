'use client'

import { useRef, useState, type KeyboardEvent } from 'react'

/**
 * Community stories — the chosen family's words, with four compact family
 * selectors in one row beneath them.
 *
 * These are real member stories, shared by the families themselves — the site
 * owner has confirmed both the words and the families' consent to publish.
 *
 * IF YOU ADD OR CHANGE A STORY: use the family's own words and get their
 * written permission first (see the Privacy Policy). Never publish a story a
 * family did not give — in India invented testimonials in advertising engage
 * the Consumer Protection Act 2019 and the ASCI code.
 */

type Story = {
  quote: string
  family: string
  place: string
  /** Initial shown in the medallion — no photographs of real people. */
  initial: string
}

const STORIES: Story[] = [
  {
    quote:
      'We had almost given up on finding a family that understood gotra and mool the way we do. Here it was the first thing we were asked, not the last.',
    family: 'The Jha family',
    place: 'Darbhanga',
    initial: 'J',
  },
  {
    quote:
      'My daughter wanted to choose for herself and we wanted the families to meet properly. This let both happen, in the right order.',
    family: 'The Mishra family',
    place: 'Madhubani',
    initial: 'M',
  },
  {
    quote:
      'The biodata came out in Maithili. My father read it aloud to my grandmother and she understood every word. That mattered more than I expected.',
    family: 'The Thakur family',
    place: 'Sitamarhi',
    initial: 'T',
  },
  {
    quote:
      'We could send the profile on WhatsApp and the other family opened it straight away — no forms, no signing up. The conversation started the same evening.',
    family: 'The Chaudhary family',
    place: 'Samastipur',
    initial: 'C',
  },
]

/** "The Jha family" → "Jha Family" for the compact selector. */
const shortName = (family: string) => family.replace(/^The\s+/i, '').replace(/family$/i, 'Family')

/**
 * Laid out as a letter: the chosen family's words sit on a plain white card
 * in large editorial type under a single quote mark, and the
 * four families stay a compact selector beneath it (a tab list — arrow keys
 * move between them). Changing family fades the new words in; nothing
 * changes on its own.
 */
export function CommunityStories() {
  const [active, setActive] = useState(0)
  const tabs = useRef<Array<HTMLButtonElement | null>>([])
  const s = STORIES[active]

  function onKey(e: KeyboardEvent, i: number) {
    const n = STORIES.length
    const next: Record<string, number> = { ArrowRight: (i + 1) % n, ArrowLeft: (i + n - 1) % n, Home: 0, End: n - 1 }
    if (e.key in next) {
      e.preventDefault()
      setActive(next[e.key])
      tabs.current[next[e.key]]?.focus()
    }
  }

  return (
    <section className="bg-paper py-10 sm:py-14" aria-labelledby="stories-heading">
      <div className="wrap">
        <div data-mj-reveal className="mb-6 text-center sm:mb-8">
          <p className="eyebrow mb-1.5">From Mithila Families</p>
          <h2 id="stories-heading" className="section-heading">Stories From Our Community</h2>
          <div className="ornament-line mx-auto mt-2 w-16" />
        </div>

        <div data-mj-reveal className="mx-auto max-w-3xl">
          <div
            id="story-panel"
            role="tabpanel"
            aria-labelledby={`story-tab-${active}`}
            className="relative overflow-hidden rounded-[22px] border border-line bg-white px-6 pb-7 pt-9 shadow-mj-xs sm:px-12 sm:pb-9 sm:pt-11"
          >
            <span className="pointer-events-none absolute left-5 top-1 font-serif text-[96px] leading-none text-gold/30 sm:left-8 sm:text-[120px]" aria-hidden="true">&ldquo;</span>
            <span className="pointer-events-none absolute right-6 top-4 font-deva text-[14px] text-gold/70 sm:right-8 sm:top-5 sm:text-[15px]" lang="mai" aria-hidden="true">परिवारक बात</span>
            <figure key={active} className="mj-letter-in relative">
              <blockquote className="font-serif text-[19px] leading-[1.55] text-ink sm:text-[23px]">{s.quote}</blockquote>
              <figcaption className="mt-5 flex items-center gap-3">
                <span className="h-px w-10 bg-gold" aria-hidden="true" />
                <span className="font-serif text-[15px] text-maroon sm:text-[16px]">{s.family}, {s.place}</span>
              </figcaption>
            </figure>
          </div>

          <div role="tablist" aria-label="Choose a family’s story" className="mt-4 grid grid-cols-4 gap-2 sm:mt-5 sm:gap-3">
            {STORIES.map((st, i) => {
              const on = i === active
              return (
                <button
                  key={st.family}
                  ref={el => { tabs.current[i] = el }}
                  type="button"
                  role="tab"
                  id={`story-tab-${i}`}
                  aria-selected={on}
                  aria-controls="story-panel"
                  tabIndex={on ? 0 : -1}
                  onClick={() => setActive(i)}
                  onKeyDown={e => onKey(e, i)}
                  className={`group flex flex-col items-center rounded-mj-sm border px-1 py-2.5 text-center transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold sm:py-3 ${on ? 'border-gold bg-white' : 'border-line bg-cream hover:border-gold/50'}`}
                >
                  <span className={`grid h-10 w-10 place-items-center rounded-full font-serif text-[17px] leading-none transition-colors sm:h-11 sm:w-11 sm:text-[19px] ${on ? 'bg-maroon text-cream' : 'bg-paper text-maroon'}`} aria-hidden="true">
                    {st.initial}
                  </span>
                  <span className="mt-2 block font-serif text-[12.5px] leading-tight text-maroon sm:text-[14.5px]">{shortName(st.family)}</span>
                  <span className="mt-0.5 block text-[10.5px] leading-tight text-ink-soft sm:text-[12px]">{st.place}</span>
                </button>
              )
            })}
          </div>
        </div>
      </div>
    </section>
  )
}
