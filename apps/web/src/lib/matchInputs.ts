import type { ScoreProfile, ScorePreferences } from '@/lib/matchScore'

/*
 * Turning database rows into match-score inputs. Shared by search, the Matches
 * page and automatic notifications, so all three rank people identically.
 */

/** Profile columns scoreMatch reads. */
export const SCORE_COLUMNS = [
  'id', 'gender', 'dob', 'religion', 'caste', 'sub_caste', 'self_gotra', 'maternal_gotra', 'mool', 'gram',
  'native_place_id', 'current_loc_id', 'job_loc_id', 'diet', 'smoking', 'drinking', 'marriage_timeline',
  'education_detail', 'degree', 'family_type', 'family_values',
]

/** Preference columns scoreMatch reads. */
export const SCORE_PREF_COLUMNS =
  'profile_id, pref_age_min, pref_age_max, pref_caste, pref_diet, pref_location, pref_marriage_timeline, pref_gotra_safe'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function toScoreProfile(row: any): ScoreProfile {
  return {
    id: row.id, gender: row.gender, dob: row.dob,
    // Raw option keys on purpose. Scoring compares these values between two
    // profiles — sagotra detection is an equality check on self_gotra — so they
    // must stay keys. Labels are applied only in display projections.
    religion: row.religion, caste: row.caste, sub_caste: row.sub_caste,
    self_gotra: row.self_gotra, maternal_gotra: row.maternal_gotra,
    mool: row.mool, gram: row.gram,
    native_place_id: row.native_place_id, current_loc_id: row.current_loc_id, job_loc_id: row.job_loc_id,
    diet: row.diet, smoking: row.smoking, drinking: row.drinking,
    marriage_timeline: row.marriage_timeline,
    education_detail: row.education_detail, degree: row.degree,
    family_type: row.family_type, family_values: row.family_values,
  }
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function toScorePrefs(row: any | null | undefined): ScorePreferences {
  if (!row) return {}
  return {
    pref_age_min: row.pref_age_min, pref_age_max: row.pref_age_max,
    pref_caste: row.pref_caste, pref_diet: row.pref_diet, pref_location: row.pref_location,
    pref_marriage_timeline: row.pref_marriage_timeline, pref_gotra_safe: row.pref_gotra_safe,
  }
}
