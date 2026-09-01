// Edge-safe constants — no Node.js APIs, safe to import from middleware

export const SESSION_COOKIE = 'mj-session'
export const SESSION_DAYS = 30

/**
 * Number of digits in a one-time password. MSG91's OTP widget is configured to
 * send a 4-digit code, and the server-generated dev/fallback OTP matches this.
 * Single source of truth for UI box count and server-side validation.
 */
export const OTP_LENGTH = 4

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

/**
 * Strip a trailing "Mithila Jodi" brand suffix from a page title.
 *
 * The root layout applies `template: '%s | Mithila Jodi'`, so any title that
 * already carries the brand renders it twice — e.g. "Browse Profiles — Discover
 * Mithila Matches | Mithila Jodi | Mithila Jodi". Editor-supplied blog
 * seo_titles are especially prone to this, so normalise here rather than
 * trusting every caller.
 */
export function stripBrandSuffix(title: string): string {
  return title
    .replace(/\s*[|–—-]\s*Mithila Jodi(\s+Blog)?\s*$/i, '')
    .trim()
}
