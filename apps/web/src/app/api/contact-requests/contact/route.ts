import 'server-only'
import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/server'
import { getSessionAccount, refuseWhileImpersonating } from '@/lib/auth'
import { loadContactProjection } from '@/lib/contactDetails'
import { blockedBetween, featureOff, isUuid, matchedWith, requestBetween } from '@/lib/memberRequests'

/*
 * GET ?profile_id=… — a matched member's contact projection (number, whose
 * number, email, how they like to be contacted), only to the member whose
 * contact request they approved. Never the address. Every other case is a
 * plain "not shared", so the response says nothing about whether a number
 * exists. Not available while an admin is signed in as the member.
 */

const notShared = () => NextResponse.json({ ok: false, message: 'Contact details have not been shared with you.' }, { status: 404 })
const tryAgain = () => NextResponse.json({ ok: false, message: 'Something went wrong — please try again.' }, { status: 503 })

export async function GET(request: NextRequest) {
  const session = await getSessionAccount()
  if (!session) return NextResponse.json({ ok: false, message: 'Unauthorized' }, { status: 401 })
  const refused = refuseWhileImpersonating(session)
  if (refused) return refused

  const ownerId = request.nextUrl.searchParams.get('profile_id')
  if (!isUuid(ownerId)) return notShared()

  const admin = await createAdminClient()
  const { data: me, error: meError } = await admin
    .from('profiles')
    .select('id')
    .eq('account_id', session.id)
    .is('deleted_at', null)
    .neq('profile_status', 'deleted')
    .order('updated_at', { ascending: false })
    .limit(1)
    .maybeSingle()
  if (meError) return tryAgain()
  if (!me) return notShared()
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const myId = (me as any).id as string

  const row = await requestBetween(admin, 'contact', myId, ownerId)
  if (row === 'off') return featureOff()
  if (row === 'error') return tryAgain()
  if (!row || row.status !== 'approved') return notShared()

  // The approval stands only while they are still a match and neither has
  // blocked the other. Both fail closed.
  const [blocked, matched] = await Promise.all([blockedBetween(admin, myId, ownerId), matchedWith(admin, myId, ownerId)])
  if (blocked === 'error' || matched === 'error') return tryAgain()
  if (blocked || !matched) return notShared()

  // The owner must still be a usable member.
  const { data: owner } = await admin
    .from('profiles')
    .select('account_id, profile_status, accounts!inner(account_status, deleted_at)')
    .eq('id', ownerId)
    .is('deleted_at', null)
    .maybeSingle()
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const o = owner as any
  const acct = o ? (Array.isArray(o.accounts) ? o.accounts[0] : o.accounts) : null
  if (!o || o.profile_status === 'deleted' || o.profile_status === 'deactivated' || !acct || acct.deleted_at || acct.account_status !== 'active') {
    return notShared()
  }

  const projection = await loadContactProjection(admin, ownerId)
  if (!projection) return tryAgain()

  return NextResponse.json(
    { ok: true, contact: { ...projection.contact, address: null }, prefs: projection.prefs },
    { headers: { 'Cache-Control': 'private, no-store' } },
  )
}
