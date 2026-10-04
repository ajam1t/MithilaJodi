/**
 * Manglik (Kuja) dosha — Mars counted from the Lagna and from the Moon.
 * Pure: consumes chart data, never the ephemeris. Rules in methodology.ts.
 */
import { METHODOLOGY } from '../methodology'
import { RASHIS, formatDegree } from '../vedic/zodiac'
import type { LagnaPosition, ManglikAnalysis, ManglikPerson, MoonProfile, PlanetPosition, Role } from '../types'

const DOSHA_HOUSES: readonly number[] = METHODOLOGY.manglik.houses

export function ordinal(n: number): string {
  const s = ['th', 'st', 'nd', 'rd']
  const v = n % 100
  return `${n}${s[(v - 20) % 10] || s[v] || s[0]}`
}

const LABEL: Record<ManglikPerson['status'], string> = {
  yes: 'Manglik',
  anshik: 'Anshik Manglik (partial)',
  no: 'Not Manglik',
  incomplete: 'Incomplete — needs birth time',
}

export function manglikFor(planets: PlanetPosition[], lagna: LagnaPosition | null, moon: MoonProfile): ManglikPerson {
  const mars = planets.find(p => p.id === 'mars')!
  const fromMoon = DOSHA_HOUSES.includes(mars.houseFromMoon)
  const fromLagna = lagna && mars.house != null ? DOSHA_HOUSES.includes(mars.house) : null

  const status: ManglikPerson['status'] =
    fromLagna == null ? 'incomplete' : fromLagna && fromMoon ? 'yes' : fromLagna || fromMoon ? 'anshik' : 'no'

  const exceptions: string[] = []
  if (fromLagna || fromMoon) {
    if (mars.rashi === 'mesh' || mars.rashi === 'vrishchik') {
      exceptions.push(`Mars is in its own sign (${RASHIS[mars.rashiIndex].name}); many texts treat this as reducing or cancelling the dosha.`)
    }
    if (mars.rashi === 'makar') {
      exceptions.push('Mars is exalted in Makara; many texts treat this as reducing or cancelling the dosha.')
    }
  }

  const where = `Mars is in ${RASHIS[mars.rashiIndex].name} at ${formatDegree(mars.degreeInRashi)}.`
  const houseList = DOSHA_HOUSES.join(', ')
  const moonPart =
    `Counted from the Moon (${RASHIS[moon.rashiIndex].name}) it is in the ${ordinal(mars.houseFromMoon)} house` +
    (fromMoon ? `, one of the Manglik houses (${houseList}).` : ', which is not a Manglik house.')

  let explanation: string
  if (lagna && mars.house != null) {
    const lagnaPart =
      `Counted from the Lagna (${RASHIS[lagna.rashiIndex].name}) it is in the ${ordinal(mars.house)} house` +
      (fromLagna ? `, one of the Manglik houses (${houseList}).` : ', which is not a Manglik house.')
    const verdict =
      status === 'yes'
        ? 'Both checks place Mars in a Manglik house, so the chart is Manglik.'
        : status === 'anshik'
          ? 'Only one of the two checks places Mars in a Manglik house, so the chart is Anshik (partially) Manglik.'
          : 'Neither check places Mars in a Manglik house, so the chart is not Manglik.'
    explanation = `${where} ${lagnaPart} ${moonPart} ${verdict}`
  } else {
    explanation =
      `${where} ${moonPart} Without a birth time the Lagna cannot be calculated, so the Lagna-based check — the one ` +
      `most families rely on — is not possible. ` +
      (fromMoon
        ? 'By the Moon-based check alone the chart is at least Anshik (partially) Manglik.'
        : 'The Moon-based check alone does not show Manglik dosha.')
  }

  return {
    status,
    masterValue: status === 'incomplete' ? 'unknown' : status,
    label: LABEL[status],
    marsRashi: mars.rashi,
    marsDegreeInRashi: mars.degreeInRashi,
    marsHouseFromLagna: mars.house,
    marsHouseFromMoon: mars.houseFromMoon,
    fromLagna,
    fromMoon,
    exceptions,
    explanation,
  }
}

const hasInfluence = (p: ManglikPerson) => p.status === 'yes' || p.status === 'anshik'

export function manglikPair(bride: ManglikPerson, groom: ManglikPerson): ManglikAnalysis['pair'] {
  const name: Record<Role, string> = { bride: 'the bride', groom: 'the groom' }
  if (hasInfluence(bride) && hasInfluence(groom)) {
    return {
      code: 'both',
      summary:
        'Both charts carry Manglik influence. Traditionally, two Manglik charts are considered to balance each other ' +
        '(mutual cancellation), which is why many families look for exactly this pairing.',
    }
  }
  if (bride.status === 'incomplete' || groom.status === 'incomplete') {
    return {
      code: 'incomplete',
      summary:
        'The Manglik comparison is incomplete because at least one birth time is unknown. The Moon-based checks are ' +
        'shown below; a pandit would normally want the birth time before drawing a conclusion.',
    }
  }
  if (hasInfluence(bride) || hasInfluence(groom)) {
    const who: Role = hasInfluence(bride) ? 'bride' : 'groom'
    const p = who === 'bride' ? bride : groom
    return {
      code: 'one',
      summary:
        `Only ${name[who]}'s chart carries Manglik influence (${p.label}). Traditionally this is a point families ` +
        'discuss with their pandit, who will weigh the cancellations and the strength of Mars in each chart. It is ' +
        'not, on its own, a verdict on the marriage.',
    }
  }
  return { code: 'neither', summary: 'Neither chart is Manglik by this method, so Manglik dosha is not a consideration for this pair.' }
}
