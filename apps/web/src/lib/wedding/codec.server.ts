import 'server-only'
import { inflateRawSync } from 'node:zlib'
import { inviteSchema, type Invite } from './schema'
import { MAX_LINK_PAYLOAD } from './codec'

/**
 * Read an invitation from its link. Returns null for anything malformed,
 * oversized or failing the schema — it is never rendered half-validated.
 * The output limit guards against a tiny payload that inflates to megabytes.
 */
export function decodeInvite(d: string | null | undefined): Invite | null {
  if (!d || d.length < 2 || d.length > MAX_LINK_PAYLOAD + 1 || !/^[zj][A-Za-z0-9_-]+$/.test(d)) return null
  try {
    const raw = Buffer.from(d.slice(1), 'base64url')
    const bytes = d[0] === 'z' ? inflateRawSync(raw, { maxOutputLength: 64 * 1024 }) : raw
    const parsed = inviteSchema.safeParse(JSON.parse(bytes.toString('utf8')))
    return parsed.success ? parsed.data : null
  } catch {
    return null
  }
}
