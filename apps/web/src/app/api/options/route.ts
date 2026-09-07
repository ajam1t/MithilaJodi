import 'server-only'
import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/server'
import { getSessionAccount } from '@/lib/auth'

// ── GET: public (logged-in) option lists for profile forms ──
// ?types=gotra,mool,religion → { ok, options: { gotra: [{value,label}], ... } }
export async function GET(request: NextRequest) {
  const session = await getSessionAccount()
  if (!session) {
    return NextResponse.json({ ok: false }, { status: 401 })
  }

  const raw = request.nextUrl.searchParams.get('types') ?? ''
  const types = raw
    .split(',')
    .map((t) => t.trim())
    .filter((t) => t.length > 0)

  const options: Record<string, { value: string; label: string }[]> = {}
  for (const t of types) options[t] = []

  if (types.length === 0) {
    return NextResponse.json({ ok: true, options })
  }

  const admin = await createAdminClient()

  const { data, error } = await admin
    .from('community_masters')
    .select('type, value, label_en, sort_order')
    .in('type', types)
    .eq('is_active', true)
    .order('sort_order', { ascending: true })

  if (error) {
    console.error('[options GET] error:', error.message)
    return NextResponse.json({ ok: false }, { status: 500 })
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  ;(data as any[] ?? []).forEach((row) => {
    const type = row.type as string
    if (!options[type]) options[type] = []
    options[type].push({ value: row.value as string, label: row.label_en as string })
  })

  // education_level lives in its own table, not community_masters, because
  // profiles.education_level_id and profile_preferences.pref_education are
  // foreign keys into it. Its `value` is therefore the numeric id as a string.
  if (types.includes('education_level')) {
    const { data: eduRows, error: eduError } = await admin
      .from('education_levels')
      .select('id, label_en, sort_order')
      .eq('is_active', true)
      .order('sort_order', { ascending: true })

    if (eduError) {
      console.error('[options GET] education_levels error:', eduError.message)
    } else {
      options.education_level = (eduRows ?? []).map((row) => ({
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        value: String((row as any).id),
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        label: (row as any).label_en as string,
      }))
    }
  }

  // Mool → gotra. A Maithil family generally knows its mool and reads the gotra
  // off it, so the form uses this to fix or narrow the gotra once a mool is
  // chosen rather than asking twice and risking a contradiction. Several mools
  // (Brahmapura sits under five gotras) map to more than one, which is why this
  // is a list per mool and not a single value.
  let moolGotra: Record<string, string[]> | undefined
  if (types.includes('mool')) {
    const { data: mapRows, error: mapError } = await admin
      .from('maithil_mool_gotra')
      .select('mool_value, gotra_value')

    if (mapError) {
      // Not fatal: without the map the member simply picks the gotra by hand.
      console.error('[options GET] mool→gotra error:', mapError.message)
    } else {
      moolGotra = {}
      for (const row of (mapRows ?? [])) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const r = row as any
        const mool = r.mool_value as string
        ;(moolGotra[mool] ??= []).push(r.gotra_value as string)
      }
    }
  }

  return NextResponse.json({ ok: true, options, ...(moolGotra ? { moolGotra } : {}) })
}
