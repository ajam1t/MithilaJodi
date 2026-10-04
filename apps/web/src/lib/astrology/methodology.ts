/**
 * Mithila Jodi Astrology Methodology — the single, frozen statement of every
 * choice the engine makes. Nothing here computes; the engine reads it.
 *
 * Bump `version` whenever any rule, table or astronomical choice changes in a
 * way that could alter an output. Every result and every shared link records
 * the version that produced it, so an old result is never silently
 * reinterpreted under new rules.
 *
 * Client-safe: no astronomy imports.
 */

// 1.1.0 — adds the Janam Kundli rules (navamsa, dignity, dasha, panchang).
// 1.2.0 — adds the Nakshatra rules (window, syllables, navatara).
// 1.3.0 — adds the Rashi rules (Western sign comparison, Moon-sign compatibility).
// None changes any earlier output.
export const METHODOLOGY_VERSION = '1.3.0'

export const METHODOLOGY = {
  version: METHODOLOGY_VERSION,
  name: 'Mithila Jodi Astrology Methodology',

  zodiac: 'Sidereal (Nirayana)',

  ayanamsha: {
    name: 'Lahiri (Chitrapaksha)',
    // Calendar Reform Committee value for 21 March 1956 00:00 TT (JD 2435553.5)
    // is 23°15′00.658″ including nutation; less that date's nutation in
    // longitude (16.777″) it is the mean value below — the same anchor Swiss
    // Ephemeris uses for SE_SIDM_LAHIRI. Carried to any other date with the
    // IAU 2006 general precession in longitude (Capitaine et al. 2003).
    epochJdTT: 2435553.5,
    valueAtEpochDeg: 23.245522556,
    precessionModel: 'IAU 2006 general precession in longitude (p_A)',
    note:
      'The mean ayanamsha is subtracted from longitudes referred to the mean equinox of date, ' +
      'so nutation cancels exactly as in standard Indian practice.',
  },

  ephemeris: {
    library: 'astronomy-engine',
    libraryVersion: '2.1.19',
    licence: 'MIT',
    planets: 'VSOP87-based heliocentric theory, light-time and aberration corrected (apparent geocentric)',
    moon: 'Improved Lunar Ephemeris (Brown / Montenbruck–Pfleger), geocentric',
    statedAccuracy: 'within ±1 arcminute of NASA JPL Horizons for 1900–2100 (library documentation)',
    whyNotSwissEphemeris:
      'Swiss Ephemeris is dual-licensed AGPL-3.0 / paid commercial. AGPL would oblige the entire ' +
      'hosted site to publish its source; the commercial licence is a separate legal decision. Its ' +
      'native C build is also unreliable on Vercel serverless. astronomy-engine is MIT-licensed, pure ' +
      'JavaScript, and accurate far beyond what rashi, nakshatra and pada boundaries require.',
  },

  nodes: 'Mean lunar node (Rahu); Ketu exactly opposite. Meeus, Astronomical Algorithms ch. 47.',
  houses: 'Whole-sign (the Lagna rashi is the 1st house; each following rashi is the next house)',
  chartStyle: 'North Indian (diamond), houses fixed, rashi numbers rotate with the Lagna',
  timezones:
    'IANA time-zone database through the runtime Intl API, including historical offsets and ' +
    'daylight-saving periods (e.g. Indian war time +06:30 in 1942–45). The browser time zone is never used.',
  lagna:
    'Ascendant from Greenwich apparent sidereal time, the birthplace longitude and latitude, and the ' +
    'true obliquity of the ecliptic. Not computed when the birth time is unknown.',

  ashtakoota: {
    basis: "Moon (Janma) rashi and nakshatra of each person. Roles matter: bride's and groom's values are not interchangeable.",
    kootas: {
      varna: 'Rashi → Varna (Brahmin: Kark, Vrishchik, Meen · Kshatriya: Mesh, Simha, Dhanu · Vaishya: Vrishabh, Kanya, Makar · Shudra: Mithun, Tula, Kumbh). 1 point if the groom’s Varna is equal to or higher than the bride’s.',
      vashya: 'Rashi → Vashya group (Chatushpada, Manava, Jalachara, Vanachara, Keeta); Dhanu and Makar split at 15°. Scored with the groom × bride matrix in rules/tables.ts.',
      tara: 'Count nakshatras from the bride’s to the groom’s and back (inclusive), reduced modulo 9. Taras 3 (Vipat), 5 (Pratyari) and 7 (Vadha) are inauspicious. 1½ points for each direction that is auspicious.',
      yoni: 'Nakshatra → one of 14 Yoni animals; scored with the standard symmetric 14×14 matrix (same Yoni 4, sworn enemies 0).',
      grahaMaitri: 'Natural (Parashari) friendship between the two Moon-rashi lords: friend/friend 5, friend/neutral 4, neutral/neutral 3, friend/enemy 1, neutral/enemy ½, enemy/enemy 0. Same lord 5.',
      gana: 'Nakshatra → Deva, Manushya or Rakshasa; scored with the groom × bride matrix.',
      bhakoot: 'Relative position of the two Moon rashis. 2/12, 5/9 and 6/8 are Bhakoot dosha (0); every other relationship scores 7.',
      nadi: 'Nakshatra → Adi, Madhya or Antya Nadi. Same Nadi is Nadi dosha (0); different Nadi scores 8.',
    },
    cancellations:
      'Koota scores are never altered by cancellation (parihara) rules. Where a classical text recognises a ' +
      'cancellation for Bhakoot or Nadi dosha, the result names it beside the score so families can weigh it ' +
      'with their own pandit.',
  },

  manglik: {
    houses: [1, 2, 4, 7, 8, 12] as const,
    reckonedFrom: 'Lagna and the Moon',
    status:
      'Manglik — Mars in one of these houses from both the Lagna and the Moon. Anshik (partial) — from only ' +
      'one of the two. Not Manglik — from neither. With an unknown birth time only the Moon-based check is ' +
      'possible, so the status is reported as incomplete rather than guessed.',
    notedExceptions:
      'Reported, never applied automatically: Mars in its own sign (Mesh, Vrishchik), Mars exalted (Makar), ' +
      'and both partners being Manglik (mutual balance).',
    houseVariantNote: 'Some North Indian authorities omit the 2nd house; Mithila Jodi includes it, as most published calculators do.',
  },

  janamKundli: {
    navamsa:
      'Navamsa (D9): each rashi is divided into nine parts of 3°20′, and the 108 parts run through the twelve signs ' +
      'in order from Mesha — the classical rule (movable signs start from themselves, fixed from the 9th, dual from ' +
      'the 5th) written as one formula. A planet in the same sign in the Rashi and Navamsa charts is Vargottama.',
    dignity:
      'Exaltation: Sun in Mesha, Moon in Vrishabha, Mars in Makara, Mercury in Kanya, Jupiter in Karka, Venus in ' +
      'Meena, Saturn in Tula; debilitation in the opposite sign. Otherwise own sign, then the natural (Parashari) ' +
      'friendship of the planet with the sign’s lord. Rahu and Ketu are not given a dignity, as traditions disagree.',
    dasha:
      'Vimshottari: the Mahadasha at birth is ruled by the lord of the Moon’s nakshatra, and its unexpired balance is ' +
      'proportional to the part of the nakshatra the Moon has still to cross. Periods: Ketu 7, Venus 20, Sun 6, Moon ' +
      '10, Mars 7, Rahu 18, Jupiter 16, Saturn 19, Mercury 17 years (120 in all); Antardashas are proportional. ' +
      'Years are 365.25 days. Not calculated when the birth time is unknown.',
    panchang:
      'Tithi from the Moon’s elongation from the Sun (12° each), yoga from the sum of the sidereal Sun and Moon ' +
      '(13°20′ each), karana from half-tithis. The vara runs sunrise to sunrise: a birth before local sunrise belongs ' +
      'to the previous weekday. Sunrise is when the Sun’s upper limb clears the horizon, with standard refraction.',
    disclaimer:
      'A Janam Kundli is a traditional reading of the sky at the moment of birth. The positions here are calculated ' +
      'astronomically; what they mean is a matter of tradition, not science. Nothing in it predicts events, and it ' +
      'should not be relied on for medical, financial or other important decisions.',
  },

  nakshatra: {
    janma:
      'The Janma nakshatra is the one of the 27 equal 13°20′ divisions of the sidereal zodiac (from 0° Mesha) that ' +
      'holds the Moon at birth; the pada is the quarter (3°20′) of it.',
    window:
      'The start and end of the nakshatra are the instants the Moon’s sidereal longitude crosses its boundaries, found ' +
      'from the ephemeris to the second — the same moments a panchang prints.',
    syllables:
      'Name syllables follow the Avakahada Chakra as commonly printed in North Indian panchangs (one per pada). ' +
      'Regional lists differ in a few places.',
    navatara:
      'Navatara counts the nakshatras from the Janma nakshatra in nine taras of three: Janma, Sampat, Vipat, Kshema, ' +
      'Pratyari, Sadhaka, Vadha, Mitra, Ati-Mitra. Vipat, Pratyari and Vadha are the unfavourable ones.',
  },

  rashi: {
    janma:
      'The Janma rashi is the sidereal sign (one of twelve 30° signs from 0° Mesha) holding the Moon at birth; its ' +
      'start and end are the instants the Moon crosses the sign’s edges, found from the ephemeris to the second.',
    western:
      'The Western (tropical) Sun sign is the Sun’s sidereal position plus the Lahiri ayanamsha — about 24° today — ' +
      'which is why it is usually one sign later than the Vedic Sun sign.',
    compatibility:
      'The Moon-sign table uses the two kootas that depend only on the Moon signs, Bhakoot (7) and Graha Maitri (5), ' +
      'with exactly the Kundli Match rules. It is a partial reading: the other six kootas need both nakshatras.',
    attributes:
      'Element (Agni, Prithvi, Vayu, Jala) and quality (Chara, Sthira, Dvisvabhava) follow the sign order from Mesha.',
  },

  scoreBands: [
    { min: 0, max: 17, key: 'challenging', label: 'Traditionally considered challenging' },
    { min: 18, max: 23, key: 'moderate', label: 'Moderate — meets the traditional minimum' },
    { min: 24, max: 31, key: 'good', label: 'Good compatibility' },
    { min: 32, max: 36, key: 'very-strong', label: 'Very strong compatibility' },
  ] as const,

  review:
    'These tables follow the North Indian Ashtakoota convention as published in widely used Indian ' +
    'panchang software. They have not yet been signed off by a Maithil pandit; where a family pandit ' +
    'follows a different table, their reading should take precedence.',

  disclaimer:
    'Kundli matching is a traditional practice. These results describe what the selected Ashtakoota ' +
    'methodology says about two birth charts; they are not a scientific measure, and they do not predict ' +
    'or guarantee the success of a marriage. Please use them as one input among many, alongside family ' +
    'discussion and your own judgement.',
} as const

export type ScoreBand = (typeof METHODOLOGY.scoreBands)[number]

export function scoreBandFor(total: number): ScoreBand {
  const rounded = Math.floor(total)
  return METHODOLOGY.scoreBands.find(b => rounded >= b.min && rounded <= b.max) ?? METHODOLOGY.scoreBands[0]
}
