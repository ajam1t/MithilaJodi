import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/server'

const ALLOWED_REASONS = new Set([
  'General Enquiry',
  'Profile Issue',
  'Verification',
  'Privacy Concern',
  'Report a Profile',
  'Premium / Payment',
  'Technical Issue',
  'Partnership',
  'Feedback',
  'Other',
])

export async function POST(req: NextRequest) {
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
  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return NextResponse.json({ error: 'A valid email address is required.' }, { status: 400 })
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
  } catch {
    return NextResponse.json(
      { error: 'Unable to submit your message right now. Please try again or email us directly.' },
      { status: 500 },
    )
  }
}
