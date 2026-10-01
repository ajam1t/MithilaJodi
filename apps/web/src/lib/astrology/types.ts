/**
 * Astrology engine public types.
 *
 * These types define the contract between the calculation engine (Phase 5)
 * and every consumer — the API route, the animation layer, the PDF renderer.
 * They are intentionally framework-free: no React, no Supabase, no Next.js.
 *
 * See methodology.ts for all explicit decisions (D1–D9) that determine how
 * these fields are computed. Nothing here should require guessing the method.
 */

/** Raw birth data supplied by the user. */
export type BirthInput = {
  name: string
  /** ISO date string 'YYYY-MM-DD'. */
  dob: string
  /**
   * Local time in 24-hour format 'HH:MM', in IST (Asia/Kolkata).
   * null when the user does not know their birth time.
   * Unknown birth time limits accuracy for Lagna and some nakshatra-pada calls.
   */
  birthTime: string | null
  /** Free-text place of birth as entered by the user. */
  birthPlace: string
  /**
   * Geocoded coordinates. null until resolvePlace() succeeds.
   * Populated server-side via the three-tier resolver (see methodology.ts §D4).
   */
  lat: number | null
  lng: number | null
}

/** One planet's position in the sidereal zodiac (after ayanamsha correction). */
export type PlanetaryPosition = {
  planet:
    | 'Sun' | 'Moon' | 'Mars' | 'Mercury' | 'Jupiter'
    | 'Venus' | 'Saturn' | 'Rahu' | 'Ketu'
  /** Sidereal ecliptic longitude, 0–360°. */
  longitude: number
  /** Rashi slug matching community_masters (e.g. 'mesh', 'vrishabh'). */
  rashi: string
  /** Nakshatra slug matching community_masters (e.g. 'ashwini', 'bharani'). */
  nakshatra: string
  /** Pada within the nakshatra, 1–4. An integer, not a community_masters entry. */
  pada: 1 | 2 | 3 | 4
  /** True for retrograde motion at the moment of birth. */
  retrograde: boolean
}

/**
 * Computed birth chart.
 *
 * ascendant is null when birthTime is unknown, since Lagna requires an
 * accurate time. Moon-only Ashtakoota matching proceeds without it (D1).
 */
export type ChartData = {
  ascendant: PlanetaryPosition | null
  moon: PlanetaryPosition
  sun: PlanetaryPosition
  mars: PlanetaryPosition
  mercury: PlanetaryPosition
  jupiter: PlanetaryPosition
  venus: PlanetaryPosition
  saturn: PlanetaryPosition
  rahu: PlanetaryPosition
  ketu: PlanetaryPosition
  /** Janma Rashi slug — same as moon.rashi, exposed at the top level for convenience. */
  janmaRashi: string
  /** Janma Nakshatra slug — same as moon.nakshatra, exposed at the top level. */
  janmaNakshatra: string
  /** Janma Pada — same as moon.pada, exposed at the top level. */
  janmaPada: 1 | 2 | 3 | 4
  /**
   * Computed Manglik status — derived from the birth chart, not stored.
   * 'unknown' is never emitted by the engine; it appears in stored profile data
   * when the user self-reported and was unsure. The engine always resolves to
   * 'yes' | 'no' | 'anshik'.
   *
   * ⚠️ Spelling: 'mangalik' (-a-) is the column name in profile_private;
   * 'manglik' (no -a-) is the community_masters type and this engine's vocabulary.
   * Both spellings exist in the codebase — do not conflate them.
   */
  manglik: 'yes' | 'no' | 'anshik'
  /** Houses Mars occupies that trigger Manglik, for display alongside the verdict. */
  manglikHouses: number[]
}

/** Score for one of the eight Ashtakoota kootas. */
export type KootaScore = {
  /** Canonical English name. */
  name: 'Varna' | 'Vashya' | 'Tara' | 'Yoni' | 'GrahaMaitri' | 'Gana' | 'Bhakoot' | 'Nadi'
  /** Maximum possible score for this koota. Sum across all kootas = 36. */
  maxScore: number
  /** Actual score awarded, 0 ≤ score ≤ maxScore. */
  score: number
  /** One-line verdict for this koota (wording defined in methodology.ts §D6). */
  verdict: string
  /** Human-readable explanation of why this score was awarded. */
  explanation: string
  /** Person 1's relevant attribute(s) for this koota. */
  person1Detail: string
  /** Person 2's relevant attribute(s) for this koota. */
  person2Detail: string
}

/** Full Manglik compatibility summary for a pair. */
export type ManglikSummary = {
  person1: 'yes' | 'no' | 'anshik'
  person2: 'yes' | 'no' | 'anshik'
  /**
   * Whether traditional dosha balance considerations are satisfied.
   * The engine reports this transparently, not as a binary block.
   */
  balanced: boolean
  explanation: string
}

/**
 * Complete result of a Kundli Match computation.
 *
 * The methodologyVersion is stamped here so that any persisted or shared
 * result can be re-evaluated against the rules that produced it. If D1–D6
 * decisions are revised after launch, results computed under the old version
 * remain interpretable.
 */
export type MatchResult = {
  /** Matches METHODOLOGY_VERSION in methodology.ts at computation time. */
  methodologyVersion: string
  /** ISO 8601 timestamp in UTC of when this result was computed. */
  computedAt: string
  person1: BirthInput
  person2: BirthInput
  chart1: ChartData
  chart2: ChartData
  /** Ashtakoota total, 0–36. */
  totalScore: number
  maxScore: 36
  kootas: KootaScore[]
  manglik: ManglikSummary
  /** One-paragraph plain-language summary of the match. */
  summary: string
  /**
   * Traditional guidance based on the score bands (D6).
   * Never a guarantee — see D8 disclaimer requirement.
   */
  verdict: string
}
