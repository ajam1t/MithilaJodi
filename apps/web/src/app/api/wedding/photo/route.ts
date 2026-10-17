import 'server-only'
import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/server'
import { loadPhoto } from '@/lib/wedding/invites.server'
import { PHOTO_SIDES, type PhotoSide } from '@/lib/wedding/photos'

/**
 * GET /api/wedding/photo?s=<slug>&p=bride|groom&v=<version>
 *
 * A bride or groom photo of a live invitation — visible to the same people
 * as the invitation itself: anyone with its link, which the couple agreed to
 * when adding the photo. Gone when the photo is removed or the link closes.
 *
 * Cached on the guest's device only (`private`), so a removed photo is not
 * kept on a shared CDN; `v` changes whenever the photo does.
 */
export async function GET(request: NextRequest) {
  const s = request.nextUrl.searchParams.get('s') ?? ''
  const p = request.nextUrl.searchParams.get('p') ?? ''
  if (!(PHOTO_SIDES as readonly string[]).includes(p)) return new NextResponse(null, { status: 404 })

  const photo = await loadPhoto(await createAdminClient(), s, p as PhotoSide).catch(() => null)
  if (!photo) return new NextResponse(null, { status: 404, headers: { 'Cache-Control': 'no-store' } })

  return new NextResponse(new Uint8Array(photo.bytes), {
    headers: {
      'Content-Type': `image/${photo.type}`,
      'Cache-Control': 'private, max-age=86400',
      ETag: `"${photo.version}"`,
      'X-Content-Type-Options': 'nosniff',
      'X-Robots-Tag': 'noindex',
      'Content-Disposition': 'inline',
    },
  })
}
