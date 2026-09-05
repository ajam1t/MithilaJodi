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

function pickFields(input: Record<string, unknown>, fields: readonly string[]): Record<string, unknown> {
  const result: Record<string, unknown> = {}
  for (const field of fields) {
    if (!Object.prototype.hasOwnProperty.call(input, field)) continue
    const value = input[field]
    result[field] = typeof value === 'string' && value.trim() === '' ? null : value
  }
  return result
}

const PRIVATE_FIELDS = [
  'income_min_lpa', 'income_max_lpa', 'rashi', 'nakshatra', 'mangalik', 'contact_mobile',
  'contact_email', 'address', 'birth_time', 'birth_place', 'kundli_url',
  'photo_visibility',
]

const PREFERENCE_FIELDS = [
  'pref_age_min', 'pref_age_max', 'pref_gender', 'pref_caste', 'pref_gotra_safe', 'pref_education',
  'pref_location', 'pref_diet', 'pref_notes', 'pref_profession', 'pref_marital_status',
  'pref_children', 'pref_living_arrangement', 'pref_career', 'pref_marriage_timeline', 'pref_manglik',
]

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSessionAccount()
  if (!session || (session.role !== 'admin' && session.role !== 'moderator')) {
    return NextResponse.json({ ok: false }, { status: 403 })
  }
  const { id } = await params
  const admin = await createAdminClient()
  const { data: profile, error } = await admin.from('profiles').select('*, accounts(mobile, account_status, role)').eq('id', id).maybeSingle()
  if (error || !profile) return NextResponse.json({ ok: false, message: 'Profile not found.' }, { status: 404 })

  const [{ data: privateRow }, { data: preferences }, { data: photos }] = await Promise.all([
    session.role === 'admin' ? admin.from('profile_private').select('*').eq('profile_id', id).maybeSingle() : Promise.resolve({ data: null }),
    session.role === 'admin' ? admin.from('profile_preferences').select('*').eq('profile_id', id).maybeSingle() : Promise.resolve({ data: null }),
    admin.from('profile_photos').select('id, storage_path, is_primary, display_order, status, moderation_note, width_px, height_px').eq('profile_id', id).neq('status', 'deleted').order('display_order', { ascending: true }),
  ])
  const { data: showcaseRow } = await admin.from('public_showcase').select('profile_id, is_active').eq('profile_id', id).maybeSingle()
  const locationIds = [profile.native_place_id, profile.current_loc_id, profile.job_loc_id].filter((value): value is number => typeof value === 'number')
  const { data: locationRows } = locationIds.length
    ? await admin.from('india_locations').select('id, name_en').in('id', locationIds)
    : { data: [] }
  const locationMap = new Map<number, string>((locationRows ?? []).map((row) => [row.id, row.name_en]))
  const photoRows = await Promise.all((photos ?? []).map(async (photo) => {
    const { data: signed } = await admin.storage.from('profile-photos').createSignedUrl(photo.storage_path, 3600)
    return { ...photo, signed_url: signed?.signedUrl ?? null }
  }))
  return NextResponse.json({ ok: true, profile, private: privateRow, preferences, photos: photoRows, showcase: Boolean(showcaseRow?.is_active), native_place_name: locationMap.get(profile.native_place_id) ?? null, current_loc_name: locationMap.get(profile.current_loc_id) ?? null, job_loc_name: locationMap.get(profile.job_loc_id) ?? null })
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSessionAccount()
  if (!session || (session.role !== 'admin' && session.role !== 'moderator')) {
    return NextResponse.json({ ok: false }, { status: 403 })
  }

  const { id } = await params
  const body = await request.json()
  const { action, reason, showcase } = body as { action: 'approve' | 'reject' | 'suspend' | 'update'; reason?: string; profile?: Record<string, unknown>; private?: Record<string, unknown>; preferences?: Record<string, unknown>; showcase?: boolean }

  if (action === 'update') {
    if (session.role !== 'admin') return NextResponse.json({ ok: false }, { status: 403 })
    const admin = await createAdminClient()
    const profileData = pickFields(body.profile ?? {}, PROFILE_FIELDS)
    profileData.search_needs_rebuild = true
    const { error: profileError } = await admin.from('profiles').update(profileData).eq('id', id)
    if (profileError) {
      console.error('[admin/profiles/[id] PATCH] profile update error:', profileError.message)
      return NextResponse.json({ ok: false, message: 'Could not update profile details.' }, { status: 500 })
    }

    const privateData = pickFields(body.private ?? {}, PRIVATE_FIELDS)
    if (Object.keys(privateData).length > 0) {
      const { error } = await admin.from('profile_private').upsert({ profile_id: id, ...privateData })
      if (error) return NextResponse.json({ ok: false, message: 'Could not update private profile details.' }, { status: 500 })
    }
    const preferenceData = pickFields(body.preferences ?? {}, PREFERENCE_FIELDS)
    if (Object.keys(preferenceData).length > 0) {
      const { error } = await admin.from('profile_preferences').upsert({ profile_id: id, ...preferenceData })
      if (error) return NextResponse.json({ ok: false, message: 'Could not update partner preferences.' }, { status: 500 })
    }
    if (showcase === true) {
      const { data: maxRow } = await admin.from('public_showcase').select('sort_order').order('sort_order', { ascending: false }).limit(1).maybeSingle()
      await admin.from('public_showcase').upsert({ profile_id: id, sort_order: (maxRow?.sort_order ?? -1) + 1, is_active: true, added_by: session.id })
    } else if (showcase === false) {
      await admin.from('public_showcase').delete().eq('profile_id', id)
    }
    await admin.from('admin_audit_logs').insert({
      actor_id: session.id,
      action: 'update_profile',
      target_type: 'profile',
      target_id: id,
      payload: { fields: Object.keys(profileData), private_fields: Object.keys(privateData), preference_fields: Object.keys(preferenceData) },
    })
    return NextResponse.json({ ok: true })
  }

  if (action !== 'approve' && action !== 'reject' && action !== 'suspend') {
    return NextResponse.json({ ok: false, message: 'Invalid action.' }, { status: 400 })
  }

  const admin = await createAdminClient()

  if (action === 'approve') {
    const { error } = await admin
      .from('profiles')
      .update({ profile_status: 'active', status_reason: null })
      .eq('id', id)

    if (error) {
      console.error('[admin/profiles/[id] PATCH] approve error:', error.message)
      return NextResponse.json({ ok: false }, { status: 500 })
    }

    await admin.from('admin_audit_logs').insert({
      actor_id: session.id,
      action: 'approve_profile',
      target_type: 'profile',
      target_id: id,
      payload: {},
    })
  } else if (action === 'suspend') {
    const statusReason = reason ?? 'Suspended by admin'

    const { error } = await admin
      .from('profiles')
      .update({ profile_status: 'suspended', status_reason: statusReason })
      .eq('id', id)

    if (error) {
      console.error('[admin/profiles/[id] PATCH] suspend error:', error.message)
      return NextResponse.json({ ok: false }, { status: 500 })
    }

    await admin.from('admin_audit_logs').insert({
      actor_id: session.id,
      action: 'suspend_profile',
      target_type: 'profile',
      target_id: id,
      payload: { reason: statusReason },
    })
  } else {
    const statusReason = reason ?? 'Rejected by admin'

    const { error } = await admin
      .from('profiles')
      .update({ profile_status: 'draft', status_reason: statusReason })
      .eq('id', id)

    if (error) {
      console.error('[admin/profiles/[id] PATCH] reject error:', error.message)
      return NextResponse.json({ ok: false }, { status: 500 })
    }

    await admin.from('admin_audit_logs').insert({
      actor_id: session.id,
      action: 'reject_profile',
      target_type: 'profile',
      target_id: id,
      payload: { reason: statusReason },
    })
  }

  return NextResponse.json({ ok: true })
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSessionAccount()
  if (!session || session.role !== 'admin') {
    return NextResponse.json({ ok: false }, { status: 403 })
  }

  const { id } = await params
  const admin = await createAdminClient()

  const { error } = await admin
    .from('profiles')
    .update({
      profile_status: 'deleted',
      first_name: null,
      last_name: null,
      dob: null,
    })
    .eq('id', id)

  if (error) {
    console.error('[admin/profiles/[id] DELETE] error:', error.message)
    return NextResponse.json({ ok: false }, { status: 500 })
  }

  await admin.from('admin_audit_logs').insert({
    actor_id: session.id,
    action: 'delete_profile',
    target_type: 'profile',
    target_id: id,
    payload: {},
  })

  return NextResponse.json({ ok: true })
}
