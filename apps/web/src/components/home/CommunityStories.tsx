import { SectionHeading } from '@/components/ui'

/**
 * Community stories.
 *
 * These are presented as real member stories, on the site owner's confirmation
 * that they are.
 *
 * IF YOU EDIT THIS FILE, READ THIS FIRST: the `quote` strings below were
 * originally drafted as placeholder wording, not transcribed from the families.
 * Replace each one with what the family actually said, and get their written
 * permission before publishing it (see the Privacy Policy). Real testimonials
 * are worth far more than invented ones, and in India publishing invented
 * testimonial advertising engages the Consumer Protection Act 2019 and the ASCI
 * code — so the words matter, not just the names.
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

export function CommunityStories() {
  return (
    <section className="bg-paper py-9 sm:py-12" aria-label="Community stories">
      <div className="wrap">
        <SectionHeading
          eyebrow="From Mithila Families"
          title="Stories From Our Community"
          subtitle="How families are using Mithila Jodi to begin the conversation."
        />

        {/* Four cards: 2×2 on tablet, 4 across on desktop, so the row never
            leaves a single orphaned card on its own line. */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
          {STORIES.map((s) => (
            <figure key={s.family} className="card relative p-5 flex flex-col h-full">
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
