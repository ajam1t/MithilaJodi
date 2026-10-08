import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/server'
import { rateLimit } from '@/lib/astrology/server/rateLimit'

const ALLOWED_REASONS = new Set([
  'General Enquiry',
  'Profile Issue',
  'Verification',
  'Privacy Concern',
  'Report a Profile',
  'Account & Access',
  'Technical Issue',
  'Partnership',
  'Feedback',
  'Other',
])

export async function POST(req: NextRequest) {
  // Unauthenticated form: cap submissions per IP so it cannot be used to flood
  // the support inbox.
  const limited = rateLimit(req, 'contact', { limit: 5, windowMs: 30 * 60_000 })
  if (!limited.ok) {
    return NextResponse.json({ error: 'You have sent several messages already. Please try again a little later, or email us directly.' }, { status: 429 })
  }

  let body: Record<string, unknown>
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid request body.' }, { status: 400 })
  }

  const fullName = String(body.full_name ?? '').trim()
  const email    = String(body.email    ?? '').trim().toLowerCase()
  const mobile   = String(body.mobile   ?? '').trim() || null
  const reason   = String(body.reason   ?? '').trim()
  const message  = String(body.message  ?? '').trim()

  if (!fullName || fullName.length < 2 || fullName.length > 100) {
    return NextResponse.json({ error: 'Full name is required (2–100 characters).' }, { status: 400 })
  }
  if (!email || email.length > 200 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return NextResponse.json({ error: 'A valid email address is required.' }, { status: 400 })
  }
  if (mobile && (mobile.length > 20 || !/^[+\d\s()-]+$/.test(mobile))) {
    return NextResponse.json({ error: 'Please enter a valid mobile number, or leave it blank.' }, { status: 400 })
  }
  if (!ALLOWED_REASONS.has(reason)) {
    return NextResponse.json({ error: 'Please select a valid reason.' }, { status: 400 })
  }
  if (!message || message.length < 10 || message.length > 2000) {
    return NextResponse.json({ error: 'Message must be between 10 and 2000 characters.' }, { status: 400 })
  }

  const ip = req.headers.get('x-forwarded-for')?.split(',')[0].trim() ?? null

  try {
    const admin = await createAdminClient()
    const { error } = await admin.from('contact_submissions').insert({
      full_name:  fullName,
      email,
      mobile,
      reason,
      message,
      ip_address: ip,
    })
    if (error) throw error
    return NextResponse.json({ ok: true })
  } catch (err) {
    // Previously a bare `catch {}` with no logging: every contact-form failure
    // (DB down, schema drift, constraint violation) was silently invisible, so
    // the support channel could be broken indefinitely with no signal.
    console.error('[contact POST] submission failed:', err instanceof Error ? err.message : err)
    return NextResponse.json(
      { ok: false, error: 'Unable to submit your message right now. Please try again or email us directly.' },
      { status: 500 },
    )
  }
}
