/**
 * The twelve-check profile completion score (`profiles.profile_complete`).
 *
 * A quality signal — shown as profile strength and used to sort search — not a
 * gate: what a profile must have before it is visible is lib/onboarding.ts.
 * Each check carries the copy for the "+X%" next-step list after registration,
 * and the profile-editor section it lives in.
 */

export type CompletionField =
  | 'first_name' | 'gender' | 'dob' | 'caste' | 'self_gotra' | 'mother_tongue'
  | 'marital_status' | 'native_place_id' | 'current_loc_id' | 'height_cm' | 'diet' | 'about_me'

export const COMPLETION_CHECKS: ReadonlyArray<{ field: CompletionField; label: string; why: string; section: string }> = [
  { field: 'first_name', label: 'Name', why: '', section: 'basic' },
  { field: 'gender', label: 'Bride or groom', why: '', section: 'basic' },
  { field: 'dob', label: 'Date of birth', why: '', section: 'basic' },
  { field: 'caste', label: 'Community', why: '', section: 'community' },
  { field: 'self_gotra', label: 'Gotra', why: '', section: 'community' },
  { field: 'marital_status', label: 'Marital status', why: '', section: 'basic' },
  { field: 'current_loc_id', label: 'Current city', why: '', section: 'location' },
  { field: 'about_me', label: 'A few lines about yourself', why: 'Families read this first — it makes a profile feel real.', section: 'about' },
  { field: 'native_place_id', label: 'Native place', why: 'Many Mithila families look for roots close to their own.', section: 'location' },
  { field: 'height_cm', label: 'Height', why: 'One of the first things families filter by.', section: 'basic' },
  { field: 'mother_tongue', label: 'Mother tongue', why: 'Maithili, Hindi or another — it helps families connect.', section: 'basic' },
  { field: 'diet', label: 'Diet', why: 'Avoids surprises later for both families.', section: 'lifestyle' },
]

/** Points one check is worth, rounded the way the score is. */
export const POINTS_PER_CHECK = Math.round(100 / COMPLETION_CHECKS.length)

export function computeCompletion(data: Partial<Record<CompletionField, unknown>>): number {
  const done = COMPLETION_CHECKS.filter(c => {
    const v = data[c.field]
    return typeof v === 'string' ? v.trim() !== '' : v != null && v !== false && v !== 0
  }).length
  return Math.round((done / COMPLETION_CHECKS.length) * 100)
}

export const COMPLETION_SELECT = COMPLETION_CHECKS.map(c => c.field).join(', ')
