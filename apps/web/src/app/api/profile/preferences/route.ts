import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { createAdminClient } from '@/lib/supabase/server'
import { getSessionAccount } from '@/lib/auth'

const PreferencesSchema = z.object({
  pref_age_min:   z.number().int().min(18).max(70).nullable().optional(),
  pref_age_max:   z.number().int().min(18).max(80).nullable().optional(),
  pref_gender:    z.enum(['male', 'female']).nullable().optional(),
  pref_caste:     z.array(z.string().max(100)).max(20).nullable().optional(),
  pref_gotra_safe: z.boolean().optional(),
  pref_education: z.array(z.number().int()).max(20).nullable().optional(),
  pref_location:  z.array(z.number().int()).max(20).nullable().optional(),
  pref_diet:      z.array(z.string().max(50)).max(10).nullable().optional(),
  pref_notes:     z.string().max(1000).nullable().optional(),
})

async function getProfile(adminClient: Awaited<ReturnType<typeof createAdminClient>>, accountId: string) {
  const { data } = await adminClient
    .from('profiles')
    .select('id')
    .eq('account_id', accountId)
    .is('deleted_at', null)
    .order('updated_at', { ascending: false })
    .limit(1)
    .maybeSingle()
  return data
}

export async function GET() {
  const account = await getSessionAccount()
  if (!account) return NextResponse.json({ ok: false }, { status: 401 })

  const admin = await createAdminClient()
  const profile = await getProfile(admin, account.id)
  if (!profile) return NextResponse.json({ ok: false, message: 'Profile not found.' }, { status: 404 })

  const { data: prefs } = await admin
    .from('profile_preferences')
    .select('*')
    .eq('profile_id', profile.id)
    .maybeSingle()

  return NextResponse.json({ ok: true, preferences: prefs ?? null })
}

export async function PUT(request: NextRequest) {
  const account = await getSessionAccount()
  if (!account) return NextResponse.json({ ok: false }, { status: 401 })

  let body: unknown
  try { body = await request.json() } catch {
    return NextResponse.json({ ok: false, message: 'Invalid request body' }, { status: 400 })
  }

  const parsed = PreferencesSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json(
      { ok: false, message: parsed.error.issues[0]?.message ?? 'Invalid data' },
      { status: 400 }
    )
  }

  const admin = await createAdminClient()
  const profile = await getProfile(admin, account.id)
  if (!profile) return NextResponse.json({ ok: false, message: 'Profile not found.' }, { status: 404 })

  const data = parsed.data

  const { error } = await admin
    .from('profile_preferences')
    .upsert({
      profile_id: profile.id,
      pref_age_min:    data.pref_age_min    ?? null,
      pref_age_max:    data.pref_age_max    ?? null,
      pref_gender:     data.pref_gender     ?? null,
      pref_caste:      data.pref_caste      ?? null,
      pref_gotra_safe: data.pref_gotra_safe ?? true,
      pref_education:  data.pref_education  ?? null,
      pref_location:   data.pref_location   ?? null,
      pref_diet:       data.pref_diet       ?? null,
      pref_notes:      data.pref_notes      ?? null,
      updated_at:      new Date().toISOString(),
    }, { onConflict: 'profile_id' })

  if (error) {
    console.error('[preferences PUT] error:', error.message)
    return NextResponse.json({ ok: false, message: 'Failed to save preferences.' }, { status: 500 })
  }

  return NextResponse.json({ ok: true })
}
