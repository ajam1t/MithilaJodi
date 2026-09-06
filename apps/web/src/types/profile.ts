/**
 * Display-safe profile card shape shared by search, explore, the public
 * showcase and profile previews. Private fields (dob, contact, address, …)
 * are never part of this projection — see lib/publicProfiles.ts.
 */
export type SearchCard = {
  id: string
  display_name: string
  gender: string
  age: number
  religion: string | null
  caste: string | null
  self_gotra: string | null
  mool: string | null
  gram: string | null
  height_cm: number | null
  diet: string | null
  about_snippet: string | null
  profile_complete: number
  profile_status: string
  native_place_name: string | null
  current_loc_name: string | null
  has_photo: boolean
  primary_photo_url: string | null
  // Extended fields for the detailed (flip) card face
  employer: string | null
  profession_detail: string | null
  education_detail: string | null
  smoking: string | null
  drinking: string | null
  maternal_gotra: string | null
  job_loc_name: string | null
  marriage_timeline: string | null
  job_title?: string | null
  marital_status?: string | null
  family_type?: string | null
  /** Trust signal — true only when an approved verification exists. Optional;
   *  the badge is shown only when this is explicitly true. */
  verified?: boolean
  /**
   * How well this profile fits the signed-in member, computed server-side by
   * lib/matchScore. Null on public surfaces and for members without a profile
   * of their own — there is nothing to compare against.
   */
  match?: MatchSummary | null
}

/** Display-safe projection of lib/matchScore's MatchResult. */
export type MatchSummary = {
  /** 0–100. */
  score: number
  band: 'excellent' | 'strong' | 'good' | 'fair'
  /** Share of the scoring weight that had data behind it, 0–1. */
  confidence: number
  /** Already trimmed to the few worth showing, strongest first. */
  reasons: Array<{ key: string; label: string; detail: string }>
  /** Hard incompatibilities, e.g. same gotra. Non-empty means a capped score. */
  blockers: string[]
  /** Worth flagging, not disqualifying. */
  cautions: string[]
}
