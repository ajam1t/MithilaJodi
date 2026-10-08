import 'server-only'
import { NextRequest, NextResponse } from 'next/server'
import { getSessionAccount } from '@/lib/auth'
import { createAdminClient } from '@/lib/supabase/server'
import type { ConsentType } from '@/types/database'

const VALID_TYPES: ConsentType[] = ['terms', 'privacy', 'data_processing', 'marketing', 'third_party_sharing']

// GET /api/legal/consents — list the user's consent records
export async function GET() {
  const session = await getSessionAccount()
  if (!session) return NextResponse.json({ ok: false, message: 'Unauthorised' }, { status: 401 })

  const supabase = await createAdminClient()
  const { data, error } = await supabase
    .from('legal_consents')
    .select('id, type, version, consented, ip_address, created_at, withdrawn_at, withdrawal_reason')
    .eq('account_id', session.id)
    .order('created_at', { ascending: false })

  if (error) {
    console.error('[legal/consents] db error:', error.message)
    return NextResponse.json({ ok: false, message: 'Could not load or save your consent. Please try again.' }, { status: 500 })
  }
  return NextResponse.json({ ok: true, consents: data ?? [] })
}

// POST /api/legal/consents — record a new consent
export async function POST(request: NextRequest) {
  const session = await getSessionAccount()
  if (!session) return NextResponse.json({ ok: false, message: 'Unauthorised' }, { status: 401 })

  let body: { type?: unknown }
  try { body = await request.json() } catch { return NextResponse.json({ ok: false, message: 'Invalid request body' }, { status: 400 }) }

  const { type } = body
  if (!type || !VALID_TYPES.includes(type as ConsentType)) {
    return NextResponse.json({ ok: false, message: 'Invalid consent type' }, { status: 400 })
  }

  const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? null
  const ua = request.headers.get('user-agent') ?? null
  const version = process.env.TERMS_VERSION ?? '1.0'

  const supabase = await createAdminClient()
  const { error } = await supabase
    .from('legal_consents')
    .insert({
      account_id: session.id,
      type: type as ConsentType,
      version,
      consented: true,
      ip_address: ip,
      user_agent: ua,
    })

  if (error) {
    console.error('[legal/consents] db error:', error.message)
    return NextResponse.json({ ok: false, message: 'Could not load or save your consent. Please try again.' }, { status: 500 })
  }
  return NextResponse.json({ ok: true })
}
