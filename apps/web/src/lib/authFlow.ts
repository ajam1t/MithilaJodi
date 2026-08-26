import 'server-only'
import type { SupabaseClient } from '@supabase/supabase-js'
import { generateSessionToken, hashSessionToken, sessionExpiresAt } from '@/lib/session'
import type { ConsentType } from '@/types/database'

export type EstablishResult =
  | { ok: true; isNew: boolean; sessionToken: string; role: string }
  | { ok: false; status: number; message: string }

/**
 * Shared post-verification account + session logic used by BOTH OTP flows:
 *   - /api/auth/otp/verify  (server-generated OTP, local dev / fallback)
 *   - /api/auth/otp/msg91   (MSG91 widget access-token verification)
 *
 * The OTP (or MSG91 access token) MUST already be verified before this runs.
 * This function only:
 *   - register: creates the account (mobile_verified=true) + records consents
 *   - login:    looks up the account and enforces status gates
 *   - both:     issues a session row and returns the raw session token
 *
 * The caller sets the session cookie from `sessionToken`. No cookie or request
 * concerns live here so the logic stays identical across both entry points.
 */
export async function establishAccountSession(params: {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  admin: SupabaseClient<any>
  mobile: string
  intent: 'login' | 'register'
  consentTerms?: boolean
  consentPrivacy?: boolean
  ip: string | null
  ua: string | null
}): Promise<EstablishResult> {
  const { admin, mobile, intent, consentTerms, consentPrivacy, ip, ua } = params

  let accountId: string
  let role = 'user'
  let isNew = false

  if (intent === 'register') {
    const { data: existing } = await admin
      .from('accounts')
      .select('id')
      .eq('mobile', mobile)
      .is('deleted_at', null)
      .maybeSingle()

    if (existing) {
      return { ok: false, status: 409, message: 'This number is already registered. Please log in instead.' }
    }

    const { data: newAccount, error: createError } = await admin
      .from('accounts')
      .insert({
        mobile,
        mobile_verified: true,
        account_status: 'active',
        role: 'user',
      })
      .select('id')
      .single()

    if (createError || !newAccount) {
      console.error('[authFlow] account insert error:', createError?.message)
      return { ok: false, status: 500, message: 'Account creation failed. Please try again.' }
    }

    accountId = newAccount.id
    isNew = true

    const termsVer = process.env.TERMS_VERSION ?? '1.0'
    const privacyVer = process.env.PRIVACY_POLICY_VERSION ?? '1.0'

    const consents: Array<{
      account_id: string
      type: ConsentType
      version: string
      consented: boolean
      ip_address: string | null
      user_agent: string | null
    }> = [
      { account_id: accountId, type: 'terms', version: termsVer, consented: true, ip_address: ip, user_agent: ua },
      { account_id: accountId, type: 'privacy', version: privacyVer, consented: true, ip_address: ip, user_agent: ua },
      { account_id: accountId, type: 'data_processing', version: privacyVer, consented: true, ip_address: ip, user_agent: ua },
    ]

    // consentTerms/consentPrivacy are validated at the route boundary; recorded here.
    void consentTerms
    void consentPrivacy

    const { error: consentError } = await admin.from('legal_consents').insert(consents)
    if (consentError) {
      console.error('[authFlow] consent insert error:', consentError.message)
    }
  } else {
    const { data: account } = await admin
      .from('accounts')
      .select('id, account_status, role')
      .eq('mobile', mobile)
      .is('deleted_at', null)
      .maybeSingle()

    if (!account) {
      return { ok: false, status: 404, message: 'No account found with this number. Please register first.' }
    }
    if (account.account_status === 'banned') {
      return { ok: false, status: 403, message: 'This account has been suspended. Contact support.' }
    }
    if (account.account_status === 'suspended') {
      return { ok: false, status: 403, message: 'This account is temporarily suspended. Contact support.' }
    }

    accountId = account.id
    role = account.role
  }

  const token = generateSessionToken()
  const tokenHash = hashSessionToken(token)
  const expiresAt = sessionExpiresAt()

  const { error: sessionError } = await admin.from('account_sessions').insert({
    account_id: accountId,
    token_hash: tokenHash,
    expires_at: expiresAt.toISOString(),
    user_agent: ua,
    ip_address: ip,
  })

  if (sessionError) {
    console.error('[authFlow] session insert error:', sessionError.message)
    return { ok: false, status: 500, message: 'Could not create session. Please try again.' }
  }

  return { ok: true, isNew, sessionToken: token, role }
}
