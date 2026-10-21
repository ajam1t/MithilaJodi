import 'server-only'
import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/server'
import { audit, requireAdminApi } from '@/lib/adminAuth'
import { WEB_BUCKET, isHeicPath, makeWebCopy } from '@/lib/photoWeb'

export const maxDuration = 60

const BATCH = 12

/**
 * Backfill web-sized copies (lib/photoWeb) for photos uploaded before they
 * existed. Each call makes up to BATCH copies and says how many remain; the
 * Storage page calls it until none do. Originals are only read, never changed.
 * GET reports progress without making anything.
 */
async function missing() {
  const admin = await createAdminClient()
  const { data: rows } = await admin.from('profile_photos').select('storage_path').neq('status', 'deleted').not('storage_path', 'is', null)
  const paths = [...new Set((rows ?? []).map(r => r.storage_path as string).filter(Boolean))]
  const lacking: string[] = []
  // Stock sharp cannot read most HEIC, so trying those every call would fill
  // each batch with the same failures and the backfill would never finish.
  // They are counted apart; signPhotos never serves a HEIC original.
  let heic = 0
  for (let i = 0; i < paths.length; i += 100) {
    const chunk = paths.slice(i, i + 100)
    const { data, error } = await admin.storage.from(WEB_BUCKET).createSignedUrls(chunk, 60)
    chunk.forEach((p, k) => {
      if (!error && data?.[k]?.signedUrl) return
      if (isHeicPath(p)) heic++
      else lacking.push(p)
    })
  }
  return { admin, total: paths.length, lacking, heic }
}

export async function GET() {
  const guard = await requireAdminApi('manage_settings')
  if (guard.error) return guard.error
  const { total, lacking, heic } = await missing()
  return NextResponse.json({ ok: true, total, remaining: lacking.length, heic })
}

export async function POST(request: NextRequest) {
  const guard = await requireAdminApi('manage_settings')
  if (guard.error) return guard.error
  const { admin, total, lacking, heic } = await missing()
  let made = 0, failed = 0
  for (const p of lacking.slice(0, BATCH)) {
    // makeWebCopy never throws; the catch only guards a failure outside it.
    try {
      if (await makeWebCopy(admin, p)) made++
      else failed++
    } catch { failed++ }
  }
  if (made > 0) await audit(guard.session.id, 'storage_web_copies_made', { type: 'storage_object', id: null }, { bucket: WEB_BUCKET, made, failed }, request)
  // A non-HEIC photo sharp cannot read keeps failing; it is served as the original.
  return NextResponse.json({ ok: true, total, made, failed, heic, remaining: Math.max(0, lacking.length - made) })
}
