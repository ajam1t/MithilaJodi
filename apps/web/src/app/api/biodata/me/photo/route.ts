import 'server-only'
import { getSessionAccount } from '@/lib/auth'
import { loadOwnPhoto } from '@/lib/biodataProfile.server'

/**
 * The signed-in member's own primary photo, streamed through so no storage
 * URL — signed or not — reaches the browser. Used as the default biodata photo.
 */
export const dynamic = 'force-dynamic'

export async function GET() {
  const session = await getSessionAccount()
  if (!session) return new Response(null, { status: 401, headers: { 'Cache-Control': 'private, no-store' } })
  const photo = await loadOwnPhoto(session.id).catch(() => null)
  if (!photo) return new Response(null, { status: 404, headers: { 'Cache-Control': 'private, no-store' } })
  return new Response(photo.bytes, {
    headers: { 'Content-Type': photo.type, 'Cache-Control': 'private, no-store', 'X-Content-Type-Options': 'nosniff' },
  })
}
