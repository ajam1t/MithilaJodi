import 'server-only'

/* eslint-disable @typescript-eslint/no-explicit-any */

/**
 * The minimum a profile needs before the member can use the platform.
 *
 * Registration is mobile + OTP + password and collects nothing else, so before
 * this gate existed a member landed in the app with an empty profile and full
 * access to search, interests and messaging. Six of the first thirteen accounts
 * on the platform had no name, no date of birth and no photo — they are
 * indistinguishable from abandoned signups, and they are what other members saw
 * in search.
 *
 * A photo cannot be required during registration itself: the upload endpoint
 * needs an authenticated profile row to attach the file to, and that row does
 * not exist until the account does. So the requirement is enforced immediately
 * afterwards instead, as a gate every member-area page passes through.
 *
 * `pending_moderation` counts as satisfied on purpose — the requirement is that
 * the member uploaded a photo, not that an admin has already approved it.
 */

export const ONBOARDING_FIELDS = {
  name: 'your name',
  gender: 'whether the profile is for a bride or a groom',
  dob: 'date of birth',
  photo: 'one photo',
} as const

export type OnboardingRequirement = keyof typeof ONBOARDING_FIELDS

export type OnboardingState = {
  /** Null until the member has saved a profile for the first time. */
  profileId: string | null
  /** Requirements still outstanding, in the order they are asked for. */
  missing: OnboardingRequirement[]
  complete: boolean
  /** Already-saved values, so the form can be prefilled rather than blank. */
  values: {
    firstName: string | null
    lastName: string | null
    gender: string | null
    dob: string | null
    profileFor: string | null
    caste: string | null
    currentLocId: number | null
    currentLocName: string | null
  }
  photoCount: number
}

const EMPTY: OnboardingState = {
  profileId: null,
  missing: ['name', 'gender', 'dob', 'photo'],
  complete: false,
  values: {
    firstName: null, lastName: null, gender: null, dob: null,
    profileFor: null, caste: null, currentLocId: null, currentLocName: null,
  },
  photoCount: 0,
}

export async function getOnboardingState(admin: any, accountId: string): Promise<OnboardingState> {
  const { data: profile } = await admin
    .from('profiles')
    .select('id, first_name, last_name, gender, dob, profile_for, caste, current_loc_id')
    .eq('account_id', accountId)
    .is('deleted_at', null)
    .order('updated_at', { ascending: false })
    .limit(1)
    .maybeSingle()

  if (!profile) return EMPTY

  // A rejected photo does not count — the member has to replace it — but a
  // pending one does.
  const { count } = await admin
    .from('profile_photos')
    .select('id', { count: 'exact', head: true })
    .eq('profile_id', profile.id)
    .in('status', ['approved', 'pending_moderation'])

  const photoCount = count ?? 0

  const missing: OnboardingRequirement[] = []
  if (!String(profile.first_name ?? '').trim()) missing.push('name')
  if (!profile.gender) missing.push('gender')
  if (!profile.dob) missing.push('dob')
  if (photoCount === 0) missing.push('photo')

  let currentLocName: string | null = null
  if (profile.current_loc_id) {
    const { data: loc } = await admin
      .from('india_locations')
      .select('name_en')
      .eq('id', profile.current_loc_id)
      .maybeSingle()
    currentLocName = loc?.name_en ?? null
  }

  return {
    profileId: profile.id,
    missing,
    complete: missing.length === 0,
    values: {
      firstName: profile.first_name ?? null,
      lastName: profile.last_name ?? null,
      gender: profile.gender ?? null,
      dob: profile.dob ?? null,
      profileFor: profile.profile_for ?? null,
      caste: profile.caste ?? null,
      currentLocId: profile.current_loc_id ?? null,
      currentLocName,
    },
    photoCount,
  }
}
