import 'server-only'
import { createHash, randomBytes } from 'crypto'
import type { SupabaseClient } from '@supabase/supabase-js'

/* eslint-disable @typescript-eslint/no-explicit-any */

const RESET_TOKEN_EXPIRY_MINUTES = 15

export type ResetIssue =
  | { ok: true; resetToken: string }
  | { ok: false; status: number; message: string }

/**
 * After a mobile number has been proven by OTP — through either channel
 * (MSG91 widget or the server-generated code) — issue a one-time reset token
 * for its account. No session is created here; /api/auth/password/reset
 * consumes the token. Only its SHA-256 is stored.
 */
export async function issuePasswordReset(admin: SupabaseClient<any>, mobileE164: string): Promise<ResetIssue> {
  const { data: account } = await admin
    .from('accounts')
    .select('id, account_status')
    .eq('mobile', mobileE164)
    .is('deleted_at', null)
    .maybeSingle()

  if (!account || account.account_status === 'banned' || account.account_status === 'deleted') {
    return { ok: false, status: 404, message: 'No active account found with this number.' }
  }
  if (account.account_status === 'suspended') {
    return { ok: false, status: 403, message: 'This account is temporarily suspended. Contact support.' }
  }

  const resetToken = randomBytes(32).toString('hex')
  const { error } = await admin
    .from('accounts')
    .update({
      password_reset_token_hash: createHash('sha256').update(resetToken).digest('hex'),
      password_reset_expires_at: new Date(Date.now() + RESET_TOKEN_EXPIRY_MINUTES * 60 * 1000).toISOString(),
    })
    .eq('id', account.id)

  if (error) {
    console.error('[passwordReset] update error:', error.message)
    return { ok: false, status: 500, message: 'Could not initiate password reset. Please try again.' }
  }
  return { ok: true, resetToken }
}
