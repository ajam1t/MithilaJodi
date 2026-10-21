/**
 * The "alternative to" pages at /compare/[slug].
 *
 * Ground rules, because these pages name other companies: every claim about
 * Mithila Jodi must be true of the product today (each one below points at
 * where it is implemented), and nothing is claimed about another service
 * beyond what is plainly public — that it is a large all-India matrimony
 * site. No logos, no prices, no feature-by-feature verdicts on them: their
 * products change, and a stale or wrong claim about a competitor is both
 * unfair and a legal risk. The pages say so, and carry a trademark notice.
 */

export type Competitor = { slug: string; name: string; searchName: string }

export const COMPETITORS: Competitor[] = [
  { slug: 'shaadi-com-alternative', name: 'Shaadi.com', searchName: 'Shaadi.com' },
  { slug: 'jeevansathi-alternative', name: 'Jeevansathi', searchName: 'Jeevansathi' },
  { slug: 'bharatmatrimony-alternative', name: 'BharatMatrimony', searchName: 'BharatMatrimony' },
]

export const getCompetitor = (slug: string) => COMPETITORS.find(c => c.slug === slug)

/** What Mithila Jodi does, each verified against the code. */
export const MJ_FEATURES: Array<{ title: string; body: string }> = [
  // app/pricing — "free for every member", no paid tier.
  { title: 'Free for every member', body: 'Registration, profile, search, interests, messaging and the biodata maker cost nothing. There is no paid tier and no payment step.' },
  // Profile form: self_gotra, maternal_gotra, mool, gram (community_masters).
  { title: 'Gotra, maternal gotra, mool and gram on every profile', body: 'Chosen from the Mithila Panji lists, not typed into a notes box — so they can be searched and checked.' },
  // lib/matchScore: same self-gotra is a blocker; maternal clash is flagged.
  { title: 'Every match checks gotra', body: 'A shared gotra shows as a blocker in the match score, and a match with your maternal gotra is flagged — the checks Maithil families make anyway.' },
  { title: 'A match score that explains itself', body: 'Every profile shows a match percentage across nine factors — location, gotra, age, community, roots, timeline, lifestyle, education and family — with the reasons. Blank fields are never scored, and a same-gotra pair can never read as a good match.' },
  // /marriage-biodata — four languages, prefilled from the profile.
  { title: 'Biodata in Maithili, Hindi, English or Sanskrit', body: 'A printable PDF with gotra, mool and gram at the top, filled in from your profile and ready for WhatsApp.' },
  // /digital-profile — share links with chosen sections, revocable.
  { title: 'A Digital Profile link to share', body: 'Send families one link with only the sections you choose, and switch it off whenever you like.' },
  // /marriage-invitation, /astrology/kundli-match, /astrology/vivah-muhurat.
  { title: 'Kundli matching, vivah muhurat and invitations', body: 'Free kundli matching, wedding dates and digital wedding invitations, made for Mithila weddings.' },
]

export const CHECKLIST = [
  'Does it cost anything — and what exactly is free?',
  'Can you record gotra, maternal gotra, mool and gram as proper fields?',
  'Does matching check for a same-gotra or maternal-gotra clash?',
  'Who can see your phone number, and can you share your profile without it?',
  'Can you make a biodata in Maithili or Hindi from your profile?',
]
