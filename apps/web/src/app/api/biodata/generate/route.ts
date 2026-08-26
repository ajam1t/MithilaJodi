import 'server-only'
import { NextRequest, NextResponse } from 'next/server'
import { getSessionAccount } from '@/lib/auth'
import { createAdminClient } from '@/lib/supabase/server'

const VALID_FIELDS = [
  'name', 'age', 'gender', 'religion', 'caste', 'sub_caste',
  'self_gotra', 'maternal_gotra', 'mool', 'gram',
  'height', 'diet', 'smoking', 'drinking', 'marital_status', 'mother_tongue',
  'education', 'profession',
  'current_location', 'native_place',
  'about_me', 'family_about', 'family',
  'contact', 'photo', 'income', 'astrology', 'kundli', 'address',
]

const VALID_LANGUAGES = ['en', 'hi', 'mai', 'sa']

export async function POST(request: NextRequest) {
  const session = await getSessionAccount()
  if (!session) return NextResponse.json({ ok: false, message: 'Unauthorized' }, { status: 401 })

  let body: Record<string, unknown>
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ ok: false, message: 'Invalid JSON' }, { status: 400 })
  }

  const { template_id, language, fields_included } = body as {
    template_id?: number
    language?: string
    fields_included?: string[]
  }

  if (!template_id || typeof template_id !== 'number') {
    return NextResponse.json({ ok: false, message: 'template_id is required' }, { status: 400 })
  }
  if (!language || !VALID_LANGUAGES.includes(language)) {
    return NextResponse.json({ ok: false, message: 'Invalid language' }, { status: 400 })
  }
  if (!Array.isArray(fields_included) || fields_included.length === 0) {
    return NextResponse.json({ ok: false, message: 'At least one field must be selected' }, { status: 400 })
  }
  const sanitizedFields = fields_included.filter(f => VALID_FIELDS.includes(f))
  if (sanitizedFields.length === 0) {
    return NextResponse.json({ ok: false, message: 'No valid fields selected' }, { status: 400 })
  }

  const admin = await createAdminClient()

  // Validate template exists
  const { data: template } = await admin
    .from('biodata_templates')
    .select('id')
    .eq('id', template_id)
    .eq('active', true)
    .maybeSingle()
  if (!template) {
    return NextResponse.json({ ok: false, message: 'Template not found' }, { status: 404 })
  }

  // Get profile
  const { data: profile } = await admin
    .from('profiles')
    .select('id, profile_status')
    .eq('account_id', session.id)
    .neq('profile_status', 'deleted')
    .is('deleted_at', null)
    .maybeSingle()

  if (!profile) {
    return NextResponse.json({ ok: false, message: 'Profile not found' }, { status: 404 })
  }
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  if ((profile as any).profile_status !== 'active') {
    return NextResponse.json(
      { ok: false, message: 'Profile must be active to generate biodata' },
      { status: 403 }
    )
  }

  // Insert generation record — status 'ready' (browser renders PDF)
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()
  const { data: gen } = await admin
    .from('biodata_generations')
    .insert({
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      profile_id: (profile as any).id,
      template_id,
      language,
      fields_included: sanitizedFields,
      status: 'ready',
      expires_at: expiresAt,
      completed_at: new Date().toISOString(),
    })
    .select('id')
    .maybeSingle()

  if (!gen) {
    return NextResponse.json({ ok: false, message: 'Could not create generation record' }, { status: 500 })
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return NextResponse.json({ ok: true, generation_id: (gen as any).id }, { status: 201 })
}
