import 'server-only'
import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/server'
import { getSessionAccount } from '@/lib/auth'

type RouteContext = { params: Promise<{ profileId: string }> }

export async function POST(_request: NextRequest, { params }: RouteContext) {
  const session = await getSessionAccount()
  if (!session) return NextResponse.json({ ok: false, message: 'Unauthorized' }, { status: 401 })

  const { profileId } = await params

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

  if (myId === profileId) {
    return NextResponse.json({ ok: false, message: 'Cannot shortlist yourself' }, { status: 400 })
  }

  if (!/^[0-9a-f-]{36}$/i.test(profileId)) return NextResponse.json({ ok: false, message: 'Profile not found' }, { status: 404 })

  // Same bar as viewing or sending an interest: only a live, discoverable
  // profile, with no block either way. Otherwise the shortlist would reveal
  // the name of a hidden, private, suspended or blocking member.
  const [{ data: targetProfile }, { data: blk }] = await Promise.all([
    admin
      .from('profiles')
      .select('id, accounts!inner(account_status, deleted_at)')
      .eq('id', profileId)
      .is('deleted_at', null)
      .eq('profile_status', 'active')
      .eq('discoverable', true)
      .maybeSingle(),
    admin.from('blocks').select('blocker_id')
      .or(`and(blocker_id.eq.${myId},blocked_id.eq.${profileId}),and(blocker_id.eq.${profileId},blocked_id.eq.${myId})`)
      .limit(1),
  ])
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const tAcct = (targetProfile as any)?.accounts
  const acct = Array.isArray(tAcct) ? tAcct[0] : tAcct
  if (!targetProfile || !acct || acct.deleted_at || acct.account_status !== 'active' || (blk ?? []).length > 0) {
    return NextResponse.json({ ok: false, message: 'Profile not found' }, { status: 404 })
  }

  const { error } = await admin
    .from('shortlists')
    .upsert({ profile_id: myId, saved_id: profileId }, { onConflict: 'profile_id,saved_id' })

  if (error) {
    console.error('[shortlists POST] upsert error:', error.message)
    return NextResponse.json({ ok: false, message: 'Failed to save shortlist' }, { status: 500 })
  }

  return NextResponse.json({ ok: true })
}

export async function DELETE(_request: NextRequest, { params }: RouteContext) {
  const session = await getSessionAccount()
  if (!session) return NextResponse.json({ ok: false, message: 'Unauthorized' }, { status: 401 })

  const { profileId } = await params

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

  const { error } = await admin
    .from('shortlists')
    .delete()
    .eq('profile_id', myId)
    .eq('saved_id', profileId)

  if (error) {
    console.error('[shortlists DELETE] error:', error.message)
    return NextResponse.json({ ok: false, message: 'Failed to remove shortlist' }, { status: 500 })
  }

  return NextResponse.json({ ok: true })
}
