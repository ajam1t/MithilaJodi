import 'server-only'
import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/server'
import { getSessionAccount } from '@/lib/auth'
import { filterPhotoViewable } from '@/lib/photoAccess'
import { signPhotos } from '@/lib/photoWeb'
import { getCommunityLabels, labelFor } from '@/lib/communityLabels'

function toDisplayName(firstName: string, lastName: string | null): string {
  if (lastName) return `${firstName} ${lastName}`
  return firstName
}

/** Age in whole years from a YYYY-MM-DD dob string (dob itself is never returned). */
function computeAge(dob: string): number {
  const birth = new Date(dob)
  const now = new Date()
  let age = now.getFullYear() - birth.getFullYear()
  const m = now.getMonth() - birth.getMonth()
  if (m < 0 || (m === 0 && now.getDate() < birth.getDate())) age--
  return age
}

export async function GET() {
  const session = await getSessionAccount()
  if (!session) return NextResponse.json({ ok: false, message: 'Unauthorized' }, { status: 401 })

  const admin = await createAdminClient()

  const { data: myProfile } = await admin
    .from('profiles')
    .select('id')
    .eq('account_id', session.id)
    .is('deleted_at', null)
    .neq('profile_status', 'deleted')
    .limit(1)
    .maybeSingle()

  if (!myProfile) return NextResponse.json({ ok: false, message: 'Profile not found' }, { status: 404 })

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const myId = (myProfile as any).id as string

  const { data: shortlistRows } = await admin
    .from('shortlists')
    .select('saved_id, saved_at')
    .eq('profile_id', myId)
    .order('saved_at', { ascending: false })

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const rows: any[] = shortlistRows ?? []

  const savedIds = rows.map((r) => r.saved_id as string)

  if (savedIds.length === 0) return NextResponse.json({ ok: true, shortlists: [] })

  // Same bar as saving one (shortlists/[profileId]) and the Interests list: a
  // member who has since blocked you (or you them), gone private or hidden, or
  // whose profile or account is gone (deleted, deactivated, suspended, banned)
  // stays in the list only as "Member no longer available" — no name, no photo.
  const [{ data: blk, error: blkError }, { data: profileRows, error: profileError }] = await Promise.all([
    admin
      .from('blocks')
      .select('blocker_id, blocked_id')
      .or(`and(blocker_id.eq.${myId},blocked_id.in.(${savedIds.join(',')})),and(blocked_id.eq.${myId},blocker_id.in.(${savedIds.join(',')}))`),
    admin
      .from('profiles')
      .select('id, first_name, last_name, dob, gender, caste, current_loc_id, deleted_at, profile_status, discoverable, visibility, accounts!inner(account_status, deleted_at)')
      .in('id', savedIds),
  ])

  // Fail closed: an unreadable block list must not be read as "nobody blocked".
  if (blkError || profileError) {
    console.error('[shortlists GET] query error:', (blkError ?? profileError)!.message)
    return NextResponse.json({ ok: false, message: 'Something went wrong — please try again.' }, { status: 503 })
  }

  const blocked = new Set<string>()
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  for (const b of (blk ?? []) as any[]) blocked.add(b.blocker_id === myId ? b.blocked_id : b.blocker_id)

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const live = new Map<string, any>()
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  for (const r of (profileRows ?? []) as any[]) {
    const acct = Array.isArray(r.accounts) ? r.accounts[0] : r.accounts
    if (blocked.has(r.id) || r.deleted_at || r.profile_status !== 'active' || !r.discoverable || r.visibility === 'private') continue
    if (!acct || acct.deleted_at || acct.account_status !== 'active') continue
    live.set(r.id, r)
  }
  const liveIds = [...live.keys()]

  const locMap = new Map<number, string>()
  const photoByProfile = new Map<string, string>()
  if (liveIds.length > 0) {
    const locIds = [...new Set([...live.values()].map(r => r.current_loc_id).filter((id): id is number => id != null))]
    const [labels, { data: locRows }, { data: photoRows }, photoOk] = await Promise.all([
      getCommunityLabels(admin),
      locIds.length > 0 ? admin.from('india_locations').select('id, name_en').in('id', locIds) : Promise.resolve({ data: [] }),
      admin.from('profile_photos').select('profile_id, storage_path').in('profile_id', liveIds).eq('is_primary', true).eq('status', 'approved'),
      // Photo privacy: a connections-only member's photograph is withheld here too.
      filterPhotoViewable(admin, myId, liveIds),
    ])
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    for (const l of (locRows ?? []) as any[]) locMap.set(l.id as number, l.name_en as string)
    for (const r of live.values()) r.caste_label = labelFor(labels, 'caste', r.caste as string | null)

    const pathBy = new Map<string, string>()
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    for (const ph of (photoRows ?? []) as any[]) {
      if (photoOk.has(ph.profile_id) && !pathBy.has(ph.profile_id)) pathBy.set(ph.profile_id, ph.storage_path)
    }
    const paths = [...pathBy.entries()]
    if (paths.length > 0) {
      const { data: signed } = await signPhotos(admin, paths.map(([, path]) => path))
      paths.forEach(([pid], i) => { const url = signed?.[i]?.signedUrl; if (url) photoByProfile.set(pid, url) })
    }
  }

  const shortlists = rows.map((r) => {
    const p = live.get(r.saved_id)
    return {
      saved_at: r.saved_at,
      profile: p
        ? {
            id: r.saved_id as string,
            available: true,
            display_name: toDisplayName(p.first_name, p.last_name ?? null),
            age: p.dob ? computeAge(p.dob as string) : null,
            gender: p.gender as string,
            caste: (p.caste_label as string | null) ?? null,
            current_loc_name: p.current_loc_id != null ? (locMap.get(p.current_loc_id as number) ?? null) : null,
            photo_url: photoByProfile.get(r.saved_id) ?? null,
          }
        : {
            id: r.saved_id as string,
            available: false,
            display_name: 'Member no longer available',
            age: null,
            gender: null,
            caste: null,
            current_loc_name: null,
            photo_url: null,
          },
    }
  })

  return NextResponse.json({ ok: true, shortlists })
}
