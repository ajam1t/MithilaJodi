import { Suspense } from 'react'
import { redirect } from 'next/navigation'
import { after } from 'next/server'
import { getSessionAccount } from '@/lib/auth'
import { approvedPhotoUrls, canViewPhotos, normalisePhotoVisibility } from '@/lib/photoAccess'
import { askAgainAt, requestBetween, type RequestRow } from '@/lib/memberRequests'
import { createAdminClient } from '@/lib/supabase/server'
import { getCommunityLabels, labelFor } from '@/lib/communityLabels'
import { getLocationIndex } from '@/lib/locationIndex'
import { haversineKm, scoreMatch, topReasons, type ScoreProfile, type ScorePreferences } from '@/lib/matchScore'
import { formatPartnerPreferences } from '@/lib/partnerPreferences'
import type { PartnerPreferencesDisplay } from '@/types/profile'
import { notifyProfileViewed } from '@/lib/notifications'
import ProfileViewClient from './ProfileViewClient'
import { recordMemberActivity } from '@/lib/serverEvents'

export const dynamic = 'force-dynamic'

async function fetchProfileView(profileId: string, viewerAccountId: string, preview = false) {
  const admin = await createAdminClient()

  // Viewer's own profile. The full row, not just the id: it is what the match
  // score is computed against.
  const { data: myProfile, error: myProfileError } = await admin
    .from('profiles')
    .select('id, account_id, first_name, last_name, profile_status, discoverable, gender, dob, religion, caste, sub_caste, self_gotra, maternal_gotra, mool, gram, native_place_id, current_loc_id, job_loc_id, diet, smoking, drinking, marriage_timeline, education_detail, degree, family_type, family_values')
    .eq('account_id', viewerAccountId)
    .neq('profile_status', 'deleted')
    .is('deleted_at', null)
    .order('updated_at', { ascending: false })
    .limit(1)
    .maybeSingle()

  // Fail closed: without the viewer's profile the block checks below cannot run.
  if (myProfileError) {
    console.error('[profile/[id]] viewer profile query error:', myProfileError.message)
    return 'error' as const
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const myProfileId: string | null = (myProfile as any)?.id ?? null

  // Your own profile lives at /profile. The one exception is ?preview=1 from
  // there: "Preview how others see you" renders your profile through this same
  // member view, with every action and relationship detail left out.
  const isSelf = myProfileId === profileId
  if (isSelf && !preview) redirect('/profile')

  // Fetch the target profile (only active+discoverable — except your own
  // preview, which shows you your profile even while it is hidden).
  let profileQuery = admin
    .from('profiles')
    .select(
      'id, account_id, first_name, last_name, gender, dob, religion, caste, sub_caste, self_gotra, mool, gram, height_cm, diet, about_me, family_about, profile_complete, profile_status, discoverable, native_place_id, current_loc_id, employer, profession_detail, education_detail, smoking, drinking, maternal_gotra, job_loc_id, marriage_timeline, marital_status, mother_tongue, degree, specialization, institution, passing_year, job_title, employment_type, industry, work_type, experience_years, family_type, managed_by, family_values, parents_info, siblings_info, family_expectations, family_introduction'
    )
    .eq('id', profileId)
    .is('deleted_at', null)
  if (!isSelf) profileQuery = profileQuery.eq('discoverable', true).eq('profile_status', 'active')
  const { data: profile } = await profileQuery.maybeSingle()

  if (!profile) return null

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const p = profile as any

  if (!isSelf) {
    // A member who has blocked the viewer, or whose account is not usable
    // (suspended, banned, deactivated, deleted), is simply "not found".
    const [{ data: blockedMe, error: blockError }, { data: owner }] = await Promise.all([
      myProfileId
        ? admin.from('blocks').select('blocker_id').eq('blocker_id', profileId).eq('blocked_id', myProfileId).maybeSingle()
        : Promise.resolve({ data: null, error: null }),
      admin.from('accounts').select('account_status, deleted_at').eq('id', p.account_id).maybeSingle(),
    ])
    // Fail closed: an unreadable block check is never read as "not blocked".
    if (blockError) {
      console.error('[profile/[id]] blocks query error:', blockError.message)
      return 'error' as const
    }
    if (blockedMe) return null
    if (!owner || owner.deleted_at || owner.account_status !== 'active') return null
  }

  // "Someone viewed your profile" — after the response, so it never slows the
  // page; deduped per viewer per week inside notifyProfileViewed.
  // Conversion funnel: this member opened someone's profile.
  if (!isSelf) recordMemberActivity(viewerAccountId, 'profile_view')

  if (myProfile) {
    after(() => notifyProfileViewed(admin, myProfile, { id: p.id as string, account_id: p.account_id as string }))
  }

  // Age from dob
  let age: number | null = null
  if (p.dob) {
    const birth = new Date(p.dob)
    const now = new Date()
    age = now.getFullYear() - birth.getFullYear()
    const m = now.getMonth() - birth.getMonth()
    if (m < 0 || (m === 0 && now.getDate() < birth.getDate())) age--
  }

  // Location names — and, for the profile story's map and distances, the
  // viewer's own two places too (never shown by name; only used to measure).
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const mine = (!isSelf ? myProfile : null) as any
  const locIds = [p.native_place_id, p.current_loc_id, p.job_loc_id, mine?.current_loc_id, mine?.native_place_id].filter(Boolean)
  const locMap: Record<number, string> = {}
  const geo: Record<number, { lat: number; lng: number }> = {}
  if (locIds.length > 0) {
    const { data: locs } = await admin
      .from('india_locations')
      .select('id, name_en, latitude, longitude')
      .in('id', locIds)
    for (const l of locs ?? []) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const r = l as any
      locMap[r.id] = r.name_en
      if (r.latitude != null && r.longitude != null) geo[r.id] = { lat: Number(r.latitude), lng: Number(r.longitude) }
    }
  }

  // Photo privacy: a member who limits photographs to accepted connections
  // shows one here only to those connections. The rest of the profile is
  // unaffected — this withholds the photograph, not the profile.
  // In your own preview, photos follow the rule for a member you have not
  // connected with — that is what most people who open your profile see.
  const photoAllowed = await canViewPhotos(admin, isSelf ? null : myProfileId, profileId)

  // Every approved photograph, primary first — the same loader and order as
  // the Digital Profile, so the gallery here matches it. Nothing is fetched at
  // all when the owner keeps photos for connections and this viewer is not one.
  const photos = photoAllowed ? await approvedPhotoUrls(admin, profileId) : []
  const photoUrl: string | null = photos[0] ?? null

  // Why the photos are withheld, for the quiet panel shown in their place:
  // 'on_request' offers "Request photos" (and this viewer's request, if any);
  // 'connected' just says matches see them. Only when there are approved
  // photos to see, and never in your own preview. Before the requests
  // migration runs, 'on_request' reads as 'connected' here as everywhere.
  let photoGate: { level: 'connected' | 'on_request'; request: RequestRow | null; askAgainAt: string | null } | null = null
  if (!isSelf && myProfileId && !photoAllowed) {
    const [{ data: priv }, { count: photoCount }] = await Promise.all([
      admin.from('profile_private').select('photo_visibility').eq('profile_id', profileId).maybeSingle(),
      admin.from('profile_photos').select('id', { count: 'exact', head: true }).eq('profile_id', profileId).eq('status', 'approved'),
    ])
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const level = normalisePhotoVisibility((priv as any)?.photo_visibility)
    if ((photoCount ?? 0) > 0 && (level === 'connected' || level === 'on_request')) {
      const r = level === 'on_request' ? await requestBetween(admin, 'photo', myProfileId, profileId) : 'off'
      photoGate = r === 'off' || r === 'error'
        ? { level: 'connected', request: null, askAgainAt: null }
        : { level: 'on_request', request: r, askAgainAt: askAgainAt(r) }
    }
  }

  // Relationship state (requires viewer to have a profile)
  let interestSent: { id: string; status: string } | null = null
  let interestReceived: { id: string; status: string } | null = null
  let shortlisted = false
  let blocked = false

  if (myProfileId && !isSelf) {
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
    // Fail closed here too: not knowing whether you blocked them must not show
    // a blocked member with the ordinary actions.
    if (blockRes.error) {
      console.error('[profile/[id]] own block query error:', blockRes.error.message)
      return 'error' as const
    }
    shortlisted = !!shortRes.data
    blocked = !!blockRes.data
  }

  // An accepted interest in either direction is a match (as on /p and in the
  // Inbox); the conversation it opened is where "Message" goes.
  const matched = interestSent?.status === 'accepted' || interestReceived?.status === 'accepted'
  let conversationId: string | null = null
  if (matched && myProfileId) {
    const [a, b] = myProfileId < profileId ? [myProfileId, profileId] : [profileId, myProfileId]
    const { data: conv } = await admin.from('conversations').select('id').eq('profile_a', a).eq('profile_b', b).maybeSingle()
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    conversationId = (conv as any)?.id ?? null
  }

  // Contact details on request, between matches only: this viewer's request
  // to them, and whether they are waiting on one from this viewer. Null (no
  // UI) before the requests migration runs or if it cannot be read.
  let contactRequest: { request: RequestRow | null; askAgainAt: string | null; theyAsked: boolean } | null = null
  if (matched && myProfileId && !isSelf && !blocked) {
    const [mine, theirs] = await Promise.all([
      requestBetween(admin, 'contact', myProfileId, profileId),
      requestBetween(admin, 'contact', profileId, myProfileId),
    ])
    if (mine !== 'off' && mine !== 'error') {
      contactRequest = {
        request: mine,
        askAgainAt: askAgainAt(mine),
        theyAsked: theirs !== 'off' && theirs !== 'error' && theirs?.status === 'pending',
      }
    }
  }

  // ── Match score ───────────────────────────────────────────────────────────
  // Only computable when the viewer has a profile of their own; there is
  // nothing to compare an empty account against.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const toScoreProfile = (row: any): ScoreProfile => ({
    id: row.id, gender: row.gender, dob: row.dob,
    // Raw option keys: scoring compares these between two profiles (sagotra is
    // an equality check on self_gotra), so labels must not be substituted here.
    religion: row.religion, caste: row.caste, sub_caste: row.sub_caste,
    self_gotra: row.self_gotra, maternal_gotra: row.maternal_gotra,
    mool: row.mool, gram: row.gram,
    native_place_id: row.native_place_id, current_loc_id: row.current_loc_id, job_loc_id: row.job_loc_id,
    diet: row.diet, smoking: row.smoking, drinking: row.drinking,
    marriage_timeline: row.marriage_timeline,
    education_detail: row.education_detail, degree: row.degree,
    family_type: row.family_type, family_values: row.family_values,
  })
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const toScorePrefs = (row: any | null): ScorePreferences => row ? {
    pref_age_min: row.pref_age_min, pref_age_max: row.pref_age_max,
    pref_caste: row.pref_caste, pref_diet: row.pref_diet, pref_location: row.pref_location,
    pref_marriage_timeline: row.pref_marriage_timeline, pref_gotra_safe: row.pref_gotra_safe,
  } : {}

  let match: {
    score: number
    band: 'excellent' | 'strong' | 'good' | 'fair'
    confidence: number
    reasons: Array<{ key: string; label: string; detail: string }>
    blockers: string[]
    cautions: string[]
    /** Every factor, not just the strong ones — this page has room for all of them. */
    breakdown: Array<{ key: string; label: string; points: number; max: number; detail: string }>
  } | null = null

  // Their stated preferences, for the gallery's "Looking for" face. Loaded
  // regardless of whether the viewer has a profile of their own — unlike the
  // match score, this does not need two sides to compare.
  let theirPreferencesDisplay: PartnerPreferencesDisplay | null = null

  if (myProfileId && !isSelf) {
    const [{ data: myPrefs }, { data: theirPrefs }, locationIndex] = await Promise.all([
      admin.from('profile_preferences').select('*').eq('profile_id', myProfileId).maybeSingle(),
      admin.from('profile_preferences').select('*').eq('profile_id', profileId).maybeSingle(),
      getLocationIndex(admin),
    ])
    // Reuse the row already fetched for scoring rather than querying again.
    theirPreferencesDisplay = await formatPartnerPreferences(admin, theirPrefs)
    const result = scoreMatch(
      toScoreProfile(myProfile), toScorePrefs(myPrefs),
      toScoreProfile({ ...p, id: profileId }), toScorePrefs(theirPrefs),
      locationIndex,
    )
    match = {
      score: result.score,
      band: result.band,
      confidence: Math.round(result.confidence * 100) / 100,
      reasons: topReasons(result, 4).map(r => ({ key: r.key, label: r.label, detail: r.detail })),
      blockers: result.blockers,
      cautions: result.cautions,
      breakdown: result.reasons.map(r => ({ key: r.key, label: r.label, points: r.points, max: r.max, detail: r.detail })),
    }
  }

  if (!myProfileId || isSelf) {
    theirPreferencesDisplay = await formatPartnerPreferences(
      admin,
      (await admin.from('profile_preferences').select('*').eq('profile_id', profileId).maybeSingle()).data,
    )
  }

  // ── The profile story's comparisons ─────────────────────────────────────
  // Distances are rounded, and the map gets only positions inside its own
  // frame (0–1), never coordinates. Nothing here names the viewer's places.
  const km = (a?: number | null, b?: number | null) =>
    a && b && geo[a] && geo[b] ? haversineKm(geo[a].lat, geo[a].lng, geo[b].lat, geo[b].lng) : null
  const roundKm = (d: number | null) => (d == null ? null : d < 15 ? Math.round(d) : Math.round(d / 10) * 10)
  const pinsRaw = ([
    ['home', p.current_loc_id], ['native', p.native_place_id], ['work', p.job_loc_id], ['you', mine?.current_loc_id],
  ] as const).filter(([, id]) => id && geo[id as number]) as Array<[string, number]>
  // One pin per place: work in the home city is the home pin.
  const seen = new Set<number>()
  const uniq = pinsRaw.filter(([, id]) => (seen.has(id) ? false : (seen.add(id), true)))
  let pins: Array<{ kind: string; x: number; y: number }> = []
  if (uniq.length > 0) {
    const pts = uniq.map(([k, id]) => ({ k, x: geo[id].lng * Math.cos((geo[id].lat * Math.PI) / 180), y: -geo[id].lat }))
    const xs = pts.map(q => q.x), ys = pts.map(q => q.y)
    const span = Math.max(Math.max(...xs) - Math.min(...xs), Math.max(...ys) - Math.min(...ys), 0.6)
    const cx = (Math.max(...xs) + Math.min(...xs)) / 2, cy = (Math.max(...ys) + Math.min(...ys)) / 2
    pins = pts.map(q => ({ kind: q.k, x: Math.round((0.5 + ((q.x - cx) / span) * 0.72) * 1000) / 1000, y: Math.round((0.5 + ((q.y - cy) / span) * 0.72) * 1000) / 1000 }))
  }
  const story = {
    hasViewer: !!mine,
    viewerGender: (mine?.gender as string | null) ?? null,
    distanceKm: roundKm(km(mine?.current_loc_id, p.current_loc_id)),
    sameCity: !!mine?.current_loc_id && mine.current_loc_id === p.current_loc_id,
    nativeDistanceKm: roundKm(km(mine?.native_place_id, p.native_place_id)),
    sameNative: !!mine?.native_place_id && mine.native_place_id === p.native_place_id,
    nativeToHomeKm: roundKm(km(p.native_place_id, p.current_loc_id)),
    // Raw option keys compared, as the match score does (labels can differ in case).
    sameGotra: !!mine?.self_gotra && !!p.self_gotra && String(mine.self_gotra).toLowerCase() === String(p.self_gotra).toLowerCase(),
    pins,
  }

  const lastName = p.last_name as string | null
  const displayName = lastName ? `${p.first_name} ${lastName}` : p.first_name

  const nativeName = p.native_place_id ? locMap[p.native_place_id] ?? null : null
  const currentName = p.current_loc_id ? locMap[p.current_loc_id] ?? null : null
  const jobLocName = p.job_loc_id ? locMap[p.job_loc_id] ?? null : null
  const displayAge = age ?? 0

  // Display labels for the stored option keys. Scoring above deliberately uses
  // the raw keys instead.
  const labels = await getCommunityLabels(admin)

  return {
    id: profileId,
    /** Owner previewing their own profile: render it with no actions at all. */
    preview: isSelf,
    previewHidden: isSelf && (p.discoverable !== true || p.profile_status !== 'active'),
    display_name: displayName,
    gender: p.gender,
    age,
    height_cm: p.height_cm,
    religion: labelFor(labels, 'religion', p.religion),
    caste: labelFor(labels, 'caste', p.caste),
    sub_caste: labelFor(labels, 'sub_caste', p.sub_caste ?? null),
    self_gotra: labelFor(labels, 'gotra', p.self_gotra),
    maternal_gotra: labelFor(labels, 'gotra', p.maternal_gotra ?? null),
    mool: labelFor(labels, 'mool', p.mool),
    gram: p.gram,
    diet: labelFor(labels, 'diet', p.diet),
    marital_status: labelFor(labels, 'marital_status', p.marital_status ?? null),
    mother_tongue: labelFor(labels, 'mother_tongue', p.mother_tongue ?? null),
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
    photos,
    story,
    matched,
    conversationId,
    photoGate,
    contactRequest,
    myProfileId,
    interestSent,
    interestReceived,
    shortlisted,
    blocked,
    match,
    cardData: {
      id: profileId,
      display_name: displayName,
      gender: p.gender as string,
      age: displayAge,
      religion: labelFor(labels, 'religion', p.religion as string | null),
      caste: labelFor(labels, 'caste', p.caste as string | null),
      self_gotra: labelFor(labels, 'gotra', p.self_gotra as string | null),
      mool: labelFor(labels, 'mool', p.mool as string | null),
      gram: (p.gram as string | null) ?? null,
      height_cm: (p.height_cm as number | null) ?? null,
      diet: labelFor(labels, 'diet', p.diet as string | null),
      about_snippet: p.about_me ? String(p.about_me).slice(0, 200) : null,
      profile_complete: (p.profile_complete as number) ?? 0,
      // Internal moderation state is not a family-facing detail: empty, so the
      // gallery deck leaves the field out (as on a Digital Profile).
      profile_status: '',
      native_place_name: nativeName,
      current_loc_name: currentName,
      has_photo: !!photoUrl,
      primary_photo_url: photoUrl,
      employer: (p.employer as string | null) ?? null,
      profession_detail: (p.profession_detail as string | null) ?? null,
      education_detail: (p.education_detail as string | null) ?? null,
      degree: (p.degree as string | null) ?? null,
      specialization: (p.specialization as string | null) ?? null,
      institution: (p.institution as string | null) ?? null,
      smoking: (p.smoking as string | null) ?? null,
      drinking: (p.drinking as string | null) ?? null,
      maternal_gotra: labelFor(labels, 'gotra', p.maternal_gotra as string | null),
      job_loc_name: jobLocName,
      marriage_timeline: (p.marriage_timeline as string | null) ?? null,
      job_title: (p.job_title as string | null) ?? null,
      marital_status: labelFor(labels, 'marital_status', p.marital_status as string | null),
      family_type: (p.family_type as string | null) ?? null,
      match: match ? {
        score: match.score, band: match.band, confidence: match.confidence,
        reasons: match.reasons, blockers: match.blockers, cautions: match.cautions,
      } : null,
      preferences: theirPreferencesDisplay,
    },
  }
}

export default async function ProfileViewPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>
  searchParams: Promise<{ preview?: string }>
}) {
  const session = await getSessionAccount()
  if (!session) redirect(`/login?next=/profile/${(await params).id}`)

  const { id } = await params
  const { preview } = await searchParams
  const data = await fetchProfileView(id, session.id, preview === '1')

  if (data === 'error') {
    return (
      <main id="main-content" className="min-h-screen bg-paper">
        <div className="wrap py-16 text-center">
          <p className="font-serif text-2xl text-ink mb-2">Profile unavailable</p>
          <p className="text-ink-soft text-sm">Something went wrong — please try again.</p>
        </div>
      </main>
    )
  }

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
      {/* Keyed by member: going from one profile to another never reuses the
          previous member's client state (interest, shortlist, gallery). */}
      <ProfileViewClient key={data.id} data={data} />
    </Suspense>
  )
}
