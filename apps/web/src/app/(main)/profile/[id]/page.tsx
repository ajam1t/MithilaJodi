import { Suspense } from 'react'
import { redirect } from 'next/navigation'
import { getSessionAccount } from '@/lib/auth'
import { createAdminClient } from '@/lib/supabase/server'
import ProfileViewClient from './ProfileViewClient'

export const dynamic = 'force-dynamic'

async function fetchProfileView(profileId: string, viewerAccountId: string) {
  const admin = await createAdminClient()

  // Viewer's own profile
  const { data: myProfile } = await admin
    .from('profiles')
    .select('id')
    .eq('account_id', viewerAccountId)
    .neq('profile_status', 'deleted')
    .is('deleted_at', null)
    .maybeSingle()

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const myProfileId: string | null = (myProfile as any)?.id ?? null

  // Redirect to own profile page if viewing self
  if (myProfileId === profileId) redirect('/profile')

  // Fetch the target profile (only active+discoverable or exact id match for admin)
  const { data: profile } = await admin
    .from('profiles')
    .select(
      'id, first_name, last_name, gender, dob, religion, caste, sub_caste, self_gotra, mool, gram, height_cm, diet, about_me, family_about, profile_complete, profile_status, discoverable, native_place_id, current_loc_id, employer, profession_detail, education_detail, smoking, drinking, maternal_gotra, job_loc_id, marriage_timeline, marital_status, mother_tongue, degree, specialization, institution, passing_year, job_title, employment_type, industry, work_type, experience_years, family_type, managed_by, family_values, parents_info, siblings_info, family_expectations, family_introduction'
    )
    .eq('id', profileId)
    .eq('discoverable', true)
    .eq('profile_status', 'active')
    .is('deleted_at', null)
    .maybeSingle()

  if (!profile) return null

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const p = profile as any

  // Age from dob
  let age: number | null = null
  if (p.dob) {
    const birth = new Date(p.dob)
    const now = new Date()
    age = now.getFullYear() - birth.getFullYear()
    const m = now.getMonth() - birth.getMonth()
    if (m < 0 || (m === 0 && now.getDate() < birth.getDate())) age--
  }

  // Location names
  const locIds = [p.native_place_id, p.current_loc_id, p.job_loc_id].filter(Boolean)
  const locMap: Record<number, string> = {}
  if (locIds.length > 0) {
    const { data: locs } = await admin
      .from('india_locations')
      .select('id, name_en')
      .in('id', locIds)
    for (const l of locs ?? []) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      locMap[(l as any).id] = (l as any).name_en
    }
  }

  // Primary photo
  const { data: photo } = await admin
    .from('profile_photos')
    .select('storage_path')
    .eq('profile_id', profileId)
    .eq('is_primary', true)
    .eq('status', 'approved')
    .maybeSingle()

  let photoUrl: string | null = null
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  if (photo && (photo as any).storage_path) {
    const { data: signed } = await admin.storage
      .from('profile-photos')
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      .createSignedUrl((photo as any).storage_path, 3600)
    photoUrl = signed?.signedUrl ?? null
  }

  // Relationship state (requires viewer to have a profile)
  let interestSent: { id: string; status: string } | null = null
  let interestReceived: { id: string; status: string } | null = null
  let shortlisted = false
  let blocked = false

  if (myProfileId) {
    const [sentRes, receivedRes, shortRes, blockRes] = await Promise.all([
      admin
        .from('interests')
        .select('id, status')
        .eq('from_profile', myProfileId)
        .eq('to_profile', profileId)
        .maybeSingle(),
      admin
        .from('interests')
        .select('id, status')
        .eq('from_profile', profileId)
        .eq('to_profile', myProfileId)
        .maybeSingle(),
      admin
        .from('shortlists')
        .select('saved_at')
        .eq('profile_id', myProfileId)
        .eq('saved_id', profileId)
        .maybeSingle(),
      admin
        .from('blocks')
        .select('created_at')
        .eq('blocker_id', myProfileId)
        .eq('blocked_id', profileId)
        .maybeSingle(),
    ])
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    interestSent = sentRes.data ? { id: (sentRes.data as any).id, status: (sentRes.data as any).status } : null
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    interestReceived = receivedRes.data ? { id: (receivedRes.data as any).id, status: (receivedRes.data as any).status } : null
    shortlisted = !!shortRes.data
    blocked = !!blockRes.data
  }

  const lastName = p.last_name as string | null
  const displayName = lastName ? `${p.first_name} ${lastName}` : p.first_name

  const nativeName = p.native_place_id ? locMap[p.native_place_id] ?? null : null
  const currentName = p.current_loc_id ? locMap[p.current_loc_id] ?? null : null
  const jobLocName = p.job_loc_id ? locMap[p.job_loc_id] ?? null : null
  const displayAge = age ?? 0

  return {
    id: profileId,
    display_name: displayName,
    gender: p.gender,
    age,
    height_cm: p.height_cm,
    religion: p.religion,
    caste: p.caste,
    sub_caste: p.sub_caste ?? null,
    self_gotra: p.self_gotra,
    maternal_gotra: p.maternal_gotra ?? null,
    mool: p.mool,
    gram: p.gram,
    diet: p.diet,
    marital_status: p.marital_status ?? null,
    mother_tongue: p.mother_tongue ?? null,
    about_me: p.about_me,
    family_about: p.family_about ?? null,
    profile_complete: p.profile_complete,
    native_place_name: nativeName,
    current_loc_name: currentName,
    job_loc_name: jobLocName,
    marriage_timeline: p.marriage_timeline ?? null,
    // Education
    education_detail: p.education_detail ?? null,
    degree: p.degree ?? null,
    specialization: p.specialization ?? null,
    institution: p.institution ?? null,
    passing_year: p.passing_year ?? null,
    // Career
    job_title: p.job_title ?? null,
    profession_detail: p.profession_detail ?? null,
    employer: p.employer ?? null,
    employment_type: p.employment_type ?? null,
    industry: p.industry ?? null,
    work_type: p.work_type ?? null,
    experience_years: p.experience_years ?? null,
    // Family
    family_type: p.family_type ?? null,
    managed_by: p.managed_by ?? null,
    family_values: p.family_values ?? null,
    parents_info: p.parents_info ?? null,
    siblings_info: p.siblings_info ?? null,
    family_expectations: p.family_expectations ?? null,
    family_introduction: p.family_introduction ?? null,
    photo_url: photoUrl,
    myProfileId,
    interestSent,
    interestReceived,
    shortlisted,
    blocked,
    cardData: {
      id: profileId,
      display_name: displayName,
      gender: p.gender as string,
      age: displayAge,
      religion: (p.religion as string | null) ?? null,
      caste: (p.caste as string | null) ?? null,
      self_gotra: (p.self_gotra as string | null) ?? null,
      mool: (p.mool as string | null) ?? null,
      gram: (p.gram as string | null) ?? null,
      height_cm: (p.height_cm as number | null) ?? null,
      diet: (p.diet as string | null) ?? null,
      about_snippet: p.about_me ? String(p.about_me).slice(0, 200) : null,
      profile_complete: (p.profile_complete as number) ?? 0,
      profile_status: p.profile_status as string,
      native_place_name: nativeName,
      current_loc_name: currentName,
      has_photo: !!photoUrl,
      primary_photo_url: photoUrl,
      employer: (p.employer as string | null) ?? null,
      profession_detail: (p.profession_detail as string | null) ?? null,
      education_detail: (p.education_detail as string | null) ?? null,
      smoking: (p.smoking as string | null) ?? null,
      drinking: (p.drinking as string | null) ?? null,
      maternal_gotra: (p.maternal_gotra as string | null) ?? null,
      job_loc_name: jobLocName,
      marriage_timeline: (p.marriage_timeline as string | null) ?? null,
    },
  }
}

export default async function ProfileViewPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const session = await getSessionAccount()
  if (!session) redirect(`/login?next=/profile/${(await params).id}`)

  const { id } = await params
  const data = await fetchProfileView(id, session.id)

  if (!data) {
    return (
      <main id="main-content" className="min-h-screen bg-paper">
        <div className="wrap py-16 text-center">
          <p className="font-serif text-2xl text-ink mb-2">Profile not found</p>
          <p className="text-ink-soft text-sm">
            This profile may not be active or discoverable.
          </p>
        </div>
      </main>
    )
  }

  return (
    <Suspense fallback={null}>
      <ProfileViewClient data={data} />
    </Suspense>
  )
}
