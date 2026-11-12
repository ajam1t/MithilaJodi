/** Pure helpers for the engagement journey (no server imports, so they can be unit-tested). */

const IST_MS = 5.5 * 3600e3

/** The configured time on the India-time calendar day after `from`. */
export function nextSendAt(from: Date, a: { send_hour: number; send_minute: number }): Date {
  const ist = new Date(from.getTime() + IST_MS)
  const utcMs = Date.UTC(ist.getUTCFullYear(), ist.getUTCMonth(), ist.getUTCDate() + 1, a.send_hour, a.send_minute) - IST_MS
  return new Date(utcMs)
}

/** "@MithilaJodiOfficial" from an Instagram profile URL. */
export function instagramHandle(url: string): string {
  try {
    const seg = new URL(url).pathname.split('/').filter(Boolean)[0]
    return seg ? '@' + seg : url
  } catch { return url }
}

export const AUTOMATED_FOOTER = '\n\n— यह Mithila Jodi का स्वचालित संदेश है। कोई सवाल हो तो यहीं जवाब दीजिए, हमारी टीम पढ़ती है।'

export function renderMessage(body: string, vars: { name: string; link: string; instagramUrl: string }): string {
  const name = vars.name.trim() || 'सदस्य'
  return body
    .replaceAll('{name}', name)
    .replaceAll('{link}', vars.link)
    .replaceAll('{instagram_handle}', instagramHandle(vars.instagramUrl))
    .replaceAll('{instagram_url}', vars.instagramUrl) + AUTOMATED_FOOTER
}

