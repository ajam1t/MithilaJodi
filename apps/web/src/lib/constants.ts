// Edge-safe constants — no Node.js APIs, safe to import from middleware

export const SESSION_COOKIE = 'mj-session'
export const SESSION_DAYS = 30

/**
 * Canonical production origin used for metadata, canonical tags, sitemap,
 * robots and JSON-LD. The apex host serves 200; www.mithilajodi.com issues a
 * 308 redirect to it, so the apex is the single canonical host. Honours
 * NEXT_PUBLIC_SITE_URL when set; trailing slashes are stripped so callers can
 * safely append paths. Keep every SEO surface pointed at this one value to
 * avoid duplicate-canonical issues.
 */
export const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL ?? 'https://mithilajodi.com')
  .replace(/\/+$/, '')
  .replace(/^https:\/\/www\./, 'https://')

/** Indian mobile: 10 digits starting with 6–9 */
export const INDIA_MOBILE_RE = /^[6-9]\d{9}$/

/** Normalise a user-supplied mobile string to E.164 Indian format */
export function toE164(digits: string): string {
  return `+91${digits}`
}
