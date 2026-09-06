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
  /** Structured education, composed into one line by the card. */
  degree?: string | null
  specialization?: string | null
  institution?: string | null
  /** Trust signal — true only when an approved verification exists. Optional;
   *  the badge is shown only when this is explicitly true. */
  verified?: boolean
  /**
   * How well this profile fits the signed-in member, computed server-side by
   * lib/matchScore. Null on public surfaces and for members without a profile
   * of their own — there is nothing to compare against.
   */
  match?: MatchSummary | null
  /**
   * Partner preferences, when the surface chose to load them. Absent on search
   * cards: there the match score already says how well the two sides' stated
   * preferences line up, which is more use than the raw list.
   */
  preferences?: PartnerPreferencesDisplay | null
}

/**
 * "What we are looking for", already resolved to display strings by
 * lib/partnerPreferences — the stored columns include id arrays that need a
 * database lookup, so the raw row is never handed to the UI.
 */
export type PartnerPreferencesDisplay = {
  ageRange: string | null
  lookingFor: string | null
  community: string | null
  maritalStatus: string | null
  education: string | null
  profession: string | null
  location: string | null
  diet: string | null
  marriageTimeline: string | null
  manglik: string | null
  children: string | null
  livingArrangement: string | null
  career: string | null
  notes: string | null
  /**
   * NOT NULL DEFAULT true in the schema, so this is true for every profile
   * whether or not anyone chose it. Never treat it as evidence that a family
   * stated a preference — see loadPartnerPreferences.
   */
  gotraSafe: boolean
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
