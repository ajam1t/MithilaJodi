/** Display helpers for the invitation — client-safe, no time-zone guessing. */
import { localToUtc } from '@/lib/astrology/time/localTime'

/** Wedding date + time in India → UTC ms, for the countdown. Midnight if no time is given. */
export function weddingMoment(date: string, time: string): number | null {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) return null
  const [year, month, day] = date.split('-').map(Number)
  const [hour, minute] = /^\d{2}:\d{2}$/.test(time) ? time.split(':').map(Number) : [0, 0]
  const r = localToUtc({ year, month, day, hour, minute }, 'Asia/Kolkata')
  return r.status === 'ok' ? r.utcMs : r.status === 'ambiguous' ? r.earlier.utcMs : null
}

const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December']
const DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']
const DAYS_HI = ['रवि', 'सोम', 'मंगल', 'बुध', 'बृहस्पति', 'शुक्र', 'शनि']

function parts(iso: string) {
  const [y, m, d] = iso.split('-').map(Number)
  return { y, m, d, wd: new Date(Date.UTC(y, m - 1, d)).getUTCDay() }
}

/** '2026-11-15' → '15 November 2026' */
export function longDate(iso: string): string {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(iso)) return ''
  const { y, m, d } = parts(iso)
  return `${d} ${MONTHS[m - 1]} ${y}`
}

/** '2026-11-15' → 'Sunday · रविदिन' */
export function weekday(iso: string): { en: string; hi: string } | null {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(iso)) return null
  const { wd } = parts(iso)
  return { en: DAYS[wd], hi: `${DAYS_HI[wd]}दिन` }
}

/** '19:30' → '7:30 PM' */
export function time12(hhmm: string): string {
  if (!/^\d{2}:\d{2}$/.test(hhmm)) return ''
  const [h, m] = hhmm.split(':').map(Number)
  return `${((h + 11) % 12) + 1}:${String(m).padStart(2, '0')} ${h < 12 ? 'AM' : 'PM'}`
}

export function directionsUrl(mapUrl: string, address: string): string {
  if (mapUrl) return mapUrl
  return `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(address)}`
}

export function mapEmbedUrl(address: string): string {
  return `https://maps.google.com/maps?q=${encodeURIComponent(address)}&z=15&output=embed`
}

/** Paragraphs from plain text; nothing is ever rendered as HTML. */
export function paragraphs(text: string): string[] {
  return text.split(/\n{2,}/).map(p => p.trim()).filter(Boolean)
}
