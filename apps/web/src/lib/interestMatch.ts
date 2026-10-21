import 'server-only'
import { displayName, notify } from '@/lib/notifications'

/* eslint-disable @typescript-eslint/no-explicit-any */

/*
 * What happens once an interest becomes mutual, in one place. Accepting from
 * the Inbox (PATCH /api/interests/[id]) and sending an interest back to
 * someone whose interest is still waiting (POST /api/interests) are the same
 * event, so both open the conversation and send the match notifications here.
 * The caller has already moved the row from 'sent' to 'accepted' — with a
 * status guard, so this runs once per interest.
 */

/**
 * Opens (or finds) the pair's conversation and tells both members. Returns
 * the conversation id, or null if it could not be created.
 */
export async function openMatch(
  admin: any,
  iv: { id: string; from_profile: string; to_profile: string },
): Promise<string | null> {
  // Canonical ordering (profile_a < profile_b) matches the table CHECK; upsert
  // with ignoreDuplicates = ON CONFLICT DO NOTHING.
  const a = iv.from_profile < iv.to_profile ? iv.from_profile : iv.to_profile
  const b = iv.from_profile < iv.to_profile ? iv.to_profile : iv.from_profile

  const { error: convError } = await admin
    .from('conversations')
    .upsert({ profile_a: a, profile_b: b }, { onConflict: 'profile_a,profile_b', ignoreDuplicates: true })
  if (convError) console.error('[interests] conversation upsert error:', convError.message)

  // Fetch the conversation id (whether just created or pre-existing)
  const { data: conv } = await admin
    .from('conversations')
    .select('id')
    .eq('profile_a', a)
    .eq('profile_b', b)
    .maybeSingle()
  const conversationId: string | null = (conv as any)?.id ?? null

  const { data: pair } = await admin
    .from('profiles')
    .select('id, account_id, first_name, last_name')
    .in('id', [iv.from_profile, iv.to_profile])
  const sender = (pair ?? []).find((r: any) => r.id === iv.from_profile) as any
  const accepter = (pair ?? []).find((r: any) => r.id === iv.to_profile) as any
  const chatUrl = conversationId ? `/messages/${conversationId}` : '/inbox?tab=mutual'

  if (sender) {
    await notify(admin, {
      accountId: sender.account_id,
      type: 'interest_accepted',
      icon: 'heart',
      title: 'Your interest was accepted ❤️',
      message: `${displayName(accepter?.first_name, accepter?.last_name)} accepted your interest. You can now message each other.`,
      ctaLabel: 'View Match',
      ctaUrl: chatUrl,
      payload: { interest_id: iv.id, conversation_id: conversationId },
      dedupeKey: `interest_accepted:${iv.id}`,
    })
  }
  // The member who accepted gets the match too, with the way into the chat.
  if (accepter && sender) {
    await notify(admin, {
      accountId: accepter.account_id,
      type: 'mutual_match',
      icon: 'heart',
      title: "It's a Match! ❤️",
      message: `You and ${displayName(sender.first_name, sender.last_name)} have expressed mutual interest.`,
      ctaLabel: 'View Match',
      ctaUrl: chatUrl,
      payload: { interest_id: iv.id, conversation_id: conversationId },
      dedupeKey: `mutual_match:${iv.id}`,
    })
  }

  return conversationId
}
