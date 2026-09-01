import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { createAdminClient } from '@/lib/supabase/server'
import { getSessionAccount } from '@/lib/auth'
import { isFreeAccessMode } from '@/lib/membership'

const ProfileSchema = z.object({
  profile_for: z.enum(['self', 'son', 'daughter', 'sibling', 'other']).default('self'),
  first_name: z.string().min(1).max(100),
  last_name: z.string().max(100).optional().nullable(),
  gender: z.enum(['male', 'female']),
  dob: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be YYYY-MM-DD'),
  religion: z.string().max(100).default('Hindu'),
  caste: z.string().max(100).optional().nullable(),
  sub_caste: z.string().max(100).optional().nullable(),
  self_gotra: z.string().max(100).optional().nullable(),
  maternal_gotra: z.string().max(100).optional().nullable(),
  mool: z.string().max(100).optional().nullable(),
  gram: z.string().max(100).optional().nullable(),
  native_place_id: z.coerce.number().int().positive().optional().nullable(),
  current_loc_id: z.coerce.number().int().positive().optional().nullable(),
  job_loc_id: z.coerce.number().int().positive().optional().nullable(),
  height_cm: z.number().int().min(100).max(250).optional().nullable(),
  diet: z.enum(['vegetarian', 'non_vegetarian', 'eggetarian', 'vegan', '']).optional().nullable(),
  smoking: z.enum(['no', 'occasionally', 'yes', '']).optional().nullable(),
  drinking: z.enum(['no', 'occasionally', 'yes', '']).optional().nullable(),
  education_detail:  z.string().max(500).optional().nullable(),
  profession_detail: z.string().max(500).optional().nullable(),
  employer:          z.string().max(500).optional().nullable(),
  about_me: z.string().max(1000).optional().nullable(),
  family_about: z.string().max(1000).optional().nullable(),
  marriage_timeline: z.enum(['within_3_months', 'within_6_months', 'within_1_year', 'within_2_years', 'no_rush', '']).optional().nullable(),
  discoverable: z.boolean().optional(),

  // ── V10 additive fields ──
  // Master-data-driven free strings (values come from community_masters)
  marital_status:  z.string().max(100).optional().nullable(),
  mother_tongue:   z.string().max(100).optional().nullable(),
  employment_type: z.string().max(100).optional().nullable(),
  industry:        z.string().max(100).optional().nullable(),
  work_type:       z.string().max(100).optional().nullable(),
  family_type:     z.string().max(100).optional().nullable(),
  managed_by:      z.string().max(100).optional().nullable(),
  family_values:   z.string().max(100).optional().nullable(),
  // Free-text fields
  degree:               z.string().max(200).optional().nullable(),
  specialization:       z.string().max(200).optional().nullable(),
  institution:          z.string().max(200).optional().nullable(),
  job_title:            z.string().max(200).optional().nullable(),
  parents_info:         z.string().max(200).optional().nullable(),
  siblings_info:        z.string().max(200).optional().nullable(),
  family_expectations:  z.string().max(200).optional().nullable(),
  family_introduction:  z.string().max(200).optional().nullable(),
  // Numeric fields
  passing_year:     z.number().int().min(1950).max(new Date().getFullYear() + 1).optional().nullable(),
  experience_years: z.number().int().min(0).max(70).optional().nullable(),

  // Private details
  income_min_lpa: z.coerce.number().int().min(0).max(100000).optional().nullable(),
  income_max_lpa: z.coerce.number().int().min(0).max(100000).optional().nullable(),
  rashi: z.string().max(100).optional().nullable(),
  nakshatra: z.string().max(100).optional().nullable(),
  mangalik: z.string().max(100).optional().nullable(),
  birth_time: z.string().max(50).optional().nullable(),
  birth_place: z.string().max(200).optional().nullable(),
  contact_mobile: z.string().max(30).optional().nullable(),
  contact_email: z.string().email().max(255).optional().nullable().or(z.literal('')),
  address: z.string().max(500).optional().nullable(),
  kundli_url: z.string().max(500).optional().nullable(),
  contact_visibility: z.string().max(50).optional().nullable(),
  photo_visibility: z.string().max(50).optional().nullable(),

  // Partner preferences
  pref_age_min: z.coerce.number().int().min(18).max(100).optional().nullable(),
  pref_age_max: z.coerce.number().int().min(18).max(100).optional().nullable(),
  pref_gender: z.enum(['male', 'female', 'any', '']).optional().nullable(),
  pref_caste: z.array(z.string().max(100)).optional().nullable(),
  pref_gotra_safe: z.boolean().optional().nullable(),
  pref_education: z.array(z.coerce.number().int().positive()).optional().nullable(),
  pref_location: z.array(z.coerce.number().int().positive()).optional().nullable(),
  pref_diet: z.array(z.string().max(100)).optional().nullable(),
  pref_notes: z.string().max(1000).optional().nullable(),
  pref_profession: z.array(z.string().max(100)).optional().nullable(),
  pref_marital_status: z.array(z.string().max(100)).optional().nullable(),
  pref_children: z.string().max(100).optional().nullable(),
  pref_living_arrangement: z.string().max(100).optional().nullable(),
  pref_career: z.string().max(500).optional().nullable(),
  pref_marriage_timeline: z.string().max(100).optional().nullable(),
  pref_manglik: z.string().max(100).optional().nullable(),
})

function computeCompletion(data: z.infer<typeof ProfileSchema>): number {
  // Field-based completeness. Discoverability is NOT gated on this value
  // (it is driven by membership/free-access), so this is purely a quality
  // signal shown on the profile ring and used to sort search results.
  const checks = [
    !!data.first_name,
    !!data.gender,
    !!data.dob,
    !!data.caste,
    !!data.self_gotra,
    !!data.mother_tongue,
    !!data.marital_status,
    !!data.native_place_id,
    !!data.current_loc_id,
    !!data.height_cm,
    !!data.diet,
    !!data.about_me,
  ]
  const done = checks.filter(Boolean).length
  return Math.round((done / checks.length) * 100)
}

export async function GET() {
  const account = await getSessionAccount()
  if (!account) return NextResponse.json({ ok: false }, { status: 401 })

  const admin = await createAdminClient()

  const { data: profile } = await admin
    .from('profiles')
    .select('*')
    .eq('account_id', account.id)
    .is('deleted_at', null)
    .order('updated_at', { ascending: false })
    .limit(1)
    .maybeSingle()

  const photos: unknown[] = []
  if (profile) {
    const { data: photoRows } = await admin
      .from('profile_photos')
      .select('id, is_primary, display_order, status, blurhash, width_px, height_px, storage_path')
      .eq('profile_id', profile.id)
      .neq('status', 'deleted')
      .order('display_order', { ascending: true })

    for (const p of (photoRows ?? [])) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const photo = p as any
      const { data: signed } = await admin.storage
        .from('profile-photos')
        .createSignedUrl(photo.storage_path, 3600)
      photos.push({
        id: photo.id,
        is_primary: photo.is_primary,
        display_order: photo.display_order,
        status: photo.status,
        blurhash: photo.blurhash,
        width_px: photo.width_px,
        height_px: photo.height_px,
        signed_url: signed?.signedUrl ?? null,
      })
    }
  }

  const privateDetails = profile
    ? (await admin.from('profile_private').select('*').eq('profile_id', profile.id).maybeSingle()).data
    : null
  const preferences = profile
    ? (await admin.from('profile_preferences').select('*').eq('profile_id', profile.id).maybeSingle()).data
    : null

  // Resolve location display names for the 3D profile card
  let native_place_name: string | null = null
  let current_loc_name: string | null = null
  let job_loc_name: string | null = null
  if (profile) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const p = profile as any
    const locIds = [p.native_place_id, p.current_loc_id, p.job_loc_id].filter(Boolean)
    if (locIds.length > 0) {
      const { data: locs } = await admin.from('india_locations').select('id, name_en').in('id', locIds)
      const locMap: Record<number, string> = {}
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      for (const l of (locs ?? [])) { locMap[(l as any).id] = (l as any).name_en }
      native_place_name = p.native_place_id ? locMap[p.native_place_id] ?? null : null
      current_loc_name = p.current_loc_id ? locMap[p.current_loc_id] ?? null : null
      job_loc_name = p.job_loc_id ? locMap[p.job_loc_id] ?? null : null
    }
  }

  // Never ship internal bookkeeping columns to the browser. select('*') is kept
  // because Supabase infers the row type from a literal select string, so the
  // allowlist is applied here on the way out instead.
  const INTERNAL_FIELDS = ['account_id', 'is_demo', 'search_needs_rebuild', 'status_reason', 'deleted_at', 'activated_at'] as const
  const safeProfile = profile
    ? Object.fromEntries(
        Object.entries(profile as Record<string, unknown>).filter(([k]) => !INTERNAL_FIELDS.includes(k as never))
      )
    : profile

  return NextResponse.json({ ok: true, profile: safeProfile, private: privateDetails, preferences, photos, native_place_name, current_loc_name, job_loc_name })
}

export async function PUT(request: NextRequest) {
  const account = await getSessionAccount()
  if (!account) return NextResponse.json({ ok: false }, { status: 401 })

  let body: unknown
  try { body = await request.json() } catch {
    return NextResponse.json({ ok: false, message: 'Invalid request body' }, { status: 400 })
  }

  const parsed = ProfileSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json(
      { ok: false, message: parsed.error.issues[0]?.message ?? 'Invalid data' },
      { status: 400 }
    )
  }

  const data = parsed.data
  const admin = await createAdminClient()

  const locationIds = [data.native_place_id, data.current_loc_id, data.job_loc_id].filter((value): value is number => typeof value === 'number')
  if (locationIds.length > 0) {
    const { data: validLocations, error: locationError } = await admin.from('india_locations').select('id').in('id', locationIds)
    if (locationError || (validLocations ?? []).length !== new Set(locationIds).size) {
      return NextResponse.json({ ok: false, message: 'Please select each location from the suggestions list.' }, { status: 400 })
    }
  }

  // Validate DOB: must be at least 18 years old
  const dob = new Date(data.dob)
  const minDob = new Date()
  minDob.setFullYear(minDob.getFullYear() - 18)
  if (dob > minDob) {
    return NextResponse.json({ ok: false, message: 'You must be at least 18 years old.' }, { status: 400 })
  }

  // Cross-field check zod cannot express per-field: an inverted preferred age
  // range silently matches nobody, so reject it instead of storing it.
  if (
    data.pref_age_min != null &&
    data.pref_age_max != null &&
    data.pref_age_min > data.pref_age_max
  ) {
    return NextResponse.json(
      { ok: false, message: 'Preferred minimum age cannot be greater than the maximum age.' },
      { status: 400 },
    )
  }

  const profileCompletion = computeCompletion(data)

  // Free-access/testing mode: profiles are self-serve — they go live immediately
  // and are discoverable by default. With PAID_MEMBERSHIPS_ENABLED=true, the normal
  // draft → admin-moderation model applies (profile_status stays 'draft' on
  // create and is promoted to 'active' only by an admin).
  const freeMode = isFreeAccessMode()
  const discoverableDefault = data.discoverable ?? freeMode

  const { data: existing } = await admin
    .from('profiles')
    .select('id, profile_status')
    .eq('account_id', account.id)
    .is('deleted_at', null)
    .order('updated_at', { ascending: false })
    .limit(1)
    .maybeSingle()

  if (existing) {
    // In free mode, promote a draft to active on save; never override a
    // deactivated/banned/active status here.
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const currentStatus = (existing as any).profile_status as string
    const promotedStatus = freeMode && currentStatus === 'draft' ? 'active' : currentStatus

    const { error } = await admin
      .from('profiles')
      .update({
        profile_for: data.profile_for,
        first_name: data.first_name,
        last_name: data.last_name ?? null,
        gender: data.gender,
        dob: data.dob,
        religion: data.religion,
        caste: data.caste ?? null,
        sub_caste: data.sub_caste ?? null,
        self_gotra: data.self_gotra ?? null,
        maternal_gotra: data.maternal_gotra ?? null,
        mool: data.mool ?? null,
        gram: data.gram ?? null,
        native_place_id: data.native_place_id ?? null,
        current_loc_id: data.current_loc_id ?? null,
        job_loc_id: data.job_loc_id ?? null,
        height_cm: data.height_cm ?? null,
        diet: data.diet || null,
        smoking: data.smoking || null,
        drinking: data.drinking || null,
        education_detail:  data.education_detail  ?? null,
        profession_detail: data.profession_detail ?? null,
        employer:          data.employer          ?? null,
        about_me: data.about_me ?? null,
        family_about: data.family_about ?? null,
        marriage_timeline: data.marriage_timeline || null,
        // ── V10 additive fields ──
        marital_status:  data.marital_status  || null,
        mother_tongue:   data.mother_tongue   || null,
        employment_type: data.employment_type || null,
        industry:        data.industry        || null,
        work_type:       data.work_type       || null,
        family_type:     data.family_type     || null,
        managed_by:      data.managed_by      || null,
        family_values:   data.family_values   || null,
        degree:               data.degree               || null,
        specialization:       data.specialization       || null,
        institution:          data.institution          || null,
        job_title:            data.job_title             || null,
        parents_info:         data.parents_info          || null,
        siblings_info:        data.siblings_info         || null,
        family_expectations:  data.family_expectations   || null,
        family_introduction:  data.family_introduction   || null,
        passing_year:     data.passing_year     ?? null,
        experience_years: data.experience_years ?? null,
        discoverable: discoverableDefault,
        profile_status: promotedStatus,
        profile_complete: profileCompletion,
        search_needs_rebuild: true,
      })
      .eq('id', existing.id)

    if (error) {
      console.error('[profile PUT] update error:', error.message)
      return NextResponse.json({ ok: false, message: 'Failed to save profile.' }, { status: 500 })
    }
    try {
      await savePrivateAndPreferences(admin, existing.id, data)
    } catch (privateError) {
      console.error('[profile PUT] private/preferences update error:', privateError)
      return NextResponse.json({ ok: false, message: 'Profile saved, but private details could not be saved.' }, { status: 500 })
    }
    return NextResponse.json({ ok: true, profile_id: existing.id })
  }

  // Create new profile
  const { data: newProfile, error: createError } = await admin
    .from('profiles')
    .insert({
      account_id: account.id,
      profile_for: data.profile_for,
      first_name: data.first_name,
      last_name: data.last_name ?? null,
      gender: data.gender,
      dob: data.dob,
      religion: data.religion,
      caste: data.caste ?? null,
      sub_caste: data.sub_caste ?? null,
      self_gotra: data.self_gotra ?? null,
      maternal_gotra: data.maternal_gotra ?? null,
      mool: data.mool ?? null,
      gram: data.gram ?? null,
      native_place_id: data.native_place_id ?? null,
      current_loc_id: data.current_loc_id ?? null,
      job_loc_id: data.job_loc_id ?? null,
      height_cm: data.height_cm ?? null,
      diet: data.diet || null,
      smoking: data.smoking || null,
      drinking: data.drinking || null,
      education_detail:  data.education_detail  ?? null,
      profession_detail: data.profession_detail ?? null,
      employer:          data.employer          ?? null,
      about_me: data.about_me ?? null,
      family_about: data.family_about ?? null,
      marriage_timeline: data.marriage_timeline || null,
      // ── V10 additive fields ──
      marital_status:  data.marital_status  || null,
      mother_tongue:   data.mother_tongue   || null,
      employment_type: data.employment_type || null,
      industry:        data.industry        || null,
      work_type:       data.work_type       || null,
      family_type:     data.family_type     || null,
      managed_by:      data.managed_by      || null,
      family_values:   data.family_values   || null,
      degree:               data.degree               || null,
      specialization:       data.specialization       || null,
      institution:          data.institution          || null,
      job_title:            data.job_title             || null,
      parents_info:         data.parents_info          || null,
      siblings_info:        data.siblings_info         || null,
      family_expectations:  data.family_expectations   || null,
      family_introduction:  data.family_introduction   || null,
      passing_year:     data.passing_year     ?? null,
      experience_years: data.experience_years ?? null,
      discoverable: discoverableDefault,
      profile_complete: profileCompletion,
      profile_status: freeMode ? 'active' : 'draft',
    })
    .select('id')
    .single()

  if (createError || !newProfile) {
    console.error('[profile PUT] insert error:', createError?.message)
    return NextResponse.json({ ok: false, message: 'Failed to create profile.' }, { status: 500 })
  }

  try {
    await savePrivateAndPreferences(admin, newProfile.id, data)
  } catch (privateError) {
    console.error('[profile PUT] private/preferences create error:', privateError)
    return NextResponse.json({ ok: false, message: 'Profile created, but private details could not be saved.' }, { status: 500 })
  }
  return NextResponse.json({ ok: true, profile_id: newProfile.id }, { status: 201 })
}

async function savePrivateAndPreferences(admin: Awaited<ReturnType<typeof createAdminClient>>, profileId: string, data: z.infer<typeof ProfileSchema>) {
  const { error: privateError } = await admin.from('profile_private').upsert({
    profile_id: profileId,
    income_min_lpa: data.income_min_lpa ?? null,
    income_max_lpa: data.income_max_lpa ?? null,
    rashi: data.rashi || null,
    nakshatra: data.nakshatra || null,
    mangalik: data.mangalik || null,
    birth_time: data.birth_time || null,
    birth_place: data.birth_place || null,
    contact_mobile: data.contact_mobile || null,
    contact_email: data.contact_email || null,
    address: data.address || null,
    kundli_url: data.kundli_url || null,
    contact_visibility: data.contact_visibility || null,
    photo_visibility: data.photo_visibility || null,
  })
  if (privateError) throw new Error(privateError.message)

  const { error: preferenceError } = await admin.from('profile_preferences').upsert({
    profile_id: profileId,
    pref_age_min: data.pref_age_min ?? null,
    pref_age_max: data.pref_age_max ?? null,
    pref_gender: data.pref_gender || null,
    pref_caste: data.pref_caste ?? null,
    pref_gotra_safe: data.pref_gotra_safe ?? true,
    pref_education: data.pref_education ?? null,
    pref_location: data.pref_location ?? null,
    pref_diet: data.pref_diet ?? null,
    pref_notes: data.pref_notes || null,
    pref_profession: data.pref_profession ?? null,
    pref_marital_status: data.pref_marital_status ?? null,
    pref_children: data.pref_children || null,
    pref_living_arrangement: data.pref_living_arrangement || null,
    pref_career: data.pref_career || null,
    pref_marriage_timeline: data.pref_marriage_timeline || null,
    pref_manglik: data.pref_manglik || null,
  })
  if (preferenceError) throw new Error(preferenceError.message)
}
