/**
 * An invitation, carried entirely in its `d` code. Long links carry it in the URL;
 * short links (/Invitation/<slug>) keep the same code server-side for 180 days.
 *
 * Format of the `d` parameter: one marker character, then base64url.
 *   'z' — raw DEFLATE of the UTF-8 JSON (browsers with CompressionStream)
 *   'j' — the UTF-8 JSON itself (older browsers; longer but equivalent)
 * The JSON is `compact()`-ed first, so defaults never travel in the link.
 * Encoding happens in the browser (this file); decoding happens on the server
 * (codec.server.ts), which validates everything before it is rendered.
 */
import { compact, type Invite } from './schema'

/** Comfortably inside URL limits for WhatsApp, browsers and the hosting edge. */
export const MAX_LINK_PAYLOAD = 7000

export function toBase64Url(bytes: Uint8Array): string {
  let bin = ''
  for (let i = 0; i < bytes.length; i += 0x8000) bin += String.fromCharCode(...bytes.subarray(i, i + 0x8000))
  return btoa(bin).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
}

async function deflateRaw(bytes: Uint8Array): Promise<Uint8Array | null> {
  if (typeof CompressionStream === 'undefined') return null
  try {
    const stream = new Blob([bytes as Uint8Array<ArrayBuffer>]).stream().pipeThrough(new CompressionStream('deflate-raw' as CompressionFormat))
    return new Uint8Array(await new Response(stream).arrayBuffer())
  } catch {
    return null
  }
}

export async function encodeInvite(invite: Invite): Promise<string> {
  const json = new TextEncoder().encode(JSON.stringify(compact(invite)))
  const z = await deflateRaw(json)
  return z ? `z${toBase64Url(z)}` : `j${toBase64Url(json)}`
}
