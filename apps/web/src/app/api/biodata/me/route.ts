import 'server-only'
import { NextResponse } from 'next/server'
import { getSessionAccount } from '@/lib/auth'
import { loadOwnBiodata } from '@/lib/biodataProfile.server'

/**
 * The signed-in member's own Digital Profile, mapped to biodata form fields,
 * for the maker at /marriage-biodata to prefill. Takes no parameters: whose
 * profile is decided by the session alone. Read-only — nothing typed into the
 * biodata is ever written back.
 */
export const dynamic = 'force-dynamic'

const PRIVATE = { 'Cache-Control': 'private, no-store' }

export async function GET() {
  const session = await getSessionAccount()
  if (!session) return NextResponse.json({ ok: false, reason: 'guest' }, { status: 401, headers: PRIVATE })
  try {
    const result = await loadOwnBiodata(session.id)
    if (!result) return NextResponse.json({ ok: false, reason: 'no_profile' }, { status: 404, headers: PRIVATE })
    return NextResponse.json({ ok: true, data: result.data, hasPhoto: result.hasPhoto }, { headers: PRIVATE })
  } catch (err) {
    console.error('[biodata/me] load failed:', err instanceof Error ? err.message : err)
    return NextResponse.json({ ok: false, reason: 'error' }, { status: 500, headers: PRIVATE })
  }
}
