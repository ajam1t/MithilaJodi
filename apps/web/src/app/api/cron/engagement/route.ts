import 'server-only'
import { NextRequest, NextResponse } from 'next/server'
import { timingSafeEqual } from 'crypto'
import { createAdminClient } from '@/lib/supabase/server'
import { runDue } from '@/lib/engagement/journey'

/**
 * GET /api/cron/engagement — sends every journey message that is due.
 *
 * Called by Vercel Cron (vercel.json, daily at 09:00 India time), which sends
 * `Authorization: Bearer $CRON_SECRET`. Without CRON_SECRET set the endpoint
 * refuses everything, so it can never be triggered by a stranger. Deliveries
 * are also picked up between runs by member traffic (lib/engagement/journey
 * maybeRunDue); both paths are idempotent.
 */
export const maxDuration = 60

export async function GET(request: NextRequest) {
  const secret = process.env.CRON_SECRET
  const got = request.headers.get('authorization') ?? ''
  const want = `Bearer ${secret}`
  if (!secret || got.length !== want.length || !timingSafeEqual(Buffer.from(got), Buffer.from(want))) {
    return NextResponse.json({ ok: false }, { status: 401 })
  }
  const admin = await createAdminClient()
  let total = { checked: 0, sent: 0, failed: 0, stopped: 0, completed: 0 }
  // A few batches, so a large backlog still drains within one invocation.
  for (let i = 0; i < 5; i++) {
    const r = await runDue(admin, 60)
    if ('paused' in r && r.paused) return NextResponse.json({ ok: true, paused: true })
    total = { checked: total.checked + r.checked, sent: total.sent + r.sent, failed: total.failed + r.failed, stopped: total.stopped + r.stopped, completed: total.completed + r.completed }
    if (r.checked < 60) break
  }
  return NextResponse.json({ ok: true, ...total })
}
