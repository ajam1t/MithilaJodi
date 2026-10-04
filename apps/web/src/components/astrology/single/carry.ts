'use client'

import type { PersonInput, Role } from '@/lib/astrology/types'
import { PREFILL_KEY } from '../kundli/BirthDetailsCard'
import { SINGLE_PREFILL_KEY } from './SingleChartExperience'

export type CarryTarget = 'janam' | 'nakshatra' | 'rashi' | Role

const DESTINATION: Record<CarryTarget, string> = {
  janam: '/astrology/janam-kundli#janam-form',
  nakshatra: '/astrology/nakshatra#nakshatra-form',
  rashi: '/astrology/rashi#rashi-form',
  bride: '/astrology/kundli-match#kundli-form',
  groom: '/astrology/kundli-match#kundli-form',
}

/**
 * Open another astrology tool with this person's details filled in. The
 * details travel in sessionStorage within the tab only and are read once.
 */
const toDraft = (person: PersonInput) => ({
  name: person.name, dateOfBirth: person.dateOfBirth, timeOfBirth: person.timeOfBirth ?? '', timeUnknown: person.timeOfBirth == null, place: person.place,
})

export function carryTo(to: CarryTarget, person: PersonInput) {
  const draft = toDraft(person)
  try {
    if (to === 'bride' || to === 'groom') sessionStorage.setItem(PREFILL_KEY, JSON.stringify({ role: to, draft }))
    else sessionStorage.setItem(SINGLE_PREFILL_KEY, JSON.stringify(draft))
  } catch { /* storage unavailable — the next form simply starts empty */ }
  window.location.assign(DESTINATION[to])
}

const PAIR_DESTINATION = {
  'kundli-match': '/astrology/kundli-match#kundli-form',
  compatibility: '/astrology/compatibility#compatibility-form',
} as const

/** Open a two-person tool with both people's details filled in. */
export function carryPair(to: keyof typeof PAIR_DESTINATION, pair: Record<Role, PersonInput>) {
  try {
    sessionStorage.setItem(PREFILL_KEY, JSON.stringify({ pair: { bride: toDraft(pair.bride), groom: toDraft(pair.groom) } }))
  } catch { /* storage unavailable — the next form simply starts empty */ }
  window.location.assign(PAIR_DESTINATION[to])
}
