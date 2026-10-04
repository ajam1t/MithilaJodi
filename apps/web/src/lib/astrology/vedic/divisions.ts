/**
 * Navamsa (D9) and planetary dignity. Pure; client-safe.
 */
import { relation } from '../rules/tables'
import { RASHIS, normalizeDeg, type GrahaId } from './zodiac'
import type { Dignity } from '../types'

/**
 * Navamsa sign: each rashi is split into nine 3°20′ parts, and the 108 parts
 * of the zodiac run through the twelve signs in order starting from Mesha.
 * This is the classical rule (movable signs start from themselves, fixed from
 * the 9th, dual from the 5th) expressed as one formula.
 */
export function navamsaRashiIndex(lon: number): number {
  return Math.floor((normalizeDeg(lon) * 9) / 30 + 1e-9) % 12
}

const EXALTATION: Partial<Record<GrahaId, number>> = { sun: 0, moon: 1, mars: 9, mercury: 5, jupiter: 3, venus: 11, saturn: 6 }

/**
 * Classical dignity by sign: exalted and debilitated (exaltation sign and its
 * opposite) take precedence, then own sign, then the natural relationship of
 * the planet to the sign's lord. Rahu and Ketu have no agreed dignities.
 */
export function dignityOf(id: GrahaId, rashiIndex: number): Dignity | null {
  const exalt = EXALTATION[id]
  if (exalt == null) return null
  if (rashiIndex === exalt) return 'exalted'
  if (rashiIndex === (exalt + 6) % 12) return 'debilitated'
  const lord = RASHIS[rashiIndex].lord
  if (lord === id) return 'own'
  const r = relation(id, lord)
  return r === 'friend' ? 'friendly' : r === 'enemy' ? 'enemy' : 'neutral'
}

export const DIGNITY_LABEL: Record<Dignity, string> = {
  exalted: 'Exalted', debilitated: 'Debilitated', own: 'Own sign', friendly: 'Friendly sign', neutral: 'Neutral sign', enemy: 'Enemy sign',
}
