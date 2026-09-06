import 'server-only'
import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/server'
import { getSessionAccount } from '@/lib/auth'

const VALID_STATUSES = ['open', 'under_review', 'actioned', 'dismissed'] as const
type ReportStatus = (typeof VALID_STATUSES)[number]

export async function GET(request: NextRequest) {
  const session = await getSessionAccount()
  if (!session || (session.role !== 'admin' && session.role !== 'moderator')) {
    return NextResponse.json({ ok: false }, { status: 403 })
  }

  const { searchParams } = new URL(request.url)
  const rawStatus = searchParams.get('status') ?? 'open'
  const status: ReportStatus = (VALID_STATUSES as readonly string[]).includes(rawStatus)
    ? (rawStatus as ReportStatus)
    : 'open'

  const admin = await createAdminClient()

  const { data: reports, error } = await admin
    .from('reports')
    .select('id, reporter_id, reported_id, reason, notes, status, review_notes, created_at')
    .eq('status', status)
    .order('created_at')
    .limit(30)

  if (error) {
    console.error('[admin/reports GET] query error:', error.message)
    return NextResponse.json({ ok: false }, { status: 500 })
  }

  if (!reports || reports.length === 0) {
    return NextResponse.json({ ok: true, reports: [] })
  }

  const allProfileIds = [
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    ...new Set((reports as any[]).flatMap((r) => [r.reporter_id, r.reported_id].filter(Boolean))),
  ]

  const { data: profileRows } = await admin
    .from('profiles')
    .select('id, first_name, last_name')
    .in('id', allProfileIds)

  const nameMap: Record<string, string> = {}
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  ;(profileRows as any[] ?? []).forEach((p) => {
    nameMap[p.id] = [p.first_name, p.last_name].filter(Boolean).join(' ')
  })

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const result = (reports as any[]).map((r) => ({
    id: r.id,
    reason: r.reason,
    notes: r.notes,
    status: r.status,
    review_notes: r.review_notes,
    created_at: r.created_at,
    reporter: r.reporter_id ? { id: r.reporter_id, name: nameMap[r.reporter_id] ?? null } : null,
    reported: r.reported_id ? { id: r.reported_id, name: nameMap[r.reported_id] ?? null } : null,
  }))

  return NextResponse.json({ ok: true, reports: result })
}
