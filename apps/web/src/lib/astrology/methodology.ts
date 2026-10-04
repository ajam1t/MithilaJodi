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
// 1.4.0 — Manglik tool: Venus-based count and Mars dignity shown as context only.
// 1.5.0 — Baby Names: rashi letters and the name first-sound check.
// 1.6.0 — Compatibility: Lagna, 7th lord, Navamsa, cross-chart placements and aspects.
// 1.7.0 — Vivah Muhurat: panchang shuddhi, solar and lunar months, asta, Gandanta, bal.
// None changes any earlier output.
export const METHODOLOGY_VERSION = '1.7.0'

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
    contextOnly:
      'Some traditions also count Mars from Venus, and many weigh Mars’s strength (exalted, own sign, debilitated). ' +
      'The Manglik tool shows both for transparency, but neither changes the status, which uses the Lagna and the Moon only.',
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

  babyNames: {
    syllable:
      'The first syllable is the one for the pada of the child’s Janma nakshatra (Avakahada Chakra). Without a birth ' +
      'time, every pada the Moon crossed in the possible part of the day is listed.',
    rashiLetters:
      'Rashi letters are the syllables of the nine nakshatra padas that make up the Moon’s rashi — the wider set many ' +
      'families also accept.',
    nameCheck:
      'The name check compares first sounds only. Long and short vowels count as the same (हि/ही, Hi/Hee), a syllable ' +
      'ending in “a” matches the consonant with its inherent vowel (ला matches लक्ष्मी), and Roman spellings are ' +
      'normalised (aa→a, ee→i, oo→u, w→v). No names are generated.',
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

  compatibility: {
    basis:
      'The Ashtakoota and Manglik results are exactly those of Kundli Match. The factors below are shown beside them ' +
      'and are never combined into a score.',
    signRelation:
      'Two signs are described by how far each is from the other, counted inclusively (same, 2/12, 3/11, 4/10, 5/9, ' +
      '6/8, 7/7) — the same counting as Bhakoot — together with the natural friendship of their lords.',
    seventhLord:
      'The 7th house (whole-sign) is the house of marriage; its lord is the lord of the 7th sign from the Lagna. Its ' +
      'house is grouped as kendra (1, 4, 7, 10), trikona (1, 5, 9), dusthana (6, 8, 12) or upachaya (3, 6, 10, 11). ' +
      'Needs the birth time.',
    navamsa:
      'Navamsa (D9) Lagna, Moon and Venus of each person, by the Janam Kundli rule. The D9 Moon is shown only when the ' +
      'Moon’s pada is certain.',
    cross:
      'Where each person’s Moon, Venus and Jupiter fall in the other’s chart, counted from the other’s Lagna (whole-sign).',
    aspects:
      'Whole-sign graha drishti of each person’s Jupiter and Venus (benefic) and Saturn and Mars (malefic) onto the ' +
      'other’s Moon, Lagna and 7th house. All aspect the 7th sign; Mars also the 4th and 8th, Jupiter the 5th and 9th, ' +
      'Saturn the 3rd and 10th. The same sign is a conjunction. Rahu and Ketu aspects are disputed and not used.',
  },

  vivahMuhurat: {
    source:
      'The marriage rules of Muhurta Chintamani as applied by published North Indian panchangs. A muhurat is every ' +
      'stretch of time, for the chosen place, in which all of the conditions below hold at once.',
    nakshatra:
      'The Moon in Rohini, Mrigashira, Magha, Uttara Phalguni, Hasta, Swati, Anuradha, Mula, Uttara Ashadha, Uttara ' +
      'Bhadrapada or Revati — and not in Gandanta: the last pada of Revati (and of Ashlesha and Jyeshtha) or the first ' +
      'pada of Magha and Mula (and of Ashwini), measured in arc.',
    tithi:
      'Amavasya is excluded (its karanas always are). Rikta tithis — Chaturthi, Navami, Chaturdashi — are avoided by ' +
      'most pandits and hidden by default; some panchangs list them at lower priority, so they can be shown, marked.',
    yoga: 'Not Vishkumbha, Atiganda, Shula, Ganda, Vyaghata, Vyatipata or Vaidhriti (the whole yoga).',
    karana: 'Not Vishti (Bhadra), Shakuni, Chatushpada or Naga.',
    solarMonth:
      'The Sun in Mesha, Vrishabha, Mithuna, Vrishchika, Makara or Kumbha (sidereal), from the exact moment of ' +
      'sankranti. Dhanu and Meena are Kharmas; Karka to Tula are closed.',
    lunarMonth:
      'Amanta months, each named by the sankranti it contains; a month without one is Adhika and is excluded (as is a ' +
      'Kshaya month). Chaturmas — Devshayani Ekadashi (Ashadha Shukla 11) to Prabodhini Ekadashi (Kartika Shukla 11) — ' +
      'and Holashtak (Phalguna Shukla 8 to Purnima) are excluded, judged by the tithi at sunrise as observances are.',
    asta:
      'No marriages while Jupiter or Venus is set (asta): within 11° of the Sun for Jupiter, 10° for Venus (8° when ' +
      'retrograde), checked at each day’s sunrise.',
    day:
      'Each Vedic day runs from local sunrise to the next sunrise, so a window after midnight belongs to the previous ' +
      'date. Times are rounded to the nearest minute; windows shorter than 10 minutes are left out. Monday, Wednesday, ' +
      'Thursday and Friday are marked as preferred but no weekday is excluded.',
    bal:
      'With Moon signs given: Guru bal for the bride (Jupiter in the 2nd, 5th, 7th, 9th or 11th from her Moon sign is ' +
      'shubh; 1st, 3rd, 6th, 10th pujya — worship advised; 4th, 8th, 12th ashubh), Surya bal for the groom (Sun in the ' +
      '3rd, 6th, 10th, 11th shubh; 1st, 2nd, 5th, 7th, 9th pujya; 4th, 8th, 12th ashubh) and Chandra bal for both (the ' +
      'Moon in the 4th, 8th or 12th is weak). Shown beside each date; they never remove one.',
    notApplied:
      'Not applied: the Lagna and Navamsa of the ceremony itself, which the officiating pandit fixes within the window; ' +
      'Simhastha Guru; and finer doshas (Lattadi, Ekargala, Upagraha and the like).',
    validation:
      'For Diu, November–December 2026, every window matches Drik Panchang’s published list to within one minute ' +
      '(the same nutation-convention difference noted below), except that Drik ends the 21 November window five minutes ' +
      'earlier, at Revati’s Gandanta.',
    disclaimer:
      'A muhurat is a traditional choice of an auspicious time. The panchang here is calculated astronomically; the ' +
      'rules are tradition, not science. Please confirm the final date and Lagna with the family pandit.',
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
