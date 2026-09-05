import { SectionHeading } from '@/components/ui'

/**
 * Community stories.
 *
 * IMPORTANT — these are illustrative, not real member testimonials, and the UI
 * says so on the section and on every card. Publishing invented success stories
 * as though they were real would mislead visitors, and in India misleading
 * testimonial advertising engages the Consumer Protection Act 2019 and the ASCI
 * code. The honest version costs one small label and loses almost nothing.
 *
 * TO SWAP IN REAL STORIES:
 *   1. replace the entries in STORIES below with the real ones (get the
 *      family's written permission first — see the Privacy Policy);
 *   2. set ILLUSTRATIVE to false.
 * That removes every "example" marker in one step. Nothing else needs editing.
 */

const ILLUSTRATIVE = true

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
]

export function CommunityStories() {
  return (
    <section className="bg-paper py-9 sm:py-12" aria-label="Community stories">
      <div className="wrap">
        <SectionHeading
          eyebrow="From Mithila Families"
          title="Stories From Our Community"
          subtitle="How families are using Mithila Jodi to begin the conversation."
        />

        {ILLUSTRATIVE && (
          <p className="text-center text-[12.5px] text-ink-soft mb-6 -mt-2">
            <span className="inline-block rounded-pill border border-gold/50 bg-cream px-2.5 py-0.5 mr-1.5 text-[11px] font-semibold text-terra uppercase tracking-wide">
              Example
            </span>
            Illustrative stories showing how the platform is used. Real member stories will replace
            these, with permission.
          </p>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-5">
          {STORIES.map((s) => (
            <figure key={s.family} className="card relative p-5 flex flex-col h-full">
              {ILLUSTRATIVE && (
                <span
                  className="absolute top-3 right-3 text-[9.5px] font-semibold uppercase tracking-wider
                             text-ink-soft bg-paper-2 border border-paper-3 rounded-pill px-2 py-0.5"
                >
                  Example
                </span>
              )}

              <span className="text-gold text-2xl leading-none font-serif" aria-hidden="true">&ldquo;</span>

              <blockquote className="text-ink-soft text-[14.5px] leading-relaxed mt-1 mb-4 flex-1">
                {s.quote}
              </blockquote>

              <figcaption className="flex items-center gap-3 pt-3 border-t border-paper-3">
                <span
                  className="grid place-items-center h-9 w-9 shrink-0 rounded-full bg-paper-2 border border-gold/40"
                  aria-hidden="true"
                >
                  <span className="font-serif text-maroon text-[15px] leading-none">{s.initial}</span>
                </span>
                <span className="min-w-0">
                  <span className="block font-serif text-maroon text-[14px] leading-tight">{s.family}</span>
                  <span className="block font-sans text-ink-soft text-[12px] leading-tight">{s.place}</span>
                </span>
              </figcaption>
            </figure>
          ))}
        </div>
      </div>
    </section>
  )
}
