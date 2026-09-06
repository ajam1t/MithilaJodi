import 'server-only'

/**
 * Match scoring.
 *
 * Turns "how well do these two profiles fit" into a number a member can act on,
 * and — more importantly — into a short list of *reasons*, because an
 * unexplained 78% is worth very little to a family deciding whether to make
 * contact.
 *
 * Three design rules the rest of this file follows:
 *
 * 1. **Nothing is scored on absent data.** A factor neither side has filled in
 *    is dropped from the denominator instead of scored zero or half. Scoring a
 *    blank as zero buries new members; scoring it as half invents agreement that
 *    was never stated. The share of the weight that *was* applicable is returned
 *    as `confidence`, so a 90% built on three fields can be shown as the thin
 *    result it is.
 *
 * 2. **Gotra is not a score, it is a gate.** Sagotra (identical gotra) marriage
 *    is prohibited in the tradition this platform serves. Expressing that as
 *    "loses 14 points" would let a couple with an otherwise strong profile still
 *    surface as a 78% match. It is returned as a blocker instead, and the score
 *    is forced down to at most 40 so the pair can never appear in a good band.
 *
 * 3. **Every factor explains itself.** `reasons` carries the human sentence, not
 *    just the arithmetic, so the UI never has to reverse-engineer the score.
 */

// ─── Types ───────────────────────────────────────────────────────────────────

export type ScoreProfile = {
  id?: string
  gender?: string | null
  dob?: string | null
  age?: number | null
  religion?: string | null
  caste?: string | null
  sub_caste?: string | null
  self_gotra?: string | null
  maternal_gotra?: string | null
  mool?: string | null
  gram?: string | null
  native_place_id?: number | null
  current_loc_id?: number | null
  job_loc_id?: number | null
  diet?: string | null
  smoking?: string | null
  drinking?: string | null
  marriage_timeline?: string | null
  education_detail?: string | null
  degree?: string | null
  family_type?: string | null
  family_values?: string | null
  manglik?: string | null
}

export type ScorePreferences = {
  pref_age_min?: number | null
  pref_age_max?: number | null
  pref_caste?: string[] | null
  pref_diet?: string[] | null
  pref_location?: number[] | null
  pref_marriage_timeline?: string | null
  pref_gotra_safe?: boolean | null
}

/** Minimal location facts the scorer needs, keyed by india_locations.id. */
export type LocationInfo = {
  id: number
  level: string
  parent_id: number | null
  state_code: string | null
  latitude: number | null
  longitude: number | null
  is_mithila_region: boolean
}

export type MatchReason = {
  /** Stable key, for UI grouping and for tests. */
  key: string
  label: string
  points: number
  max: number
  /** One human sentence. Shown verbatim. */
  detail: string
}

export type MatchResult = {
  /** 0–100, rounded. */
  score: number
  band: 'excellent' | 'strong' | 'good' | 'fair'
  /** Share of the total weight that had data on at least one side, 0–1. */
  confidence: number
  /** Highest-scoring factors first. */
  reasons: MatchReason[]
  /** Hard incompatibilities. Non-empty means the score is capped. */
  blockers: string[]
  /** Worth showing, not disqualifying (e.g. gotra clashes with maternal gotra). */
  cautions: string[]
}

// ─── Weights ─────────────────────────────────────────────────────────────────
//
// These sum to 100. Changing one changes the meaning of every score already
// shown to members, so treat the table as a product decision, not a constant.

export const WEIGHTS = {
  location:  18,
  roots:      8,
  gotra:     14,
  community: 12,
  age:       14,
  timeline:  10,
  education:  8,
  lifestyle: 10,
  family:     6,
} as const

const BAND_THRESHOLDS: Array<[number, MatchResult['band']]> = [
  [80, 'excellent'],
  [65, 'strong'],
  [50, 'good'],
  [0,  'fair'],
]

/** A blocker caps the score here, so a blocked pair can never read as "good". */
const BLOCKED_CEILING = 40

/**
 * Bands are capped by how much of the score was actually evidenced.
 *
 * Without this, two profiles that share nothing but an age gap of one year come
 * out as a "Strong match" on 14% confidence — technically what the arithmetic
 * says, and exactly the kind of claim that makes a member stop believing the
 * number. The score itself is left alone; only the word attached to it is
 * restrained.
 */
const BAND_CONFIDENCE_CAPS: Array<[number, MatchResult['band']]> = [
  [0.35, 'fair'],
  [0.60, 'good'],
  [0.80, 'strong'],
]

const BAND_RANK: Record<MatchResult['band'], number> = {
  fair: 0, good: 1, strong: 2, excellent: 3,
}

/** Titlecase a community value for display without mangling multi-word names. */
function displayName(v: string | null | undefined): string {
  return (v ?? '').trim().replace(/\s+/g, ' ')
}

// ─── Small helpers ───────────────────────────────────────────────────────────

function norm(v: string | null | undefined): string | null {
  if (!v) return null
  const s = v.trim().toLowerCase().replace(/[\s._-]+/g, '')
  return s.length > 0 ? s : null
}

function sameText(a: string | null | undefined, b: string | null | undefined): boolean {
  const x = norm(a), y = norm(b)
  return x !== null && y !== null && x === y
}

/** Great-circle distance in km. */
export function haversineKm(
  lat1: number, lon1: number, lat2: number, lon2: number,
): number {
  const R = 6371
  const toRad = (d: number) => (d * Math.PI) / 180
  const dLat = toRad(lat2 - lat1)
  const dLon = toRad(lon2 - lon1)
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2
  return 2 * R * Math.asin(Math.min(1, Math.sqrt(a)))
}

export function distanceBetween(
  a: LocationInfo | undefined, b: LocationInfo | undefined,
): number | null {
  if (!a || !b) return null
  if (a.latitude == null || a.longitude == null) return null
  if (b.latitude == null || b.longitude == null) return null
  return haversineKm(a.latitude, a.longitude, b.latitude, b.longitude)
}

function ageFrom(p: ScoreProfile): number | null {
  if (typeof p.age === 'number' && p.age > 0) return p.age
  if (!p.dob) return null
  const birth = new Date(p.dob)
  if (Number.isNaN(birth.getTime())) return null
  const now = new Date()
  let age = now.getFullYear() - birth.getFullYear()
  const m = now.getMonth() - birth.getMonth()
  if (m < 0 || (m === 0 && now.getDate() < birth.getDate())) age--
  return age
}

// ─── Ordered scales ──────────────────────────────────────────────────────────
//
// Both are ordinal: adjacent values are near-agreement, distant values are not.
// Scoring them as plain equality threw away most of the signal — someone who
// wants to marry within 6 months and someone who wants to marry within a year
// are a far better fit than either is with "no rush".

const TIMELINE_ORDER = [
  'within_3_months', 'within_6_months', 'within_1_year', 'within_2_years', 'no_rush',
] as const

const TIMELINE_LABEL: Record<string, string> = {
  within_3_months: 'within 3 months',
  within_6_months: 'within 6 months',
  within_1_year:   'within a year',
  within_2_years:  'within 2 years',
  no_rush:         'no fixed timeline',
}

/**
 * Coarse education tiers. Deliberately coarse: the goal is "roughly comparable
 * educational background", not a ranking of institutions, and anything finer
 * would be guessing at free text.
 */
const EDU_TIERS: Array<[number, RegExp]> = [
  [4, /\b(phd|ph\.?d|doctorate|dphil|md\b|ms\b\s*surgery|dm\b)/i],
  [3, /\b(m\.?tech|m\.?e\b|mba|pgdm|m\.?sc|m\.?com|m\.?a\b|ll\.?m|masters?|post.?grad|ca\b|cs\b|icwa|cfa)/i],
  [2, /\b(b\.?tech|b\.?e\b|mbbs|bds|b\.?sc|b\.?com|b\.?a\b|ll\.?b|bba|bca|mca|bachelors?|graduate|degree|engineer)/i],
  [1, /\b(diploma|iti\b|polytechnic|12th|intermediate|higher.?secondary|10\+2)/i],
]

function eduTier(p: ScoreProfile): number | null {
  const text = [p.degree, p.education_detail].filter(Boolean).join(' ')
  if (!text.trim()) return null
  for (const [tier, re] of EDU_TIERS) if (re.test(text)) return tier
  return null
}

const VEG_FAMILY = new Set(['vegetarian', 'vegan', 'eggetarian'])

// ─── Factor scorers ──────────────────────────────────────────────────────────
//
// Each returns null when neither side has usable data — that is what drops the
// factor out of the denominator. Returning 0 instead would be a silent penalty.

type FactorOut = { points: number; detail: string } | null

function scoreLocation(
  a: ScoreProfile, b: ScoreProfile,
  aPrefs: ScorePreferences, locs: Map<number, LocationInfo>,
): FactorOut {
  const max = WEIGHTS.location
  const aId = a.current_loc_id ?? a.job_loc_id ?? null
  const bId = b.current_loc_id ?? b.job_loc_id ?? null
  if (aId == null || bId == null) return null

  // An explicit preference beats geography: if the viewer listed this place,
  // that is the answer regardless of how far it is from where they live.
  if ((aPrefs.pref_location ?? []).includes(bId)) {
    return { points: max, detail: 'Lives in a location you listed in your preferences' }
  }

  if (aId === bId) return { points: max, detail: 'Lives in the same place as you' }

  const la = locs.get(aId), lb = locs.get(bId)
  const km = distanceBetween(la, lb)

  if (km != null) {
    if (km <= 40)  return { points: max,              detail: `About ${Math.round(km)} km away — same urban area` }
    if (km <= 100) return { points: Math.round(max * 0.78), detail: `About ${Math.round(km)} km away — easy travelling distance` }
    if (km <= 250) return { points: Math.round(max * 0.55), detail: `About ${Math.round(km)} km away — same region` }
  }

  if (la && lb && la.state_code && la.state_code === lb.state_code) {
    return { points: Math.round(max * 0.45), detail: 'Lives in the same state' }
  }
  if (km != null) {
    return { points: 0, detail: `About ${Math.round(km)} km away — different region` }
  }
  return { points: 0, detail: 'Lives in a different part of India' }
}

function scoreRoots(
  a: ScoreProfile, b: ScoreProfile, locs: Map<number, LocationInfo>,
): FactorOut {
  const max = WEIGHTS.roots

  if (sameText(a.gram, b.gram)) {
    return { points: max, detail: `Same ancestral village (${b.gram})` }
  }
  if (a.native_place_id != null && b.native_place_id != null) {
    if (a.native_place_id === b.native_place_id) {
      return { points: Math.round(max * 0.85), detail: 'Same native district' }
    }
    const la = locs.get(a.native_place_id), lb = locs.get(b.native_place_id)
    if (la?.is_mithila_region && lb?.is_mithila_region) {
      return { points: Math.round(max * 0.6), detail: 'Both families have roots in Mithila' }
    }
    if (la && lb && la.state_code && la.state_code === lb.state_code) {
      return { points: Math.round(max * 0.35), detail: 'Native places in the same state' }
    }
    return { points: 0, detail: 'Different native regions' }
  }
  if (sameText(a.mool, b.mool)) {
    return { points: Math.round(max * 0.5), detail: `Same mool (${b.mool})` }
  }
  return null
}

/**
 * Gotra.
 *
 * Same self-gotra is a blocker, not a low score — see the note at the top of the
 * file. A candidate whose gotra matches the viewer's *maternal* gotra is a
 * caution: practice on the maternal line varies between families, so this
 * platform surfaces it and lets the families decide rather than deciding for
 * them.
 */
function scoreGotra(a: ScoreProfile, b: ScoreProfile): {
  out: FactorOut; blocker?: string; caution?: string
} {
  const max = WEIGHTS.gotra
  const aSelf = norm(a.self_gotra), bSelf = norm(b.self_gotra)
  if (!aSelf || !bSelf) return { out: null }

  if (aSelf === bSelf) {
    const shown = displayName(b.self_gotra)
    return {
      out: { points: 0, detail: `Same gotra (${shown}) — traditionally not matched` },
      blocker: `Same gotra: both families are ${shown}. Sagotra matches are avoided in Maithil tradition.`,
    }
  }

  const aMat = norm(a.maternal_gotra), bMat = norm(b.maternal_gotra)
  if ((aMat && aMat === bSelf) || (bMat && bMat === aSelf)) {
    return {
      out: { points: Math.round(max * 0.35), detail: 'Gotra differs, but clashes with a maternal gotra' },
      caution: 'One side\'s gotra matches the other\'s maternal gotra. Families differ on whether this is acceptable — worth checking early.',
    }
  }
  if (aMat && bMat && aMat === bMat) {
    return {
      out: { points: Math.round(max * 0.6), detail: 'Different gotra; maternal gotras are the same' },
      caution: 'Both maternal gotras are the same. Some families treat this as a bar.',
    }
  }
  return { out: { points: max, detail: 'Gotra and maternal gotra are both clear' } }
}

function scoreCommunity(a: ScoreProfile, b: ScoreProfile, aPrefs: ScorePreferences): FactorOut {
  const max = WEIGHTS.community

  if (a.religion && b.religion && !sameText(a.religion, b.religion)) {
    return { points: 0, detail: `Different religion (${b.religion})` }
  }

  const prefCastes = (aPrefs.pref_caste ?? []).map(norm).filter(Boolean)
  if (prefCastes.length > 0 && b.caste) {
    if (prefCastes.includes(norm(b.caste))) {
      const bonus = sameText(a.sub_caste, b.sub_caste) ? max : Math.round(max * 0.85)
      return { points: bonus, detail: `${b.caste} — one of the communities you are looking for` }
    }
    return { points: 0, detail: `${b.caste} — outside the communities you listed` }
  }

  if (a.caste && b.caste) {
    if (sameText(a.caste, b.caste)) {
      if (sameText(a.sub_caste, b.sub_caste)) {
        return { points: max, detail: `Same community and sub-community (${b.caste}, ${b.sub_caste})` }
      }
      return { points: Math.round(max * 0.7), detail: `Same community (${b.caste})` }
    }
    return { points: 0, detail: `Different community (${b.caste})` }
  }
  return null
}

function scoreAge(
  a: ScoreProfile, b: ScoreProfile,
  aPrefs: ScorePreferences, bPrefs: ScorePreferences,
): FactorOut {
  const max = WEIGHTS.age
  const aAge = ageFrom(a), bAge = ageFrom(b)
  if (aAge == null || bAge == null) return null

  const inRange = (age: number, p: ScorePreferences) => {
    if (p.pref_age_min == null && p.pref_age_max == null) return null
    if (p.pref_age_min != null && age < p.pref_age_min) return false
    if (p.pref_age_max != null && age > p.pref_age_max) return false
    return true
  }

  const bFitsA = inRange(bAge, aPrefs)
  const aFitsB = inRange(aAge, bPrefs)

  // Both sides stated a range. This is the strongest signal available, because
  // it is mutual and explicit.
  if (bFitsA !== null && aFitsB !== null) {
    if (bFitsA && aFitsB) return { points: max, detail: `${bAge} — inside both of your stated age ranges` }
    if (bFitsA || aFitsB) return { points: Math.round(max * 0.5), detail: `${bAge} — fits one side's age range but not the other's` }
    return { points: 0, detail: `${bAge} — outside both stated age ranges` }
  }
  if (bFitsA !== null) {
    return bFitsA
      ? { points: Math.round(max * 0.85), detail: `${bAge} — inside your age range` }
      : { points: 0, detail: `${bAge} — outside your age range` }
  }
  if (aFitsB !== null) {
    return aFitsB
      ? { points: Math.round(max * 0.7), detail: `${bAge} — you are inside their age range` }
      : { points: 0, detail: 'You are outside their stated age range' }
  }

  // Neither stated a range: fall back to the gap alone, and score it modestly,
  // because nobody has actually said what they want.
  const gap = Math.abs(aAge - bAge)
  if (gap <= 3) return { points: Math.round(max * 0.7), detail: `${bAge} — ${gap === 0 ? 'same age' : `${gap} year${gap > 1 ? 's' : ''} apart`}` }
  if (gap <= 6) return { points: Math.round(max * 0.5), detail: `${bAge} — ${gap} years apart` }
  if (gap <= 10) return { points: Math.round(max * 0.25), detail: `${bAge} — ${gap} years apart` }
  return { points: 0, detail: `${bAge} — ${gap} years apart` }
}

/**
 * Marriage timeline.
 *
 * The factor the user asked for by name: two people both looking to marry within
 * two years should score higher than one who wants three months and one who is
 * in no hurry. Both a profile's own timeline and the timeline they want from a
 * partner count, with the partner preference taking priority when it is set.
 */
function scoreTimeline(
  a: ScoreProfile, b: ScoreProfile,
  aPrefs: ScorePreferences, bPrefs: ScorePreferences,
): FactorOut {
  const max = WEIGHTS.timeline
  const aWant = aPrefs.pref_marriage_timeline || a.marriage_timeline
  const bWant = bPrefs.pref_marriage_timeline || b.marriage_timeline
  const ai = TIMELINE_ORDER.indexOf(aWant as typeof TIMELINE_ORDER[number])
  const bi = TIMELINE_ORDER.indexOf(bWant as typeof TIMELINE_ORDER[number])
  if (ai < 0 || bi < 0) return null

  const label = TIMELINE_LABEL[bWant as string] ?? String(bWant).replace(/_/g, ' ')
  const gap = Math.abs(ai - bi)
  if (gap === 0) return { points: max, detail: `You are both looking to marry ${label}` }
  if (gap === 1) return { points: Math.round(max * 0.7), detail: `Looking to marry ${label} — close to your timeline` }
  if (gap === 2) return { points: Math.round(max * 0.4), detail: `Looking to marry ${label}` }
  return { points: 0, detail: `Looking to marry ${label} — a very different timeline from yours` }
}

function scoreEducation(a: ScoreProfile, b: ScoreProfile): FactorOut {
  const max = WEIGHTS.education
  const at = eduTier(a), bt = eduTier(b)
  if (at == null || bt == null) return null
  const gap = Math.abs(at - bt)
  if (gap === 0) return { points: max, detail: 'Comparable level of education' }
  if (gap === 1) return { points: Math.round(max * 0.6), detail: 'Similar level of education' }
  return { points: 0, detail: 'Quite different educational backgrounds' }
}

function scoreLifestyle(a: ScoreProfile, b: ScoreProfile, aPrefs: ScorePreferences): FactorOut {
  const max = WEIGHTS.lifestyle
  const dietMax = 6, habitMax = max - dietMax

  let earned = 0, applicable = 0
  const bits: string[] = []

  const prefDiets = (aPrefs.pref_diet ?? []).map(norm).filter(Boolean)
  if (b.diet && prefDiets.length > 0) {
    applicable += dietMax
    if (prefDiets.includes(norm(b.diet))) { earned += dietMax; bits.push(`${b.diet.replace(/_/g, '-')} — the diet you prefer`) }
    else bits.push(`${b.diet.replace(/_/g, '-')} — not among the diets you listed`)
  } else if (a.diet && b.diet) {
    applicable += dietMax
    if (sameText(a.diet, b.diet)) { earned += dietMax; bits.push(`Both ${b.diet.replace(/_/g, '-')}`) }
    else if (VEG_FAMILY.has(String(norm(a.diet))) && VEG_FAMILY.has(String(norm(b.diet)))) {
      earned += Math.round(dietMax * 0.6); bits.push('Both vegetarian-leaning diets')
    } else bits.push(`Different diets (${b.diet.replace(/_/g, '-')})`)
  }

  const habits: Array<[keyof ScoreProfile, string]> = [['smoking', 'smoking'], ['drinking', 'drinking']]
  for (const [key, word] of habits) {
    const av = norm(a[key] as string | null), bv = norm(b[key] as string | null)
    if (!av || !bv) continue
    applicable += habitMax / 2
    if (av === bv) { earned += habitMax / 2; if (av === 'no') bits.push(`Neither of you ${word === 'smoking' ? 'smokes' : 'drinks'}`) }
    else if (av === 'no' && bv !== 'no') bits.push(`${word === 'smoking' ? 'Smokes' : 'Drinks'}, which you do not`)
  }

  if (applicable === 0) return null
  // Renormalise onto the factor's full weight so a member who filled in only
  // diet is not penalised for leaving the habit fields blank.
  return {
    points: Math.round((earned / applicable) * max),
    detail: bits.length > 0 ? bits.join('; ') : 'Lifestyle details are broadly compatible',
  }
}

function scoreFamily(a: ScoreProfile, b: ScoreProfile): FactorOut {
  const max = WEIGHTS.family
  let earned = 0, applicable = 0
  const bits: string[] = []

  if (a.family_type && b.family_type) {
    applicable += max / 2
    if (sameText(a.family_type, b.family_type)) { earned += max / 2; bits.push(`Both from a ${b.family_type.toLowerCase()} family`) }
  }
  if (a.family_values && b.family_values) {
    applicable += max / 2
    if (sameText(a.family_values, b.family_values)) { earned += max / 2; bits.push(`Same family values (${b.family_values.toLowerCase()})`) }
  }
  if (applicable === 0) return null
  return {
    points: Math.round((earned / applicable) * max),
    detail: bits.length > 0 ? bits.join('; ') : 'Family background differs',
  }
}

// ─── Entry point ─────────────────────────────────────────────────────────────

/**
 * Score `candidate` from `viewer`'s point of view.
 *
 * The result is asymmetric on purpose: the viewer's own preferences weigh more
 * than the candidate's, because this number is shown to the viewer.
 *
 * `locations` should contain every id referenced by either profile. Ids that are
 * missing degrade gracefully — the location factor falls back to state, then
 * drops out — so callers may pass a partial map.
 */
export function scoreMatch(
  viewer: ScoreProfile,
  viewerPrefs: ScorePreferences,
  candidate: ScoreProfile,
  candidatePrefs: ScorePreferences,
  locations: Map<number, LocationInfo> = new Map(),
): MatchResult {
  const blockers: string[] = []
  const cautions: string[] = []
  const reasons: MatchReason[] = []

  let earned = 0
  let applicable = 0

  const add = (key: string, label: string, max: number, out: FactorOut) => {
    if (out === null) return
    applicable += max
    earned += out.points
    reasons.push({ key, label, points: out.points, max, detail: out.detail })
  }

  const gotra = scoreGotra(viewer, candidate)
  if (gotra.blocker) blockers.push(gotra.blocker)
  if (gotra.caution) cautions.push(gotra.caution)

  add('location',  'Location',           WEIGHTS.location,  scoreLocation(viewer, candidate, viewerPrefs, locations))
  add('roots',     'Family roots',       WEIGHTS.roots,     scoreRoots(viewer, candidate, locations))
  add('gotra',     'Gotra',              WEIGHTS.gotra,     gotra.out)
  add('community', 'Community',          WEIGHTS.community, scoreCommunity(viewer, candidate, viewerPrefs))
  add('age',       'Age',                WEIGHTS.age,       scoreAge(viewer, candidate, viewerPrefs, candidatePrefs))
  add('timeline',  'Marriage timeline',  WEIGHTS.timeline,  scoreTimeline(viewer, candidate, viewerPrefs, candidatePrefs))
  add('education', 'Education',          WEIGHTS.education, scoreEducation(viewer, candidate))
  add('lifestyle', 'Lifestyle',          WEIGHTS.lifestyle, scoreLifestyle(viewer, candidate, viewerPrefs))
  add('family',    'Family',             WEIGHTS.family,    scoreFamily(viewer, candidate))

  // Manglik is reported, never scored: the two sides record it inconsistently
  // enough that scoring it would produce more noise than signal.
  const vMang = norm(viewer.manglik), cMang = norm(candidate.manglik)
  if (vMang && cMang && vMang !== cMang && (vMang === 'yes' || cMang === 'yes')) {
    cautions.push('One profile is marked Manglik and the other is not. Families usually check this against the horoscope.')
  }

  let score = applicable > 0 ? Math.round((earned / applicable) * 100) : 0
  if (blockers.length > 0) score = Math.min(score, BLOCKED_CEILING)

  const confidence = applicable / 100
  let band = BAND_THRESHOLDS.find(([threshold]) => score >= threshold)![1]
  for (const [limit, cap] of BAND_CONFIDENCE_CAPS) {
    if (confidence < limit && BAND_RANK[band] > BAND_RANK[cap]) band = cap
  }

  reasons.sort((x, y) => (y.points / y.max) - (x.points / x.max) || y.max - x.max)

  return { score, band, confidence, reasons, blockers, cautions }
}

/** The two or three lines worth putting on a card. */
export function topReasons(result: MatchResult, n = 3): MatchReason[] {
  return result.reasons.filter(r => r.points > 0).slice(0, n)
}

export const BAND_LABEL: Record<MatchResult['band'], string> = {
  excellent: 'Excellent match',
  strong:    'Strong match',
  good:      'Good match',
  fair:      'Possible match',
}
