import 'server-only'
import { getSystemProfileId } from '@/lib/systemProfile'

/* eslint-disable @typescript-eslint/no-explicit-any */

/**
 * Send a message from the official Mithila Jodi profile into a member's inbox,
 * through the ordinary conversations/messages tables — the same thread an
 * admin writes in by hand (Admin → Official messages), so the member reads it
 * in their Inbox and can reply.
 *
 * `automated` marks messages the engagement journey sends (messages.automated,
 * migration 20261112000001) so they can be told apart from hand-written ones.
 */
export type OfficialSendResult =
  | { ok: true; conversationId: string; messageId: string | null }
  | { ok: false; status: number; message: string }

export async function sendOfficialMessage(admin: any, profileId: string, body: string, opts: { automated?: boolean } = {}): Promise<OfficialSendResult> {
  const systemProfileId = await getSystemProfileId(admin)
  if (!systemProfileId) return { ok: false, status: 500, message: 'The Mithila Jodi profile is missing. Run migration 20260912000001.' }
  if (profileId === systemProfileId) return { ok: false, status: 400, message: 'Cannot message the platform profile.' }

  const { data: recipient } = await admin.from('profiles').select('id, profile_status').eq('id', profileId).is('deleted_at', null).maybeSingle()
  if (!recipient || recipient.profile_status === 'deleted') return { ok: false, status: 404, message: 'Profile not found' }

  const { data: blocked, error: blockError } = await admin
    .from('blocks')
    .select('blocker_id')
    .or(`and(blocker_id.eq.${profileId},blocked_id.eq.${systemProfileId}),and(blocker_id.eq.${systemProfileId},blocked_id.eq.${profileId})`)
    .limit(1)
    .maybeSingle()
  if (blockError) return { ok: false, status: 503, message: 'Something went wrong — please try again.' }
  if (blocked) return { ok: false, status: 403, message: 'This member has blocked messages from Mithila Jodi.' }

  // Conversations are stored with the two profile ids in sorted order.
  const a = systemProfileId < profileId ? systemProfileId : profileId
  const b = systemProfileId < profileId ? profileId : systemProfileId
  const { error: convError } = await admin.from('conversations').upsert({ profile_a: a, profile_b: b }, { onConflict: 'profile_a,profile_b', ignoreDuplicates: true })
  if (convError) return { ok: false, status: 500, message: 'Could not open the conversation.' }
  const { data: conv } = await admin.from('conversations').select('id, status').eq('profile_a', a).eq('profile_b', b).maybeSingle()
  if (!conv) return { ok: false, status: 500, message: 'Could not open the conversation.' }
  if (conv.status !== 'open') await admin.from('conversations').update({ status: 'open' }).eq('id', conv.id)

  const row: any = { conversation_id: conv.id, sender_id: systemProfileId, body }
  if (opts.automated) row.automated = true
  let { data: msg, error: insertError } = await admin.from('messages').insert(row).select('id').single()
  if (insertError?.code === '42703' && opts.automated) {
    // Before migration 20261112000001 there is no automated column.
    delete row.automated
    ;({ data: msg, error: insertError } = await admin.from('messages').insert(row).select('id').single())
  }
  if (insertError) return { ok: false, status: 500, message: 'Could not send the message.' }

  await admin.from('conversations').update({ updated_at: new Date().toISOString() }).eq('id', conv.id)
  return { ok: true, conversationId: conv.id, messageId: msg?.id ?? null }
}
