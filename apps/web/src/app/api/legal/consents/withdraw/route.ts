import 'server-only'
import { NextRequest, NextResponse } from 'next/server'
import { getSessionAccount } from '@/lib/auth'
import { createAdminClient } from '@/lib/supabase/server'
import type { ConsentType } from '@/types/database'

// Only optional consents may be withdrawn
const WITHDRAWABLE: ConsentType[] = ['marketing', 'third_party_sharing']

export async function POST(request: NextRequest) {
  const session = await getSessionAccount()
  if (!session) return NextResponse.json({ ok: false, message: 'Unauthorised' }, { status: 401 })

  let body: { type?: unknown; reason?: unknown }
  try { body = await request.json() } catch { return NextResponse.json({ ok: false, message: 'Invalid request body' }, { status: 400 }) }

  const { type, reason } = body
  if (!type || !WITHDRAWABLE.includes(type as ConsentType)) {
    return NextResponse.json({ ok: false, message: 'Only marketing and third_party_sharing consents may be withdrawn' }, { status: 400 })
  }

  const supabase = await createAdminClient()

  // Find the most recent active consent record for this type
  const { data: existing } = await supabase
    .from('legal_consents')
    .select('id')
    .eq('account_id', session.id)
    .eq('type', type as ConsentType)
    .eq('consented', true)
    .is('withdrawn_at', null)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle()

  if (!existing) {
    return NextResponse.json({ ok: false, message: 'No active consent found for this type' }, { status: 404 })
  }

  const { error } = await supabase
    .from('legal_consents')
    .update({
      withdrawn_at: new Date().toISOString(),
      withdrawal_reason: typeof reason === 'string' ? reason.trim().slice(0, 500) || null : null,
    })
    .eq('id', existing.id)

  if (error) {
    console.error('[legal/consents/withdraw] db error:', error.message)
    return NextResponse.json({ ok: false, message: 'Could not record the withdrawal. Please try again.' }, { status: 500 })
  }
  return NextResponse.json({ ok: true })
}
