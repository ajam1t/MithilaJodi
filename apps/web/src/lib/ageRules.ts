/**
 * Minimum age of the profile holder, by gender — India's legal marriage ages:
 * 21 for a groom, 18 for a bride. One definition for the onboarding form, the
 * onboarding API, the profile editor and the profile API, so they cannot
 * disagree. Pure and client-safe.
 *
 * Dates are compared as YYYY-MM-DD strings in UTC, which order correctly.
 */

export const MIN_AGE = { male: 21, female: 18 } as const

export function minAgeFor(gender: string | null | undefined): number {
  return gender === 'male' ? MIN_AGE.male : MIN_AGE.female
}

/** The date `years` ago, as YYYY-MM-DD. */
export function yearsAgo(years: number, now = new Date()): string {
  return new Date(Date.UTC(now.getUTCFullYear() - years, now.getUTCMonth(), now.getUTCDate())).toISOString().slice(0, 10)
}

/** The latest date of birth that meets the minimum age for this gender. */
export function latestDob(gender: string | null | undefined, now = new Date()): string {
  return yearsAgo(minAgeFor(gender), now)
}

/** Null when old enough; otherwise the message to show. */
export function minAgeError(dob: string, gender: string | null | undefined, now = new Date()): string | null {
  if (dob <= latestDob(gender, now)) return null
  if (gender === 'male') return `A groom must be at least ${MIN_AGE.male} years old. Please check the date of birth.`
  return `A bride must be at least ${MIN_AGE.female} years old. Please check the date of birth.`
}
