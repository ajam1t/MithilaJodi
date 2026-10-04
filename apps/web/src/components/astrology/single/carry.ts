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
export function carryTo(to: CarryTarget, person: PersonInput) {
  const draft = { name: person.name, dateOfBirth: person.dateOfBirth, timeOfBirth: person.timeOfBirth ?? '', timeUnknown: person.timeOfBirth == null, place: person.place }
  try {
    if (to === 'bride' || to === 'groom') sessionStorage.setItem(PREFILL_KEY, JSON.stringify({ role: to, draft }))
    else sessionStorage.setItem(SINGLE_PREFILL_KEY, JSON.stringify(draft))
  } catch { /* storage unavailable — the next form simply starts empty */ }
  window.location.assign(DESTINATION[to])
}
