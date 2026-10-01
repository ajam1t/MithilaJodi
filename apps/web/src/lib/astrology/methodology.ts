/**
 * Mithila Jodi — Astrology Engine Methodology
 *
 * Every decision that affects the calculation result is documented here as an
 * explicit constant or TODO. Nothing in this file computes anything — it is the
 * single authoritative source of which choices were made and which are still open.
 *
 * Versioning: bump METHODOLOGY_VERSION whenever a D-item is resolved. Stamp this
 * version on every MatchResult that is persisted or shared, so old results remain
 * interpretable even after a methodological change.
 *
 * Open decisions are marked TODO(Dn) where n matches the D-items in the project
 * handoff document. A decision is "open" if the exact value is not yet confirmed
 * by the Maithil pandit sign-off required before Phase 5 goes live.
 */

// ─── Version ──────────────────────────────────────────────────────────────────

/**
 * Increment the patch for a clarification, minor for a resolved D-item,
 * major for a change that would alter scores already computed and shared.
 */
export const METHODOLOGY_VERSION = '0.1.0-draft'

// ─── D1: Astronomical method ──────────────────────────────────────────────────

/**
 * Ayanamsha — the angular difference between the tropical and sidereal zodiacs.
 *
 * Lahiri (Chitrapaksha) is the Indian national standard, adopted by the
 * Government of India Panchanga Committee in 1955 and used by most North
 * Indian astrologers. Recommend pandit sign-off that Maithil tradition
 * uses Lahiri rather than a regional variant.
 *
 * TODO(D1): Confirm ayanamsha with Maithil pandit before Phase 5.
 */
export const AYANAMSHA: 'lahiri' | 'raman' | 'krishnamurti' = 'lahiri'

/**
 * Node calculation: mean node vs true node for Rahu/Ketu.
 *
 * Mean node is standard in most traditional Vedic texts and panchanga usage.
 * True node oscillates around the mean by ±1.5°.
 *
 * TODO(D1): Confirm mean vs true node preference with Maithil pandit.
 */
export const RAHU_KETU_NODE: 'mean' | 'true' = 'mean'

/**
 * House system.
 *
 * Whole-sign is the Vedic norm: each rashi occupies exactly one house,
 * Lagna's rashi = House 1, next rashi = House 2, etc. Placidus is Western
 * and is not appropriate here.
 *
 * TODO(D1): Confirm whole-sign is correct for Maithil kundli reading.
 */
export const HOUSE_SYSTEM = 'whole-sign' as const

/**
 * Whether Lagna (Ascendant) is required for Kundli Match.
 *
 * false → Moon-only Ashtakoota matching (standard for most North Indian
 * Ashtakoota systems; does not require birth time).
 * true → Lagna required; birth time becomes mandatory.
 *
 * TODO(D1): Confirm with Maithil pandit. Currently assuming Moon-only
 * so that users without birth time can still use Kundli Match.
 */
export const LAGNA_REQUIRED_FOR_MATCH = false

// ─── D2: Ephemeris source ─────────────────────────────────────────────────────

/**
 * Which ephemeris library provides planetary positions.
 *
 * Options evaluated:
 *   - 'astronomy-engine': pure JS, MIT licence, zero native deps, works on
 *     Vercel Edge/Node. Accuracy: ~arc-second for modern dates. Preferred.
 *   - 'swiss-ephemeris-wasm': C → WASM port; AGPL-3.0 (or paid commercial
 *     licence). Won't build reliably on Vercel serverless.
 *   - 'external-api': latency, third-party dependency, privacy risk.
 *
 * null = Phase 1–4: no ephemeris. Phase 5 will implement.
 *
 * TODO(D2): Confirm ephemeris source before Phase 5.
 */
export const EPHEMERIS_SOURCE: 'astronomy-engine' | 'swiss-ephemeris-wasm' | 'external-api' | null = null

// ─── D3: Accuracy target ──────────────────────────────────────────────────────

/**
 * Acceptable tolerance for planetary longitudes vs published ephemerides.
 *
 * Without a numeric target, "verified" is unfalsifiable.
 *
 * TODO(D3): Set a measurable accuracy target (e.g. ≤ 1 arc-minute) and
 * document the validation suite that checks it.
 */
export const ACCURACY_TARGET_ARCMIN: number | null = null

// ─── D4: Geocoder ─────────────────────────────────────────────────────────────

/**
 * How birth-place strings are resolved to lat/lng/timezone.
 *
 * Three-tier resolver (proposed in architecture review):
 *   Tier 1 — /api/locations DB (238 rows, includes Mithila region coverage).
 *   Tier 2 — External geocoder (Nominatim/ODbL, or Google paid).
 *   Tier 3 — Manual lat/lng fallback entered by the user.
 *
 * Timezone: India is always IST = UTC+05:30. No tz library needed.
 * Caveat: pre-1955 births used Calcutta (+05:53:20) or Bombay (+04:51) time;
 * irrelevant for a marriage-age cohort.
 *
 * TODO(D4): Choose external geocoder licence (Nominatim ODbL attribution
 * required; Google requires paid plan and ToS compliance).
 * Server-side only — birth details never leave the server.
 */
export const GEOCODER: 'nominatim' | 'google' | null = null

/** IST is a fixed offset; India has never observed DST. */
export const TIMEZONE_OFFSET_HOURS = 5.5
export const TIMEZONE_IST = 'Asia/Kolkata' as const

// ─── D5: Manglik rules ────────────────────────────────────────────────────────

/**
 * Houses from Lagna in which Mars's presence triggers Manglik dosha.
 *
 * Most common North Indian rule set: houses 1, 2, 4, 7, 8, 12.
 * Some texts omit house 2 or add house 12 from Venus.
 *
 * TODO(D5): Confirm exact house list with Maithil pandit.
 */
export const MANGLIK_HOUSES_FROM_LAGNA: readonly number[] = [1, 2, 4, 7, 8, 12]

/**
 * Whether to also check Mars's position from the Moon chart.
 * TODO(D5): Confirm with pandit.
 */
export const MANGLIK_CHECK_FROM_MOON = false

/**
 * Whether to also check Mars's position from the Venus chart.
 * TODO(D5): Confirm with pandit.
 */
export const MANGLIK_CHECK_FROM_VENUS = false

/**
 * Dosha bhanga (cancellation) rules.
 *
 * Common cancellations: Mars in own sign, Mars exalted, Jupiter in Lagna, etc.
 * TODO(D5): Document the exact cancellation list approved by the Maithil pandit.
 * Until resolved, the engine will not apply cancellations.
 */
export const MANGLIK_BHANGA_RULES: string[] = [] // TODO(D5): populate with approved rules

/**
 * How 'anshik' (partial) Manglik is defined.
 *
 * One convention: Manglik from only one chart (Lagna vs Moon vs Venus) rather
 * than all checked charts. Another: specific weak-Mars conditions.
 *
 * TODO(D5): Confirm anshik definition with Maithil pandit.
 */
export const ANSHIK_DEFINITION = '' // TODO(D5)

// ─── D6: Ashtakoota scoring ───────────────────────────────────────────────────

/**
 * Maximum score per koota. Standard weights; these are not debated.
 * Total = 36.
 */
export const ASHTAKOOTA_WEIGHTS = {
  Varna: 1,
  Vashya: 2,
  Tara: 3,
  Yoni: 4,
  GrahaMaitri: 5,
  Gana: 6,
  Bhakoot: 7,
  Nadi: 8,
} as const satisfies Record<string, number>

/**
 * Score bands that map a total Ashtakoota score to a verdict string.
 *
 * TODO(D6): Confirm exact thresholds and wording with Maithil pandit.
 * The values below are placeholders — do not use them in production output.
 * D8 requires a disclaimer to accompany any verdict before publication.
 */
export const SCORE_BANDS: ReadonlyArray<{ min: number; verdict: string }> = [
  { min: 32, verdict: 'Excellent' },        // TODO(D6): confirm wording
  { min: 28, verdict: 'Very Good' },         // TODO(D6): confirm wording
  { min: 24, verdict: 'Good' },              // TODO(D6): confirm wording
  { min: 18, verdict: 'Average' },           // TODO(D6): confirm wording
  { min: 0,  verdict: 'Below threshold' },   // TODO(D6): confirm wording
]

/**
 * Bhakoot dosha exceptions (e.g. same rashi-group or certain lord relationships).
 * TODO(D6): Enumerate approved exceptions.
 */
export const BHAKOOT_EXCEPTIONS: string[] = [] // TODO(D6)

/**
 * Nadi dosha exceptions (e.g. same nakshatra but different pada).
 * TODO(D6): Enumerate approved exceptions.
 */
export const NADI_EXCEPTIONS: string[] = [] // TODO(D6)

/**
 * Whether Graha Maitri uses lord friendship tables or Moon-sign lords.
 * TODO(D6): Confirm with Maithil pandit.
 */
export const GRAHA_MAITRI_METHOD: 'lord-friendship' | 'moon-sign-lords' = 'lord-friendship' // TODO(D6)

// ─── D7: Share / persistence policy ──────────────────────────────────────────

/**
 * Whether a shared Kundli result includes raw birth details (dob, birthTime,
 * birthPlace) or only computed output (chart positions, scores, verdict).
 *
 * Recommendation: computed output only, to minimise exposure of sensitive data.
 * TODO(D7): Confirm with legal/product before implementing sharing (Phase 6+).
 */
export const SHARE_INCLUDES_BIRTH_DETAILS = false // TODO(D7): confirm

/**
 * Default expiry for a shared result link (days).
 * TODO(D7): Confirm.
 */
export const SHARE_DEFAULT_EXPIRY_DAYS: number | null = null // TODO(D7)

// ─── D8: Disclaimer ───────────────────────────────────────────────────────────

/**
 * Legal disclaimer text.
 *
 * Must appear on every tool result page before the tool goes live.
 * TODO(D8): Legal/editorial review required before Phase 5.
 *
 * Placeholder wording — do not publish without review:
 */
export const DISCLAIMER =
  'These results are provided as traditional astrological guidance only. ' +
  'They are not a guarantee of compatibility or a prediction of marital outcomes. ' +
  'Mithila Jodi recommends that families make matrimonial decisions based on their ' +
  'own judgement, family discussions, and cultural traditions.'
// TODO(D8): Replace with reviewed and approved wording before Phase 5.

// ─── D9: Language ─────────────────────────────────────────────────────────────

/**
 * Phase 1–4: English only.
 *
 * community_masters.label_hi and label_mai are NULL today for rashi and nakshatra.
 * Hindi/Maithili labels must be seeded in the DB before multi-language output
 * is possible.
 *
 * TODO(D9): Seed label_hi/label_mai for rashi (12 rows) and nakshatra (27 rows)
 * in community_masters before enabling multi-language output.
 */
export const SUPPORTED_LANGUAGES = ['en'] as const
