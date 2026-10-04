/**
 * An invitation, carried entirely in its link — nothing is stored on a server.
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

/** A readable path segment for the link — only ever cosmetic. */
export function linkName(bride: string, groom: string): string {
  const latin = (s: string) => s.normalize('NFKD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 24)
  const parts = [latin(bride), latin(groom)].filter(Boolean)
  return parts.length ? parts.join('-') : 'shubh-vivah'
}

export function inviteUrl(origin: string, invite: Invite, payload: string): string {
  return `${origin}/wedding/${linkName(invite.c.couple.brideName, invite.c.couple.groomName)}?d=${payload}`
}

export function editUrl(origin: string, payload: string): string {
  return `${origin}/marriage-invitation/premium?d=${payload}`
}
