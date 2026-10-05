import { ImageResponse } from 'next/og'
import type { NextRequest } from 'next/server'
import { createAdminClient } from '@/lib/supabase/server'
import { loadSharePreviewName } from '@/lib/profileShare'
import { romanize } from '@/lib/wedding/translit'

export const runtime = 'nodejs'

/** Just the glyphs this card needs, as TrueType (the renderer cannot read WOFF2). */
async function font(family: string, text: string): Promise<ArrayBuffer | null> {
  try {
    const css = await (await fetch(`https://fonts.googleapis.com/css2?family=${family}&text=${encodeURIComponent(text)}`, { cache: 'force-cache' })).text()
    const url = css.match(/src: url\((.+?)\) format\('(?:opentype|truetype)'\)/)?.[1]
    return url ? await (await fetch(url, { cache: 'force-cache' })).arrayBuffer() : null
  } catch {
    return null
  }
}

/**
 * GET /api/p/<token>/og — the link card for a Digital Profile.
 *
 * Name and brand only: never a photo, age, place or anything else, because
 * the card outlives the link on WhatsApp's CDN. Without the owner's consent
 * (or for a dead link) it is the same card for everyone. Latin only — the
 * renderer cannot shape Devanagari — so a Devanagari name is romanised.
 */
export async function GET(_request: NextRequest, { params }: { params: Promise<{ token: string }> }) {
  const { token } = await params
  let name: string | null = null
  try {
    name = await loadSharePreviewName(await createAdminClient(), token)
  } catch { name = null }
  const shown = name ? romanize(name).slice(0, 40) : null

  const title = shown ?? 'A Digital Profile'
  const latin = await font('Marcellus', `${title} MITHILA JODI DIGITAL PROFILE Where tradition meets love. shared with you`)
  const fonts = latin ? [{ name: 'Marcellus', data: latin, weight: 400 as const }] : []

  return new ImageResponse(
    (
      <div style={{ width: '100%', height: '100%', display: 'flex', background: 'linear-gradient(160deg, #8E1A2C, #5A0E19)', color: '#FFF8EC', fontFamily: 'Marcellus' }}>
        <div style={{ position: 'absolute', top: 24, left: 24, right: 24, bottom: 24, border: '2px solid #C89B45', borderRadius: 20, display: 'flex' }} />
        <div style={{ position: 'absolute', top: 38, left: 38, right: 38, bottom: 38, border: '1px dashed rgba(231,200,119,0.6)', borderRadius: 14, display: 'flex' }} />
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center', padding: '0 140px' }}>
          <div style={{ fontSize: 26, letterSpacing: 10, color: '#E7C877' }}>MITHILA JODI</div>
          <div style={{ marginTop: 26, fontSize: shown ? 92 : 76, lineHeight: 1.08 }}>{title}</div>
          <div style={{ marginTop: 22, fontSize: 34, color: '#F1D58A' }}>{shown ? 'Mithila Jodi Digital Profile' : 'shared with you'}</div>
          <div style={{ marginTop: 40, width: 120, height: 2, background: '#C89B45', display: 'flex' }} />
          <div style={{ marginTop: 22, fontSize: 26, fontStyle: 'italic', opacity: 0.82 }}>Where tradition meets love.</div>
        </div>
      </div>
    ),
    {
      width: 1200, height: 630, fonts: fonts.length ? fonts : undefined,
      // Short: a revoked link should stop yielding its named card here quickly.
      headers: { 'Cache-Control': 'public, max-age=600, s-maxage=600' },
    },
  )
}
