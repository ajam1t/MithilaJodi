/**
 * Who may be matched with whom.
 *
 * Mithila Jodi arranges marriages between a bride and a groom, so a member is
 * only ever shown, scored against, or able to send an interest to someone of
 * the opposite gender. That rule lives here rather than being written three
 * times, because the three places that need it must not be able to drift:
 * search decides what you see, the interests endpoint decides what you can act
 * on, and the match score decides what number you are shown. If those
 * disagreed, a member could see a profile they cannot contact, or be given a
 * compatibility score for someone the platform will never let them approach.
 */

export type Gender = 'male' | 'female'

export function oppositeGender(gender: string | null | undefined): Gender | null {
  if (gender === 'male') return 'female'
  if (gender === 'female') return 'male'
  return null
}

/**
 * True when these two may be matched.
 *
 * Fails OPEN when either gender is unknown, which only happens for a profile
 * that predates gender being required at signup. Blocking those would silently
 * remove them from the platform rather than prompting them to complete their
 * profile, which the onboarding gate already does.
 */
export function canBeMatched(
  a: string | null | undefined,
  b: string | null | undefined,
): boolean {
  if (a !== 'male' && a !== 'female') return true
  if (b !== 'male' && b !== 'female') return true
  return a !== b
}
