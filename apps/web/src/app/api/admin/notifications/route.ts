import 'server-only'
import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/server'
import { getSessionAccount } from '@/lib/auth'
import { AUDIENCES, deliverCampaign, resolveAudience, type Audience, type AudienceCondition } from '@/lib/notificationCampaigns'

/* eslint-disable @typescript-eslint/no-explicit-any */

/**
 * Admin announcements. Admins only — moderators review content, but sending
 * something to every member is a bigger decision than that.
 */
async function requireAdmin() {
  const session = await getSessionAccount()
  return session && session.role === 'admin' ? session : null
}

export async function GET() {
  const session = await requireAdmin()
  if (!session) return NextResponse.json({ ok: false }, { status: 403 })

  const admin = await createAdminClient()
  const { data, error } = await admin
    .from('notification_campaigns')
    .select('id, title, message, type, cta_label, cta_url, audience, audience_filter, is_active, expires_at, delivered_count, created_at')
    .order('created_at', { ascending: false })
    .limit(50)
  if (error) {
    console.error('[admin/notifications GET] error:', error.message)
    return NextResponse.json({ ok: false }, { status: 500 })
  }
  return NextResponse.json({ ok: true, campaigns: data ?? [] })
}

function str(v: unknown, max: number): string | null {
  return typeof v === 'string' && v.trim() ? v.trim().slice(0, max) : null
}

export async function POST(request: NextRequest) {
  const session = await requireAdmin()
  if (!session) return NextResponse.json({ ok: false }, { status: 403 })

  let body: any
  try { body = await request.json() } catch {
    return NextResponse.json({ ok: false, message: 'Invalid request body' }, { status: 400 })
  }

  const title = str(body.title, 120)
  const message = str(body.message, 500)
  const ctaLabel = str(body.cta_label, 40)
  const ctaUrl = str(body.cta_url, 300)
  const audience = body.audience as Audience
  const type = body.type === 'system' ? 'system' : 'announcement'

  if (!title || !message) return NextResponse.json({ ok: false, message: 'Title and message are required.' }, { status: 400 })
  if (!AUDIENCES.includes(audience)) return NextResponse.json({ ok: false, message: 'Choose an audience.' }, { status: 400 })
  if ((ctaLabel && !ctaUrl) || (!ctaLabel && ctaUrl)) {
    return NextResponse.json({ ok: false, message: 'A button needs both a label and a destination.' }, { status: 400 })
  }
  if (ctaUrl && !/^\/[A-Za-z0-9]/.test(ctaUrl)) {
    return NextResponse.json({ ok: false, message: 'The destination must be a page on Mithila Jodi, e.g. /search.' }, { status: 400 })
  }

  const c = body.condition ?? {}
  const condition: AudienceCondition = {
    gender: c.gender === 'male' || c.gender === 'female' ? c.gender : undefined,
    caste: str(c.caste, 60) ?? undefined,
    marital_status: str(c.marital_status, 60) ?? undefined,
    joined_within_days: Number.isFinite(+c.joined_within_days) && +c.joined_within_days > 0 ? Math.min(3650, Math.floor(+c.joined_within_days)) : undefined,
    complete_below: Number.isFinite(+c.complete_below) && +c.complete_below > 0 ? Math.min(100, Math.floor(+c.complete_below)) : undefined,
  }
  if (audience === 'condition' && Object.values(condition).every(v => v === undefined)) {
    return NextResponse.json({ ok: false, message: 'Pick at least one condition.' }, { status: 400 })
  }
  const profileIds: string[] = Array.isArray(body.profile_ids)
    ? body.profile_ids.filter((x: unknown) => typeof x === 'string').slice(0, 500)
    : typeof body.profile_ids === 'string' ? body.profile_ids.split(/[\s,]+/).filter(Boolean).slice(0, 500) : []

  let expiresAt: string | null = null
  if (body.expires_at) {
    const t = Date.parse(body.expires_at)
    if (Number.isNaN(t) || t <= Date.now()) return NextResponse.json({ ok: false, message: 'Expiry must be in the future.' }, { status: 400 })
    expiresAt = new Date(t).toISOString()
  }

  const admin = await createAdminClient()

  let accountIds: string[]
  try {
    accountIds = await resolveAudience(admin, audience, condition, profileIds)
  } catch (err) {
    console.error('[admin/notifications POST] audience error:', err)
    return NextResponse.json({ ok: false, message: 'Could not work out the audience.' }, { status: 500 })
  }
  // "How many would this reach?" without sending anything.
  if (body.preview === true) {
    return NextResponse.json({ ok: true, preview: true, audience_size: accountIds.length })
  }
  if (accountIds.length === 0) {
    return NextResponse.json({ ok: false, message: 'No members match that audience.' }, { status: 422 })
  }

  const { data: campaign, error } = await admin
    .from('notification_campaigns')
    .insert({
      title, message, type, cta_label: ctaLabel, cta_url: ctaUrl, audience,
      audience_filter: audience === 'specific' ? { profile_ids: profileIds } : audience === 'condition' ? condition : {},
      expires_at: expiresAt, created_by: session.id,
    })
    .select('*')
    .single()
  if (error || !campaign) {
    console.error('[admin/notifications POST] insert error:', error?.message)
    return NextResponse.json({ ok: false, message: 'Could not save the announcement.' }, { status: 500 })
  }

  let delivered = 0
  try {
    delivered = await deliverCampaign(admin, campaign, accountIds)
  } catch (err) {
    console.error('[admin/notifications POST] delivery error:', err)
  }
  await admin.from('notification_campaigns').update({ delivered_count: delivered }).eq('id', campaign.id)

  await admin.from('admin_audit_logs').insert({
    actor_id: session.id,
    action: 'send_announcement',
    target_type: 'notification_campaign',
    target_id: campaign.id,
    payload: { title, audience, delivered },
  })

  return NextResponse.json({ ok: true, campaign_id: campaign.id, delivered })
}
