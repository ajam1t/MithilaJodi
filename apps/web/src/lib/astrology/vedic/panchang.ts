/**
 * Panchang at the moment of birth: tithi, yoga, karana and vara.
 * Pure functions of the Sun and Moon longitudes, plus the local sunrise for
 * the vara (the Vedic day runs sunrise to sunrise). Client-safe.
 */
import { normalizeDeg, type GrahaId } from './zodiac'
import type { BirthPanchang } from '../types'

const TITHI = [
  'Pratipada', 'Dwitiya', 'Tritiya', 'Chaturthi', 'Panchami', 'Shashthi', 'Saptami', 'Ashtami',
  'Navami', 'Dashami', 'Ekadashi', 'Dwadashi', 'Trayodashi', 'Chaturdashi',
]

const YOGA = [
  'Vishkumbha', 'Priti', 'Ayushman', 'Saubhagya', 'Shobhana', 'Atiganda', 'Sukarma', 'Dhriti', 'Shula',
  'Ganda', 'Vriddhi', 'Dhruva', 'Vyaghata', 'Harshana', 'Vajra', 'Siddhi', 'Vyatipata', 'Variyana',
  'Parigha', 'Shiva', 'Siddha', 'Sadhya', 'Shubha', 'Shukla', 'Brahma', 'Indra', 'Vaidhriti',
]

const MOVABLE_KARANA = ['Bava', 'Balava', 'Kaulava', 'Taitila', 'Gara', 'Vanija', 'Vishti']

export const VARA: ReadonlyArray<{ name: string; lord: GrahaId }> = [
  { name: 'Ravivara (Sunday)', lord: 'sun' },
  { name: 'Somavara (Monday)', lord: 'moon' },
  { name: 'Mangalavara (Tuesday)', lord: 'mars' },
  { name: 'Budhavara (Wednesday)', lord: 'mercury' },
  { name: 'Guruvara (Thursday)', lord: 'jupiter' },
  { name: 'Shukravara (Friday)', lord: 'venus' },
  { name: 'Shanivara (Saturday)', lord: 'saturn' },
]

/** 1–30: 1–15 Shukla Pratipada…Purnima, 16–30 Krishna Pratipada…Amavasya. */
export function tithiOf(sunLon: number, moonLon: number): BirthPanchang['tithi'] {
  const n = Math.floor(normalizeDeg(moonLon - sunLon) / 12 + 1e-9) + 1
  const paksha = n <= 15 ? 'shukla' : 'krishna'
  const within = ((n - 1) % 15) + 1
  const name = within === 15 ? (paksha === 'shukla' ? 'Purnima' : 'Amavasya') : TITHI[within - 1]
  return { number: n, name: `${paksha === 'shukla' ? 'Shukla' : 'Krishna'} ${name}`, paksha }
}

/** Uses sidereal longitudes: the yoga is the sum of the nirayana Sun and Moon. */
export function yogaOf(siderealSun: number, siderealMoon: number): BirthPanchang['yoga'] {
  const n = Math.floor((normalizeDeg(siderealSun + siderealMoon) * 27) / 360 + 1e-9) + 1
  return { number: n, name: YOGA[n - 1] }
}

/** Half-tithis: four fixed karanas at the ends of the lunar month, seven movable ones repeating between. */
export function karanaOf(sunLon: number, moonLon: number): BirthPanchang['karana'] {
  const k = Math.floor(normalizeDeg(moonLon - sunLon) / 6 + 1e-9)
  if (k === 0) return { name: 'Kimstughna' }
  if (k === 57) return { name: 'Shakuni' }
  if (k === 58) return { name: 'Chatushpada' }
  if (k === 59) return { name: 'Naga' }
  return { name: MOVABLE_KARANA[(k - 1) % 7] }
}

/**
 * Vara of the Vedic day. A birth before that date's local sunrise belongs to
 * the previous day's vara. `civilWeekday` is 0 = Sunday for the local date.
 */
export function varaOf(civilWeekday: number, beforeSunrise: boolean): BirthPanchang['vara'] {
  const v = VARA[(civilWeekday + (beforeSunrise ? 6 : 0)) % 7]
  return { name: v.name, lord: v.lord, beforeSunrise }
}
