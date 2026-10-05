import 'server-only'
import { NextRequest, NextResponse } from 'next/server'
import { getSessionAccount } from '@/lib/auth'
import { createAdminClient } from '@/lib/supabase/server'
import { findOwnProfileId } from '@/lib/ownProfile'

/* eslint-disable @typescript-eslint/no-explicit-any */

/**
 * Count one open of a Digital Profile link.
 *
 * Sent by the page itself once it has rendered in a real browser, rather than
 * counted during the server render. That is what makes the number honest:
 *   • WhatsApp, Facebook and other link-preview fetchers download the page to
 *     build the card but never run its script, so a link pasted into a group
 *     no longer reads as "opened" before anyone has tapped it;
 *   • the owner checking their own link is not counted;
 *   • the page dedupes reloads within a tab, and the database function
 *     dedupes the same browser within 30 minutes.
 *
 * Nothing about the visitor is stored except an optional random id their own
 * browser generated (see the migration). Always answers 204 — a counting
 * failure must never surface to someone reading a profile.
 */

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
const BOT = /bot|crawl|spider|slurp|preview|facebookexternalhit|whatsapp|headless|lighthouse/i

const done = () => new NextResponse(null, { status: 204 })

export async function POST(request: NextRequest, { params }: { params: Promise<{ token: string }> }) {
  const { token } = await params
  if (!token || token.length < 16 || token.length > 64) return done()
  if (BOT.test(request.headers.get('user-agent') ?? '')) return done()

  let visitor: string | null = null
  try {
    const body = await request.json()
    if (typeof body?.visitor === 'string' && UUID.test(body.visitor)) visitor = body.visitor
  } catch { /* no body is fine */ }

  try {
    const admin = await createAdminClient()

    // The owner previewing their own link is not an open.
    const session = await getSessionAccount().catch(() => null)
    if (session) {
      const { data: share } = await admin.from('profile_shares').select('profile_id').eq('token', token).maybeSingle()
      if (share && (await findOwnProfileId(admin, session.id)) === (share as any).profile_id) return done()
    }

    const { error } = await admin.rpc('record_share_open', { p_token: token, p_visitor: visitor })
    if (error) {
      // Before the activity migration is applied, keep the plain counter going.
      await admin.rpc('record_share_view', { p_token: token })
    }
  } catch (err) {
    console.error('[p/open]', err)
  }
  return done()
}
