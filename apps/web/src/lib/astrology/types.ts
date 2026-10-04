/**
 * The contract between the astrology engine and everything that consumes it —
 * the API route, the cinematic reveal, the result report, the print/PDF view
 * and the share page. Client-safe: types only.
 */
import type { GrahaId, NakshatraSlug, RashiSlug } from './vedic/zodiac'
import type { Gana, Nadi, Varna, Vashya, Yoni } from './rules/tables'

export type Role = 'bride' | 'groom'
/** Whose chart: one side of a match, or a single person (Janam Kundli). */
export type Subject = Role | 'native'

export type PlaceSource = 'mithila-jodi' | 'openstreetmap' | 'manual'

export type BirthPlace = {
  label: string
  latitude: number
  longitude: number
  /** IANA zone, e.g. 'Asia/Kolkata'. */
  timezone: string
  source: PlaceSource
}

export type PersonInput = {
  name: string
  /** 'YYYY-MM-DD' local calendar date at the birthplace. */
  dateOfBirth: string
  /** 'HH:MM' 24-hour local time, or null when unknown. */
  timeOfBirth: string | null
  place: BirthPlace
  /**
   * Only meaningful when the time is unknown and the Moon changed rashi or
   * nakshatra during that day: which part of the day the birth fell in, or
   * 'all' to see every possibility.
   */
  moonSegment?: number | 'all'
  /** Only meaningful when the local time occurred twice (clocks went back). */
  repeatedTime?: 'earlier' | 'later'
}

export type KundliMatchRequest = { bride: PersonInput; groom: PersonInput }

export type PlanetPosition = {
  id: GrahaId
  /** Sidereal longitude 0–360°. */
  longitude: number
  rashi: RashiSlug
  rashiIndex: number
  degreeInRashi: number
  nakshatra: NakshatraSlug
  nakshatraIndex: number
  pada: 1 | 2 | 3 | 4
  /** Whole-sign house from the Lagna; null when the birth time is unknown. */
  house: number | null
  /** Whole-sign house counted from the Moon's rashi (Chandra Lagna). */
  houseFromMoon: number
  retrograde: boolean
  /** Degrees per day. */
  speed: number
}

export type LagnaPosition = {
  longitude: number
  rashi: RashiSlug
  rashiIndex: number
  degreeInRashi: number
  nakshatra: NakshatraSlug
  pada: 1 | 2 | 3 | 4
}

export type MoonProfile = {
  longitude: number
  rashi: RashiSlug
  rashiIndex: number
  rashiLord: GrahaId
  degreeInRashi: number
  nakshatra: NakshatraSlug
  nakshatraIndex: number
  nakshatraLord: GrahaId
  /** null when the birth time is unknown and the pada changes within the possible window. */
  pada: 1 | 2 | 3 | 4 | null
  varna: Varna
  vashya: Vashya
  yoni: Yoni
  gana: Gana
  nadi: Nadi
  /** Possible Moon range when the birth time is unknown. */
  range?: { fromLongitude: number; toLongitude: number }
}

export type MoonSegmentChoice = {
  index: number
  /** Local wall-clock times bounding this part of the day, 'HH:MM'. */
  fromLocal: string
  toLocal: string
  rashi: RashiSlug
  nakshatra: NakshatraSlug
  vashya: Vashya
}

export type ChartData = {
  role: Subject
  name: string
  birth: {
    localDate: string
    localTime: string | null
    timezone: string
    /** e.g. '+05:30'; for an unknown time, the offset in force on that date at noon. */
    utcOffset: string
    /** ISO UTC instant used for planets; for an unknown time, the midpoint of the chosen window. */
    calculatedAtUtc: string
    placeLabel: string
    latitude: number
    longitude: number
    placeSource: PlaceSource
  }
  timeKnown: boolean
  /** Present when the time is unknown: the part of the day these values assume. */
  moonWindow?: MoonSegmentChoice & { totalSegments: number }
  ayanamsha: number
  lagna: LagnaPosition | null
  planets: PlanetPosition[]
  moon: MoonProfile
  notes: string[]
}

export type KootaKey = 'varna' | 'vashya' | 'tara' | 'yoni' | 'grahaMaitri' | 'gana' | 'bhakoot' | 'nadi'

export type KootaResult = {
  key: KootaKey
  name: string
  maxScore: number
  score: number
  /** What the koota traditionally represents. */
  measures: string
  bride: string
  groom: string
  /** Why this score was awarded, in plain language with the underlying values. */
  explanation: string
  dosha?: {
    name: string
    /** Classical cancellation conditions that hold for this pair (reported, never applied). */
    cancellations: string[]
  }
}

export type ManglikStatus = 'yes' | 'no' | 'anshik' | 'incomplete'

export type ManglikPerson = {
  status: ManglikStatus
  /** The matching community_masters 'manglik' value. */
  masterValue: 'yes' | 'no' | 'anshik' | 'unknown'
  label: string
  marsRashi: RashiSlug
  marsDegreeInRashi: number
  marsHouseFromLagna: number | null
  marsHouseFromMoon: number
  fromLagna: boolean | null
  fromMoon: boolean
  /** Traditional exceptions that hold (reported, never applied automatically). */
  exceptions: string[]
  explanation: string
}

export type ManglikAnalysis = {
  bride: ManglikPerson
  groom: ManglikPerson
  pair: { code: 'neither' | 'both' | 'one' | 'incomplete'; summary: string }
}

export type MatchResult = {
  methodologyVersion: string
  engine: { ephemeris: string; ayanamsha: string; nodes: string; houses: string }
  computedAt: string
  bride: ChartData
  groom: ChartData
  kootas: KootaResult[]
  total: number
  maxTotal: 36
  band: { key: string; label: string; min: number; max: number }
  manglik: ManglikAnalysis
  insights: string[]
  warnings: string[]
}

export type KundliMatchResponse =
  | { kind: 'result'; result: MatchResult }
  | { kind: 'needs_moon_choice'; choices: Partial<Record<Role, MoonSegmentChoice[]>> }
  | {
      kind: 'scenarios'
      scenarios: Array<{ brideSegment: number | null; groomSegment: number | null; result: MatchResult }>
    }

// ─── Janam Kundli ────────────────────────────────────────────────────────────

export type Dignity = 'exalted' | 'debilitated' | 'own' | 'friendly' | 'neutral' | 'enemy'

export type DashaPeriod = {
  lord: GrahaId
  /** ISO UTC instants. The first Mahadasha starts before birth (the balance runs from birth). */
  start: string
  end: string
  years: number
  antardashas?: Array<{ lord: GrahaId; start: string; end: string }>
}

export type VimshottariDasha = {
  /** Mahadasha running at birth and how much of it was left. */
  balanceAtBirth: { lord: GrahaId; years: number; months: number; days: number }
  mahadashas: DashaPeriod[]
}

export type BirthPanchang = {
  tithi: { number: number; name: string; paksha: 'shukla' | 'krishna' }
  yoga: { number: number; name: string }
  karana: { name: string }
  vara: { name: string; lord: GrahaId; beforeSunrise: boolean }
  /** Local sunrise on the birth date at the birthplace, ISO UTC; null in polar day/night. */
  sunrise: string | null
}

export type SinglePersonRequest = { person: PersonInput }
export type JanamKundliRequest = SinglePersonRequest

export type JanamKundliResult = {
  methodologyVersion: string
  engine: MatchResult['engine']
  computedAt: string
  chart: ChartData
  navamsa: {
    lagnaRashiIndex: number | null
    /** rashiIndex is null only for a Moon whose navamsa is uncertain without a birth time. */
    planets: Array<{ id: GrahaId; rashiIndex: number | null; vargottama: boolean }>
  }
  /** null for Rahu and Ketu, whose dignities are disputed between traditions. */
  dignities: Array<{ id: GrahaId; dignity: Dignity | null }>
  /** Needs an exact Moon position, so null when the birth time is unknown. */
  dasha: VimshottariDasha | null
  /** Tithi, yoga, karana and vara change through the day, so null when the birth time is unknown. */
  panchang: BirthPanchang | null
  manglik: ManglikPerson
  warnings: string[]
}

export type JanamKundliResponse =
  | { kind: 'result'; result: JanamKundliResult }
  | { kind: 'needs_moon_choice'; choices: MoonSegmentChoice[] }
  | { kind: 'scenarios'; scenarios: Array<{ segment: number; result: JanamKundliResult }> }

// ─── Nakshatra ───────────────────────────────────────────────────────────────

export type NakshatraReading = {
  methodologyVersion: string
  computedAt: string
  chart: ChartData
  /** How far the Moon had travelled through its nakshatra, 0–1; null when the birth time is unknown. */
  progress: number | null
  /** When the Moon entered and left this nakshatra around the birth (ISO UTC). */
  window: { start: string; end: string }
  /** Navamsa sign of the Moon's pada; null when the pada is uncertain. */
  padaNavamsaIndex: number | null
  navatara: Array<{ tara: number; name: string; auspicious: boolean; nakshatras: NakshatraSlug[] }>
  warnings: string[]
}

export type NakshatraResponse =
  | { kind: 'result'; result: NakshatraReading }
  | { kind: 'needs_moon_choice'; choices: MoonSegmentChoice[] }
  | { kind: 'scenarios'; scenarios: Array<{ segment: number; result: NakshatraReading }> }

/** What a share link stores and shows — deliberately no dates, times, places or planet degrees. */
export type SharedMatchSummary = {
  methodologyVersion: string
  computedAt: string
  names: { bride: string | null; groom: string | null }
  total: number
  maxTotal: 36
  band: MatchResult['band']
  kootas: KootaResult[]
  moon: Record<Role, Pick<MoonProfile, 'rashi' | 'rashiLord' | 'nakshatra' | 'nakshatraLord' | 'varna' | 'vashya' | 'yoni' | 'gana' | 'nadi'>>
  manglik: {
    bride: Pick<ManglikPerson, 'status' | 'label' | 'marsRashi' | 'marsHouseFromLagna' | 'marsHouseFromMoon' | 'exceptions' | 'explanation'>
    groom: Pick<ManglikPerson, 'status' | 'label' | 'marsRashi' | 'marsHouseFromLagna' | 'marsHouseFromMoon' | 'exceptions' | 'explanation'>
    pair: ManglikAnalysis['pair']
  }
  insights: string[]
  timeKnown: Record<Role, boolean>
}
