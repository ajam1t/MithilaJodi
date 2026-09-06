import 'server-only'
import { NextResponse } from 'next/server'
import { getSessionAccount } from '@/lib/auth'
import { createAdminClient } from '@/lib/supabase/server'
import { findOwnProfileId } from '@/lib/ownProfile'

/* eslint-disable @typescript-eslint/no-explicit-any */

/**
 * Counts of things waiting on the member, for the nav badges.
 *
 * This exists because a WhatsApp request could sit unanswered indefinitely with
 * nothing anywhere in the UI to say so — the approve buttons live on /interests
 * and that section renders nothing at all when it is empty, so the only way to
 * discover a request was to happen to open that page.
 *
 * Counts only. No names, no ids, nothing that would leak who is interested in
 * whom to a stale or shared cache.
 */
export async function GET() {
  const session = await getSessionAccount()
  if (!session) {
    return NextResponse.json({ ok: true, interests: 0, whatsapp: 0 })
  }

  const admin = await createAdminClient()
  const myProfileId = await findOwnProfileId(admin, session.id)
  if (!myProfileId) {
    return NextResponse.json({ ok: true, interests: 0, whatsapp: 0 })
  }

  const [interestsRes, whatsappRes] = await Promise.all([
    admin
      .from('interests')
      .select('id', { count: 'exact', head: true })
      .eq('to_profile', myProfileId)
      .eq('status', 'sent'),
    admin
      .from('whatsapp_requests')
      .select('id', { count: 'exact', head: true })
      .eq('owner_profile_id', myProfileId)
      .eq('status', 'pending'),
  ])

  return NextResponse.json({
    ok: true,
    interests: (interestsRes as any).count ?? 0,
    whatsapp: (whatsappRes as any).count ?? 0,
  })
}
