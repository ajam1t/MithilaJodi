import { ImageResponse } from 'next/og'

export const runtime = 'nodejs'

async function font(family: string, text: string): Promise<ArrayBuffer | null> {
  try {
    const css = await (await fetch(`https://fonts.googleapis.com/css2?family=${family}&text=${encodeURIComponent(text)}`, { cache: 'force-cache' })).text()
    const url = css.match(/src: url\((.+?)\) format\('(?:opentype|truetype)'\)/)?.[1]
    return url ? await (await fetch(url, { cache: 'force-cache' })).arrayBuffer() : null
  } catch {
    return null
  }
}

const LINES = ['MITHILA JODI', 'Digital Profile', 'Your story. Your roots. Your future.', 'A shareable matrimonial profile for Maithil families']

/** GET /api/og/digital-profile — the social card for the /digital-profile landing page. */
export async function GET() {
  const latin = await font('Marcellus', LINES.join(' '))
  const fonts = latin ? [{ name: 'Marcellus', data: latin, weight: 400 as const }] : []
  return new ImageResponse(
    (
      <div style={{ width: '100%', height: '100%', display: 'flex', background: 'linear-gradient(160deg, #8E1A2C, #5A0E19)', color: '#FFF8EC', fontFamily: 'Marcellus' }}>
        <div style={{ position: 'absolute', top: 24, left: 24, right: 24, bottom: 24, border: '2px solid #C89B45', borderRadius: 20, display: 'flex' }} />
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center', padding: '0 120px' }}>
          <div style={{ fontSize: 28, letterSpacing: 12, color: '#E7C877' }}>{LINES[0]}</div>
          <div style={{ marginTop: 18, fontSize: 104, lineHeight: 1.05 }}>{LINES[1]}</div>
          <div style={{ marginTop: 22, fontSize: 40, fontStyle: 'italic', color: '#F1D58A' }}>{LINES[2]}</div>
          <div style={{ marginTop: 36, width: 140, height: 2, background: '#C89B45', display: 'flex' }} />
          <div style={{ marginTop: 24, fontSize: 28, opacity: 0.85 }}>{LINES[3]}</div>
        </div>
      </div>
    ),
    { width: 1200, height: 630, fonts: fonts.length ? fonts : undefined, headers: { 'Cache-Control': 'public, max-age=86400, s-maxage=604800' } },
  )
}
