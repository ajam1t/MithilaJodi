import 'server-only'
import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/server'
import { getSessionAccount } from '@/lib/auth'

const PROFILE_FIELDS = [
  'profile_for', 'first_name', 'last_name', 'gender', 'dob', 'religion', 'caste', 'sub_caste',
  'self_gotra', 'maternal_gotra', 'mool', 'gram', 'native_place_id', 'current_loc_id', 'job_loc_id',
  'education_level_id', 'education_detail', 'profession_id', 'profession_detail', 'employer',
  'height_cm', 'diet', 'smoking', 'drinking', 'about_me', 'family_about', 'profile_status',
  'discoverable', 'profile_complete', 'status_reason', 'marital_status', 'mother_tongue', 'degree',
  'specialization', 'institution', 'passing_year', 'employment_type', 'industry', 'job_title',
  'experience_years', 'work_type', 'family_type', 'managed_by', 'family_values', 'parents_info',
  'siblings_info', 'family_expectations', 'family_introduction',
] as const

function pickProfile(input: Record<string, unknown>, includeStatus = true): Record<string, unknown> {
  const result: Record<string, unknown> = {}
  for (const field of PROFILE_FIELDS) {
    if (!includeStatus && (field === 'profile_status' || field === 'status_reason')) continue
    if (Object.prototype.hasOwnProperty.call(input, field)) {
      const value = input[field]
      result[field] = typeof value === 'string' && value.trim() === '' ? null : value
    }
  }
  return result
}

export async function GET(request: NextRequest) {
  const session = await getSessionAccount()
  if (!session || (session.role !== 'admin' && session.role !== 'moderator')) {
    return NextResponse.json({ ok: false }, { status: 403 })
  }

  const status = request.nextUrl.searchParams.get('status')
  const admin = await createAdminClient()

  let query = admin
    .from('profiles')
    .select('id, first_name, last_name, dob, gender, caste, profile_status, discoverable, created_at, account_id, accounts(mobile)')
    .order('created_at', { ascending: false })
    .limit(50)

  if (status && status !== 'all') {
    query = query.eq('profile_status', status)
  }

  const { data: profiles, error } = await query

  if (error) {
    console.error('[admin/profiles GET] query error:', error.message)
    return NextResponse.json({ ok: false }, { status: 500 })
  }

  const profileRows = profiles ?? []
  const profileIds = profileRows.map((profile) => profile.id)
  const { data: photos } = profileIds.length
    ? await admin.from('profile_photos').select('profile_id, storage_path, is_primary, status').in('profile_id', profileIds).eq('is_primary', true).eq('status', 'approved')
    : { data: [] }
  const photoMap = new Map<string, string | null>()
  for (const photo of photos ?? []) {
    const { data: signed } = await admin.storage.from('profile-photos').createSignedUrl(photo.storage_path, 3600)
    photoMap.set(photo.profile_id, signed?.signedUrl ?? null)
  }

  return NextResponse.json({
    ok: true,
    profiles: profileRows.map((profile) => ({ ...profile, primary_photo_url: photoMap.get(profile.id) ?? null })),
  })
}

export async function POST(request: NextRequest) {
  const session = await getSessionAccount()
  if (!session || session.role !== 'admin') {
    return NextResponse.json({ ok: false }, { status: 403 })
  }

  let body: unknown
  try { body = await request.json() } catch {
    return NextResponse.json({ ok: false, message: 'Invalid request body.' }, { status: 400 })
  }
  const input = (body as Record<string, unknown>) ?? {}
  const mobile = typeof input.mobile === 'string' ? input.mobile.trim() : ''
  const rawProfile = (input.profile as Record<string, unknown>) ?? {}
  if (!mobile || typeof rawProfile.first_name !== 'string' || !rawProfile.first_name.trim() || !['male', 'female'].includes(String(rawProfile.gender))) {
    return NextResponse.json({ ok: false, message: 'Mobile, first name, and gender are required.' }, { status: 400 })
  }
  if (typeof rawProfile.dob !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(rawProfile.dob)) {
    return NextResponse.json({ ok: false, message: 'A valid date of birth is required.' }, { status: 400 })
  }

  const admin = await createAdminClient()
  const { data: existing } = await admin.from('accounts').select('id').eq('mobile', mobile).maybeSingle()
  if (existing) return NextResponse.json({ ok: false, message: 'An account with this mobile already exists.' }, { status: 409 })

  const { data: account, error: accountError } = await admin
    .from('accounts')
    .insert({ mobile, mobile_verified: false, account_status: 'active', role: 'user' })
    .select('id')
    .single()
  if (accountError || !account) {
    console.error('[admin/profiles POST] account insert error:', accountError?.message)
    return NextResponse.json({ ok: false, message: 'Could not create the account.' }, { status: 500 })
  }

  const profileData = pickProfile({
    ...rawProfile,
    account_id: account.id,
    profile_status: rawProfile.profile_status ?? 'active',
    discoverable: rawProfile.discoverable ?? true,
    profile_complete: rawProfile.profile_complete ?? 0,
  })
  profileData.account_id = account.id
  const { data: profile, error: profileError } = await admin.from('profiles').insert(profileData).select('id').single()
  if (profileError || !profile) {
    console.error('[admin/profiles POST] profile insert error:', profileError?.message)
    await admin.from('accounts').delete().eq('id', account.id)
    return NextResponse.json({ ok: false, message: 'Could not create the profile.' }, { status: 500 })
  }

  if (input.showcase === true) {
    const { data: maxRow } = await admin.from('public_showcase').select('sort_order').order('sort_order', { ascending: false }).limit(1).maybeSingle()
    await admin.from('public_showcase').insert({ profile_id: profile.id, sort_order: (maxRow?.sort_order ?? -1) + 1, is_active: true, added_by: session.id })
  }

  await admin.from('admin_audit_logs').insert({
    actor_id: session.id,
    action: 'create_profile',
    target_type: 'profile',
    target_id: profile.id,
    payload: { account_id: account.id, mobile },
  })
  return NextResponse.json({ ok: true, profile_id: profile.id, account_id: account.id }, { status: 201 })
}
