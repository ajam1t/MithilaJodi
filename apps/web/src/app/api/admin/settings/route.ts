import 'server-only'
import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/server'
import { audit, requireAdminApi, type AdminPerm } from '@/lib/adminAuth'
import { SOCIAL_KEYS, validLink } from '@/lib/siteSettings'

/*
 * Save one site setting. Each key has its own permission and validation; the
 * previous value goes into the audit entry so the history of, say, every
 * WhatsApp community link is in Security → Audit log.
 */

type Key = 'whatsapp_community' | 'social_links' | 'platform_limits'

const PERM: Record<Key, AdminPerm> = {
  whatsapp_community: 'manage_community',
  social_links: 'manage_community',
  platform_limits: 'manage_settings',
}

const AUDIT_ACTION: Record<Key, string> = {
  whatsapp_community: 'setting_whatsapp_community',
  social_links: 'setting_social_links',
  platform_limits: 'setting_platform_limits',
}

function validate(key: Key, v: Record<string, unknown>): { value?: Record<string, unknown>; error?: string } {
  if (key === 'whatsapp_community') {
    const url = validLink('whatsapp', String(v.url ?? ''))
    if (!url) return { error: 'Enter a WhatsApp invite link that starts with https://chat.whatsapp.com/' }
    return { value: { url, enabled: v.enabled !== false } }
  }
  if (key === 'social_links') {
    const out: Record<string, string> = {}
    for (const k of SOCIAL_KEYS) {
      const url = validLink(k, String(v[k] ?? ''))
      if (!url) return { error: `Enter a valid https ${k === 'instagram' ? 'instagram.com' : 'youtube.com'} link.` }
      out[k] = url
    }
    return { value: out }
  }
  // platform_limits: the plan quotas the admin reads off their Supabase plan.
  const gb = (x: unknown) => (x === '' || x == null ? null : Number(x))
  const db = gb(v.db_gb)
  const storage = gb(v.storage_gb)
  for (const n of [db, storage]) if (n !== null && (!Number.isFinite(n) || n <= 0 || n > 100_000)) return { error: 'Limits must be positive numbers of GB.' }
  return { value: { db_gb: db, storage_gb: storage, plan: String(v.plan ?? '').slice(0, 40) || null } }
}

export async function PATCH(request: NextRequest) {
  let body: Record<string, unknown>
  try { body = await request.json() } catch { return NextResponse.json({ ok: false, message: 'Invalid request.' }, { status: 400 }) }
  const key = body.key as Key
  if (!(key in PERM)) return NextResponse.json({ ok: false, message: 'Unknown setting.' }, { status: 400 })

  const guard = await requireAdminApi(PERM[key])
  if (guard.error) return guard.error

  const { value, error } = validate(key, (body.value ?? {}) as Record<string, unknown>)
  if (error || !value) return NextResponse.json({ ok: false, message: error }, { status: 400 })

  const admin = await createAdminClient()
  const { data: before } = await admin.from('site_settings').select('value').eq('key', key).maybeSingle()
  const { error: dbError } = await admin
    .from('site_settings')
    .upsert({ key, value, updated_at: new Date().toISOString(), updated_by: guard.session.id })
  if (dbError) {
    console.error('[admin settings] save failed:', dbError.message)
    return NextResponse.json({ ok: false, message: 'The setting could not be saved. Nothing was changed.' }, { status: 500 })
  }
  await audit(guard.session.id, AUDIT_ACTION[key], { type: 'setting', id: null }, { key, before: before?.value ?? null, after: value }, request)
  return NextResponse.json({ ok: true, value })
}
