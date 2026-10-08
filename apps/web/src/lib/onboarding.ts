import 'server-only'

/* eslint-disable @typescript-eslint/no-explicit-any */

import { COMPLETION_CHECKS, COMPLETION_SELECT, type CompletionField } from '@/lib/profileCompletion'

/**
 * The minimum a profile needs before the member can use the platform — and
 * before anyone else can see it.
 *
 * Registration (mobile + OTP + password) creates the account; this is what the
 * profile must hold on top of that. One definition serves three jobs:
 *   1. the gate every member-area page passes through ((main)/layout.tsx),
 *   2. where /welcome resumes — the first step with anything missing,
 *   3. discoverability (lib/discoverability.ts): a profile is never shown in
 *      search, the showcase or anywhere else until this is complete.
 *
 * A photo cannot be asked for before the profile row exists (uploads attach to
 * it), which is why the account is created first and the profile is kept
 * hidden until it is ready, rather than collecting everything up front.
 *
 * `pending_moderation` counts as satisfied on purpose — the requirement is that
 * the member uploaded a photo, not that an admin has already approved it.
 */

export const ONBOARDING_FIELDS = {
  name: 'your name',
  gender: 'whether the profile is for a bride or a groom',
  dob: 'date of birth',
  marital: 'marital status',
  lookingFor: 'who you are looking for',
  location: 'current city',
  caste: 'community / caste',
  gotra: 'gotra',
  photo: 'one photo',
} as const

export type OnboardingRequirement = keyof typeof ONBOARDING_FIELDS

/** The /welcome steps, in order, and which requirement belongs to each. */
export type OnboardingStep = 'about' | 'mithila' | 'photo'
export const STEP_OF: Record<OnboardingRequirement, OnboardingStep> = {
  name: 'about', gender: 'about', dob: 'about', marital: 'about', lookingFor: 'about',
  location: 'mithila', caste: 'mithila', gotra: 'mithila',
  photo: 'photo',
}

export type OnboardingValues = {
  profileFor: string | null
  firstName: string | null
  lastName: string | null
  gender: string | null
  dob: string | null
  maritalStatus: string | null
  lookingFor: string | null
  currentLocId: number | null
  currentLocName: string | null
  caste: string | null
  subCaste: string | null
  gotra: string | null
  mool: string | null
  maternalGotra: string | null
  gram: string | null
}

export type OnboardingState = {
  /** Null until the member has saved the first step. */
  profileId: string | null
  /** Requirements still outstanding, in the order they are asked for. */
  missing: OnboardingRequirement[]
  complete: boolean
  /** First step with anything missing; null when complete. */
  resumeStep: OnboardingStep | null
  /** Already-saved values, so the form is prefilled rather than blank. */
  values: OnboardingValues
  photoCount: number
  /** 12-check completion score (0–100), for the "profile strength" view. */
  strength: number
  /** Completion checks still open — the "+X%" next steps. */
  completionMissing: CompletionField[]
}

const EMPTY_VALUES: OnboardingValues = {
  profileFor: null, firstName: null, lastName: null, gender: null, dob: null,
  maritalStatus: null, lookingFor: null, currentLocId: null, currentLocName: null,
  caste: null, subCaste: null, gotra: null, mool: null, maternalGotra: null, gram: null,
}

const ORDER = Object.keys(ONBOARDING_FIELDS) as OnboardingRequirement[]

const blank = (v: unknown) => !String(v ?? '').trim()

/** Pure check, shared by the gate and the discoverability sync. */
export function missingRequirements(
  p: { first_name?: unknown; gender?: unknown; dob?: unknown; marital_status?: unknown; current_loc_id?: unknown; caste?: unknown; self_gotra?: unknown },
  prefGender: unknown,
  photoCount: number,
): OnboardingRequirement[] {
  const has: Record<OnboardingRequirement, boolean> = {
    name: !blank(p.first_name),
    gender: !!p.gender,
    dob: !!p.dob,
    marital: !blank(p.marital_status),
    lookingFor: !!prefGender,
    location: p.current_loc_id != null,
    caste: !blank(p.caste),
    gotra: !blank(p.self_gotra),
    photo: photoCount > 0,
  }
  return ORDER.filter(r => !has[r])
}

function completion(p: Record<string, unknown>): { strength: number; completionMissing: CompletionField[] } {
  const open = COMPLETION_CHECKS.filter(c => {
    const v = p[c.field]
    return typeof v === 'string' ? v.trim() === '' : v == null || v === 0
  }).map(c => c.field)
  return { strength: Math.round(((COMPLETION_CHECKS.length - open.length) / COMPLETION_CHECKS.length) * 100), completionMissing: open }
}

export type OnboardingRow = {
  id: string
  created_at: string | null
  visibility: string | null
  admin_hidden: boolean | null
  discoverable: boolean | null
  profile_status: string | null
}

/**
 * Loads the member's profile and evaluates the requirements. `withNames`
 * resolves the city name for prefilling — the gate and the sync skip it.
 */
export async function loadOnboarding(
  admin: any,
  accountId: string,
  opts: { withNames?: boolean } = {},
): Promise<{ state: OnboardingState; row: OnboardingRow | null }> {
  const { data: profile } = await admin
    .from('profiles')
    .select(`id, created_at, last_name, profile_for, sub_caste, mool, maternal_gotra, gram, visibility, admin_hidden, discoverable, profile_status, ${COMPLETION_SELECT}`)
    .eq('account_id', accountId)
    .is('deleted_at', null)
    .order('updated_at', { ascending: false })
    .limit(1)
    .maybeSingle()

  if (!profile) {
    return {
      state: { profileId: null, missing: [...ORDER], complete: false, resumeStep: 'about', values: EMPTY_VALUES, photoCount: 0, strength: 0, completionMissing: COMPLETION_CHECKS.map(c => c.field) },
      row: null,
    }
  }

  // A rejected photo does not count — the member has to replace it — but a
  // pending one does.
  const [{ count }, { data: prefs }] = await Promise.all([
    admin
      .from('profile_photos')
      .select('id', { count: 'exact', head: true })
      .eq('profile_id', profile.id)
      .in('status', ['approved', 'pending_moderation']),
    admin.from('profile_preferences').select('pref_gender').eq('profile_id', profile.id).maybeSingle(),
  ])
  const photoCount = count ?? 0
  const missing = missingRequirements(profile, prefs?.pref_gender, photoCount)

  let currentLocName: string | null = null
  if (opts.withNames && profile.current_loc_id) {
    const { data: loc } = await admin
      .from('india_locations')
      .select('name_en')
      .eq('id', profile.current_loc_id)
      .maybeSingle()
    currentLocName = loc?.name_en ?? null
  }

  return {
    state: {
      profileId: profile.id,
      missing,
      complete: missing.length === 0,
      resumeStep: missing.length ? STEP_OF[missing[0]] : null,
      values: {
        profileFor: profile.profile_for ?? null,
        firstName: profile.first_name ?? null,
        lastName: profile.last_name ?? null,
        gender: profile.gender ?? null,
        dob: profile.dob ?? null,
        maritalStatus: profile.marital_status ?? null,
        lookingFor: prefs?.pref_gender ?? null,
        currentLocId: profile.current_loc_id ?? null,
        currentLocName,
        caste: profile.caste ?? null,
        subCaste: profile.sub_caste ?? null,
        gotra: profile.self_gotra ?? null,
        mool: profile.mool ?? null,
        maternalGotra: profile.maternal_gotra ?? null,
        gram: profile.gram ?? null,
      },
      photoCount,
      ...completion(profile),
    },
    row: {
      id: profile.id,
      created_at: profile.created_at ?? null,
      visibility: profile.visibility ?? null,
      admin_hidden: profile.admin_hidden ?? null,
      discoverable: profile.discoverable ?? null,
      profile_status: profile.profile_status ?? null,
    },
  }
}

export async function getOnboardingState(admin: any, accountId: string, opts: { withNames?: boolean } = {}): Promise<OnboardingState> {
  return (await loadOnboarding(admin, accountId, opts)).state
}
