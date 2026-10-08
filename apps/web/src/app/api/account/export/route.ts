import 'server-only'
import { NextResponse } from 'next/server'
import { getSessionAccount } from '@/lib/auth'
import { createAdminClient } from '@/lib/supabase/server'

// POST /api/account/export — generate and return a data export for the authenticated user
export async function POST() {
  const session = await getSessionAccount()
  if (!session) return NextResponse.json({ ok: false, message: 'Unauthorised' }, { status: 401 })

  const supabase = await createAdminClient()

  // Real column names only (several were wrong, which made the profile and
  // interest sections come back empty). The member's own data, without
  // internal moderation/search fields or anyone else's private details.
  const PROFILE_COLUMNS = [
    'id', 'profile_for', 'first_name', 'last_name', 'gender', 'dob', 'religion', 'caste', 'sub_caste',
    'self_gotra', 'maternal_gotra', 'mool', 'gram', 'native_place_id', 'current_loc_id', 'job_loc_id',
    'education_detail', 'degree', 'specialization', 'institution', 'passing_year', 'profession_detail',
    'job_title', 'employer', 'employment_type', 'industry', 'work_type', 'experience_years',
    'height_cm', 'diet', 'smoking', 'drinking', 'marital_status', 'mother_tongue', 'marriage_timeline',
    'about_me', 'family_about', 'family_type', 'managed_by', 'family_values', 'parents_info',
    'siblings_info', 'family_expectations', 'family_introduction', 'visibility', 'discoverable',
    'profile_status', 'profile_complete', 'created_at', 'updated_at',
  ].join(', ')

  const [accountRes, profileRes] = await Promise.all([
    supabase.from('accounts').select('id, mobile, email, role, account_status, created_at').eq('id', session.id).maybeSingle(),
    supabase.from('profiles').select(PROFILE_COLUMNS).eq('account_id', session.id).is('deleted_at', null).maybeSingle(),
  ])

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const profileId: string | null = (profileRes.data as any)?.id ?? null
  const none = Promise.resolve({ data: [] as unknown[] })

  const [
    profilePrivateRes,
    preferencesRes,
    photosRes,
    sharesRes,
    membershipsRes,
    interestsSentRes,
    interestsReceivedRes,
    shortlistsRes,
    blocksRes,
    conversationsRes,
    messagesRes,
    notificationsRes,
    consentsRes,
  ] = await Promise.all([
    profileId
      ? supabase.from('profile_private').select('rashi, nakshatra, mangalik, birth_time, birth_place, kundli_url, contact_mobile, contact_email, contact_relation, address, income_range, income_min_lpa, income_max_lpa, photo_visibility, updated_at').eq('profile_id', profileId).maybeSingle()
      : Promise.resolve({ data: null }),
    profileId ? supabase.from('profile_preferences').select('*').eq('profile_id', profileId).maybeSingle() : Promise.resolve({ data: null }),
    profileId ? supabase.from('profile_photos').select('id, status, is_primary, display_order, created_at').eq('profile_id', profileId).neq('status', 'deleted') : none,
    profileId ? supabase.from('profile_shares').select('label, fields, expires_at, revoked_at, view_count, last_viewed_at, created_at').eq('profile_id', profileId) : none,
    supabase.from('memberships').select('plan, status, started_at, expires_at, grace_until, cancelled_at, created_at').eq('account_id', session.id).order('created_at', { ascending: false }),
    profileId ? supabase.from('interests').select('to_profile, status, message, sent_at, responded_at').eq('from_profile', profileId).limit(1000) : none,
    profileId ? supabase.from('interests').select('from_profile, status, sent_at, responded_at').eq('to_profile', profileId).limit(1000) : none,
    profileId ? supabase.from('shortlists').select('saved_id, saved_at').eq('profile_id', profileId).limit(1000) : none,
    profileId ? supabase.from('blocks').select('blocked_id, reason, created_at').eq('blocker_id', profileId) : none,
    profileId ? supabase.from('conversations').select('id, created_at').or(`profile_a.eq.${profileId},profile_b.eq.${profileId}`).limit(500) : none,
    // Only the messages this member wrote — the other side's words are theirs.
    profileId ? supabase.from('messages').select('conversation_id, body, sent_at').eq('sender_id', profileId).is('deleted_at', null).order('sent_at', { ascending: true }).limit(5000) : none,
    supabase.from('notifications').select('type, title, message, read, created_at').eq('account_id', session.id).order('created_at', { ascending: false }).limit(500),
    supabase.from('legal_consents').select('type, version, consented, created_at, withdrawn_at, withdrawal_reason').eq('account_id', session.id).order('created_at', { ascending: false }),
  ])

  const exportData = {
    exported_at: new Date().toISOString(),
    note: 'This is your personal data export from Mithila Jodi. Handle this file with care.',
    account: accountRes.data ?? null,
    profile: profileRes.data ?? null,
    profile_private: profilePrivateRes.data ?? null,
    partner_preferences: preferencesRes.data ?? null,
    photos: photosRes.data ?? [],
    digital_profile_links: sharesRes.data ?? [],
    memberships: membershipsRes.data ?? [],
    interests_sent: interestsSentRes.data ?? [],
    interests_received: interestsReceivedRes.data ?? [],
    shortlists: shortlistsRes.data ?? [],
    blocked_profiles: blocksRes.data ?? [],
    conversations: conversationsRes.data ?? [],
    messages_written: messagesRes.data ?? [],
    notifications: notificationsRes.data ?? [],
    legal_consents: consentsRes.data ?? [],
  }

  await supabase.from('admin_audit_logs').insert({
    actor_id: session.id,
    action: 'account_data_export',
    target_type: 'account',
    target_id: session.id,
    payload: {},
  })

  return new NextResponse(JSON.stringify(exportData, null, 2), {
    status: 200,
    headers: {
      'Content-Type': 'application/json',
      'Cache-Control': 'no-store',
      'Content-Disposition': 'attachment; filename="mithila-jodi-data-export.json"',
    },
  })
}
