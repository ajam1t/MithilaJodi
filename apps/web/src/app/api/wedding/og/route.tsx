import { ImageResponse } from 'next/og'
import type { NextRequest } from 'next/server'
import { decodeInvite } from '@/lib/wedding/codec.server'
import { weddingTheme } from '@/lib/wedding/themes'
import { longDate } from '@/lib/wedding/format'
import { romanize } from '@/lib/wedding/translit'
import { loadBySlug } from '@/lib/wedding/invites.server'
import { createAdminClient } from '@/lib/supabase/server'

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

function Petal({ rotate, color }: { rotate: number; color: string }) {
  return <div style={{ position: 'absolute', width: 34, height: 110, borderRadius: '50%', border: `2px solid ${color}`, transform: `rotate(${rotate}deg)` }} />
}

/** GET /api/wedding/og?d=… or ?s=<slug> — the WhatsApp / social preview card for an invitation link. */
export async function GET(request: NextRequest) {
  const slug = request.nextUrl.searchParams.get('s')
  let d = request.nextUrl.searchParams.get('d')
  if (slug) d = (await loadBySlug(await createAdminClient(), slug).catch(() => null))?.payload ?? null
  const invite = decodeInvite(d)
  const t = weddingTheme(invite?.t ?? 'kohbar')
  const c = invite?.c
  // The image renderer cannot shape Devanagari (conjuncts and vowel signs break),
  // so this card is Latin only: Devanagari names are romanised.
  const bride = romanize(c?.couple.brideName || 'Bride')
  const groom = romanize(c?.couple.groomName || 'Groom')
  const date = c ? longDate(c.wedding.date) : ''
  const venue = romanize(c?.wedding.venueName ?? '')
  const latin = await font('Marcellus', `SHUBH VIVAH ${bride} ${groom} ${date} ${venue} MITHILA JODI & 0123456789`)
  const fonts = latin ? [{ name: 'Marcellus', data: latin, weight: 400 as const }] : []
  const modern = t.id === 'modern-mithila'
  const ink = modern ? t.ink : '#FFF8EC'
  const bg = modern ? 'linear-gradient(180deg, #FFFFFF, #F6F0E6)' : `linear-gradient(160deg, ${t.accent}, ${t.ink})`
  const petal = modern ? `${t.gold}88` : 'rgba(241,213,138,0.45)'

  return new ImageResponse(
    (
      <div style={{ width: '100%', height: '100%', display: 'flex', background: bg, color: ink, fontFamily: 'Marcellus' }}>
        <div style={{ position: 'absolute', top: 22, left: 22, right: 22, bottom: 22, border: `2px solid ${t.gold}`, borderRadius: 18, display: 'flex' }} />
        <div style={{ position: 'absolute', top: 34, left: 34, right: 34, bottom: 34, border: `1px dashed ${t.gold}`, borderRadius: 12, display: 'flex' }} />
        <div style={{ position: 'absolute', left: 1030, top: 320, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          {[0, 45, 90, 135].map(r => <Petal key={r} rotate={r} color={petal} />)}
        </div>
        <div style={{ position: 'absolute', left: 170, top: 310, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          {[0, 45, 90, 135].map(r => <Petal key={r} rotate={r} color={petal} />)}
        </div>
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center', padding: '0 150px' }}>
          <div style={{ fontSize: 30, letterSpacing: 10, color: t.gold }}>SHUBH VIVAH</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 28, marginTop: 14, fontSize: 80, lineHeight: 1.1 }}>
            <span>{bride}</span>
            <span style={{ fontSize: 48, color: t.gold }}>&</span>
            <span>{groom}</span>
          </div>
          {date && <div style={{ marginTop: 24, fontSize: 34 }}>{date}</div>}
          {venue && <div style={{ marginTop: 8, fontSize: 26, opacity: 0.78 }}>{venue}</div>}
          <div style={{ marginTop: 40, fontSize: 22, letterSpacing: 4, color: t.gold }}>MITHILA JODI</div>
        </div>
      </div>
    ),
    {
      width: 1200, height: 630, fonts: fonts.length ? fonts : undefined,
      // A ?d= card is its content, so it never changes; a short link's content can be edited.
      headers: { 'Cache-Control': slug ? 'public, max-age=3600, s-maxage=3600' : 'public, max-age=86400, s-maxage=31536000, immutable' },
    },
  )
}
