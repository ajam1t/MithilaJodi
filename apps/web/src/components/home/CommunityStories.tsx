'use client'

import { useState } from 'react'
import { Modal } from '@/components/ui/Modal'

/**
 * Community stories — four compact family selectors in one row; the full
 * story opens in a dialog, so the homepage never carries the long text.
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

/** "The Jha family" → "Jha Family" for the compact selector. */
const shortName = (family: string) => family.replace(/^The\s+/i, '').replace(/family$/i, 'Family')

export function CommunityStories() {
  const [open, setOpen] = useState<Story | null>(null)
  return (
    <section className="bg-paper py-8 sm:py-11" aria-label="Community stories">
      <div className="wrap">
        {/* Same compact heading as "Why Mithila Jodi" above it. */}
        <div data-mj-reveal className="mb-5 text-center sm:mb-7">
          <p className="eyebrow mb-1.5">From Mithila Families</p>
          <h2 className="section-heading">Stories From Our Community</h2>
          <div className="ornament-line mx-auto mt-2 w-16" />
          <p className="mt-2.5 text-[13.5px] text-ink-soft sm:text-[14.5px]">Real stories from Mithila families — tap one to read it.</p>
        </div>

        {/* Always four across — on a phone too. */}
        <ul data-mj-reveal className="mx-auto grid max-w-3xl grid-cols-4 gap-2 sm:gap-4">
          {STORIES.map(s => (
            <li key={s.family}>
              <button
                type="button"
                onClick={() => setOpen(s)}
                aria-haspopup="dialog"
                className="group flex h-full w-full flex-col items-center rounded-mj-sm border border-paper-3 bg-cream px-1 py-3 text-center transition-colors hover:border-gold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold sm:px-3 sm:py-4"
              >
                <span className="grid h-10 w-10 place-items-center rounded-full border border-gold/50 bg-paper-2 font-serif text-[17px] leading-none text-maroon transition-colors group-hover:border-gold sm:h-12 sm:w-12 sm:text-[20px]" aria-hidden="true">
                  {s.initial}
                </span>
                <span className="mt-2 block font-serif text-[12.5px] leading-tight text-maroon sm:text-[15px]">{shortName(s.family)}</span>
                <span className="mt-0.5 block text-[11px] leading-tight text-ink-soft sm:text-[12.5px]">{s.place}</span>
              </button>
            </li>
          ))}
        </ul>
      </div>

      <Modal open={!!open} onClose={() => setOpen(null)} title={open ? shortName(open.family) : undefined}>
        {open && (
          <figure>
            <p className="-mt-2 mb-3 text-[13px] text-ink-soft">{open.place}</p>
            <span className="font-serif text-[28px] leading-none text-gold" aria-hidden="true">&ldquo;</span>
            <blockquote className="mt-1 text-[16px] leading-relaxed text-ink">{open.quote}</blockquote>
            <figcaption className="mt-4 border-t border-paper-3 pt-3 font-serif text-[14px] text-maroon">
              {open.family}, {open.place}
            </figcaption>
          </figure>
        )}
      </Modal>
    </section>
  )
}
