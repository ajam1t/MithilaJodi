import 'server-only'
import { NextResponse } from 'next/server'
import { getPublicShowcaseProfiles } from '@/lib/publicProfiles'

// PUBLIC endpoint — NO authentication. Never returns 401. Delegates to the
// shared server-side projection so the API and the /explore SSR page return the
// exact same privacy-safe allowlist (surname masked, no dob/contact/free-text).
export async function GET() {
  try {
    const results = await getPublicShowcaseProfiles()
    return NextResponse.json({ ok: true, results })
  } catch (err) {
    console.error('[public/profiles GET] error:', err)
    return NextResponse.json({ ok: false, message: 'Failed to load profiles' }, { status: 500 })
  }
}
