import { NextResponse, type NextRequest } from 'next/server'
import { getSetting } from '@/lib/siteSettings'

/*
 * /go/whatsapp, /go/instagram, /go/youtube — the public site's official links.
 * Each click reads the current value from Admin → Community, so a full
 * WhatsApp community can be replaced without a deployment. A disabled
 * community sends people to the contact page instead of a dead invite.
 */

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest, { params }: { params: Promise<{ name: string }> }) {
  const { name } = await params
  const headers = { 'Cache-Control': 'no-store', 'X-Robots-Tag': 'noindex' }

  if (name === 'whatsapp') {
    const { value } = await getSetting('whatsapp_community')
    const target = value.enabled ? value.url : new URL('/contact?community=paused', request.url).toString()
    return NextResponse.redirect(target, { status: 302, headers })
  }
  if (name === 'instagram' || name === 'youtube') {
    const { value } = await getSetting('social_links')
    return NextResponse.redirect(value[name], { status: 302, headers })
  }
  return new NextResponse('Not found', { status: 404, headers })
}
