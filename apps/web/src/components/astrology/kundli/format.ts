import { GRAHAS, NAKSHATRAS, RASHIS, type GrahaId, type NakshatraSlug, type RashiSlug } from '@/lib/astrology/vedic/zodiac'

export const rashiOf = (slug: RashiSlug) => RASHIS.find(r => r.slug === slug)!
export const nakshatraOf = (slug: NakshatraSlug) => NAKSHATRAS.find(n => n.slug === slug)!
export const grahaOf = (id: GrahaId) => GRAHAS.find(g => g.id === id)!
export const grahaShort = (id: GrahaId) => grahaOf(id).name.split(' (')[0]

export function rashiLabel(slug: RashiSlug): string {
  const r = rashiOf(slug)
  return `${r.name} (${r.western})`
}

export function points(n: number): string {
  const whole = Math.floor(n)
  if (n - whole < 0.5) return String(whole)
  return whole === 0 ? '½' : `${whole}½`
}

export function formatDateLong(iso: string): string {
  const [y, m, d] = iso.split('-').map(Number)
  return new Date(Date.UTC(y, m - 1, d)).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC' })
}

export function formatTime12(hhmm: string): string {
  const [h, m] = hhmm.split(':').map(Number)
  const suffix = h < 12 ? 'AM' : 'PM'
  return `${((h + 11) % 12) + 1}:${String(m).padStart(2, '0')} ${suffix}`
}

export function formatCoords(lat: number, lng: number): string {
  return `${Math.abs(lat).toFixed(2)}°${lat >= 0 ? 'N' : 'S'}, ${Math.abs(lng).toFixed(2)}°${lng >= 0 ? 'E' : 'W'}`
}

export function formatAyanamsha(deg: number): string {
  const totalSeconds = Math.round(deg * 3600)
  const d = Math.floor(totalSeconds / 3600)
  const m = Math.floor((totalSeconds % 3600) / 60)
  const s = totalSeconds % 60
  return `${d}°${String(m).padStart(2, '0')}′${String(s).padStart(2, '0')}″`
}

/** 'full' | 'partial' | 'zero' — drives colour on koota nodes and cards. */
export function tone(score: number, max: number): 'full' | 'partial' | 'zero' {
  if (score >= max) return 'full'
  if (score <= 0) return 'zero'
  return 'partial'
}

export const ROLE_LABEL = { bride: 'Bride', groom: 'Groom' } as const
export const ROLE_HI = { bride: 'कन्या', groom: 'वर' } as const
