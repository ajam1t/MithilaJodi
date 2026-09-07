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
const SITE_URL_FALLBACK = 'https://mithilajodi.com'

/**
 * A production build must never emit a localhost canonical.
 *
 * `NEXT_PUBLIC_*` values are inlined at BUILD time, and `.env.local` in this
 * repo sets NEXT_PUBLIC_SITE_URL=http://localhost:3000 for local development.
 * Any production build that happens to see that file — a build run from a
 * developer machine, a misconfigured CI checkout, a stray env var on the host —
 * would bake `http://localhost:3000` into every canonical tag, og:url, JSON-LD
 * url and sitemap entry. Google would then be told the canonical version of
 * every page is an address it cannot reach, which de-indexes the site quietly.
 *
 * So in production anything that is not an https origin is rejected in favour
 * of the apex. In development the value is honoured, so local links still work.
 */
function resolveSiteUrl(): string {
  const raw = process.env.NEXT_PUBLIC_SITE_URL?.trim()
  if (!raw) return SITE_URL_FALLBACK

  const cleaned = raw.replace(/\/+$/, '').replace(/^https:\/\/www\./, 'https://')
  const isHttps = /^https:\/\//i.test(cleaned)

  if (process.env.NODE_ENV === 'production' && !isHttps) {
    console.warn(
      `[constants] Ignoring NEXT_PUBLIC_SITE_URL="${raw}" in a production build ` +
      `— it is not an https origin. Falling back to ${SITE_URL_FALLBACK}.`,
    )
    return SITE_URL_FALLBACK
  }
  return cleaned
}

export const SITE_URL = resolveSiteUrl()

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

/* ── Legal / contact ───────────────────────────────────────────────────────
   The single source of truth for the contact details published in the Terms
   and Privacy Policy. These are the same details already published on
   /contact, so the legal pages cannot drift away from the real ones.

   LEGAL_VERSION must match the default used when consent is recorded
   (TERMS_VERSION / PRIVACY_POLICY_VERSION, both default '1.0' — see
   lib/authFlow.ts). Bumping a policy version here without bumping those means
   stored consent records would point at the wrong document version. */
export const SUPPORT_EMAIL = 'contact@mithilajodi.com'
export const SUPPORT_PHONE_DISPLAY = '+91 8898372628'
export const SUPPORT_PHONE_E164 = '918898372628'
export const LEGAL_VERSION = '1.0'
export const LEGAL_EFFECTIVE_DATE = '5 September 2026'

/* Grievance Officer — published to satisfy Rule 3(2) of the Information
   Technology (Intermediary Guidelines and Digital Media Ethics Code) Rules,
   2021, and to name a point of contact for grievances under the Digital
   Personal Data Protection Act, 2023. The officer is reachable at the same
   verified support address and number above, so there is no separate mailbox
   to bounce; only the name is specific to the role. */
export const GRIEVANCE_OFFICER_NAME = 'Amit Jha'
