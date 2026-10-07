import 'server-only'
import { createAdminClient } from '@/lib/supabase/server'
import { INSTAGRAM_URL, WHATSAPP_COMMUNITY_URL, YOUTUBE_URL } from '@/lib/constants'

/*
 * Admin-editable site configuration (table site_settings). The public site
 * links to /go/<name>, which reads these values on every click — so changing
 * the WhatsApp community link in Admin → Community takes effect immediately,
 * with no deployment. The constants are only the fallback if the table is
 * unreachable.
 */

export type WhatsAppCommunity = { url: string; enabled: boolean }
export type SocialLinks = { instagram: string; youtube: string }
export type PlatformLimits = { db_gb: number | null; storage_gb: number | null; plan: string | null }

export const SOCIAL_KEYS = ['instagram', 'youtube'] as const
export type SocialKey = (typeof SOCIAL_KEYS)[number]

export type SettingRow<T> = { value: T; updated_at: string | null; updated_by: string | null }

const DEFAULTS = {
  whatsapp_community: { url: WHATSAPP_COMMUNITY_URL, enabled: true } as WhatsAppCommunity,
  social_links: { instagram: INSTAGRAM_URL, youtube: YOUTUBE_URL } as SocialLinks,
  // Entered by the admin from their Supabase plan; null until then (never guessed).
  platform_limits: { db_gb: null, storage_gb: null, plan: null } as PlatformLimits,
}

type Key = keyof typeof DEFAULTS

export async function getSetting<K extends Key>(key: K): Promise<SettingRow<(typeof DEFAULTS)[K]>> {
  try {
    const admin = await createAdminClient()
    const { data } = await admin.from('site_settings').select('value, updated_at, updated_by').eq('key', key).maybeSingle()
    if (data?.value) return { value: { ...DEFAULTS[key], ...data.value }, updated_at: data.updated_at, updated_by: data.updated_by }
  } catch {
    /* fall back to the built-in defaults */
  }
  return { value: DEFAULTS[key], updated_at: null, updated_by: null }
}

/** Only https links to the expected hosts are accepted for each setting. */
export function validLink(kind: 'whatsapp' | SocialKey, raw: string): string | null {
  let u: URL
  try { u = new URL(raw.trim()) } catch { return null }
  if (u.protocol !== 'https:') return null
  const host = u.hostname.replace(/^www\./, '')
  const ok =
    kind === 'whatsapp' ? host === 'chat.whatsapp.com' || host === 'whatsapp.com' :
    kind === 'instagram' ? host === 'instagram.com' :
    host === 'youtube.com' || host === 'youtu.be' || host === 'm.youtube.com'
  return ok ? u.toString() : null
}
