import { randomInt } from 'crypto'
import bcrypt from 'bcryptjs'
import type { SupabaseClient } from '@supabase/supabase-js'
import type { OtpProvider, OtpVerifyResult } from './types'
import { DevConsoleOtpProvider } from './DevConsoleOtpProvider'
import { DevFixedOtpProvider } from './DevFixedOtpProvider'
import { ProductionOtpProvider } from './ProductionOtpProvider'

const OTP_TTL_MINUTES = 10
const MAX_ATTEMPTS = 5

// Fallback dev code if DEV_OTP env var is not set. Server-only — never sent to clients.
const DEFAULT_DEV_OTP = '0794'

/**
 * Resolves the fixed development OTP from configuration.
 * Only used when DEV_OTP_ENABLED === 'true'.
 */
function resolveDevOtp(): string {
  const configured = process.env.DEV_OTP?.trim()
  if (configured && /^\d{4,8}$/.test(configured)) return configured
  return DEFAULT_DEV_OTP
}

/**
 * Whether the fixed development/testing OTP is enabled.
 *
 * SECURITY: hard-gated on NODE_ENV. In a production build the fixed code can
 * NEVER authenticate anyone, regardless of how DEV_OTP_ENABLED / DEV_AUTH_MODE
 * are set in the environment. Previously this was env-only, which meant one
 * stray variable in production turned a hardcoded 4-digit code into a universal
 * login for every account — including admins.
 */
function isDevOtpEnabled(): boolean {
  if (process.env.NODE_ENV === 'production') return false
  return process.env.DEV_OTP_ENABLED === 'true' || process.env.DEV_AUTH_MODE === 'true'
}

// 4-digit OTP (matches OTP_LENGTH and the MSG91 widget config).
// randomInt is [min, max); 1000–9999 is always 4 digits (no leading zero).
function generateOtp(): string {
  return String(randomInt(1000, 10000))
}

/**
 * OtpService — owns challenge lifecycle.
 * Stores hashed OTPs in otp_challenges via the Supabase admin client.
 * Raw OTP is passed to the provider and never stored or returned in API responses.
 */
export class OtpService {
  constructor(
    private provider: OtpProvider,
    // When set, challenge() uses this code instead of a random one (DEV_AUTH_MODE only)
    private devFixedCode?: string
  ) {}

  async challenge(
    mobile: string,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    supabaseAdmin: SupabaseClient<any>
  ): Promise<{ sent: boolean; error?: string }> {
    const otp = this.devFixedCode ?? generateOtp()
    const hash = await bcrypt.hash(otp, 10)
    const expiresAt = new Date(Date.now() + OTP_TTL_MINUTES * 60 * 1000)

    // Invalidate any existing unexpired challenges for this mobile
    await supabaseAdmin
      .from('otp_challenges')
      .update({ used: true })
      .eq('mobile', mobile)
      .eq('used', false)

    const { error: insertError } = await supabaseAdmin
      .from('otp_challenges')
      .insert({
        mobile,
        otp_hash: hash,
        expires_at: expiresAt.toISOString(),
        attempts: 0,
        used: false,
      })

    if (insertError) {
      console.error('[OtpService] challenge insert error:', insertError.message)
      return { sent: false, error: 'Failed to create OTP challenge' }
    }

    const result = await this.provider.send(mobile, otp)
    return { sent: result.success, error: result.error }
  }

  async verify(
    mobile: string,
    otp: string,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    supabaseAdmin: SupabaseClient<any>
  ): Promise<OtpVerifyResult> {
    const { data: challenge, error } = await supabaseAdmin
      .from('otp_challenges')
      .select('*')
      .eq('mobile', mobile)
      .eq('used', false)
      .order('created_at', { ascending: false })
      .limit(1)
      .single()

    if (error || !challenge) {
      return { valid: false, reason: 'invalid' }
    }

    if (new Date(challenge.expires_at as string) < new Date()) {
      return { valid: false, reason: 'expired' }
    }

    const attempts = challenge.attempts as number
    if (attempts >= MAX_ATTEMPTS) {
      return { valid: false, reason: 'max_attempts' }
    }

    // Increment attempt count before checking (prevents race condition)
    await supabaseAdmin
      .from('otp_challenges')
      .update({ attempts: attempts + 1 })
      .eq('id', challenge.id)

    const valid = await bcrypt.compare(otp, challenge.otp_hash as string)

    if (!valid) {
      return { valid: false, reason: 'invalid' }
    }

    // Mark as used on success
    await supabaseAdmin
      .from('otp_challenges')
      .update({ used: true })
      .eq('id', challenge.id)

    return { valid: true }
  }
}

/**
 * Factory — selects OTP provider and mode from environment variables.
 *
 * DEV_OTP_ENABLED=true  →  fixed dev/testing code from DEV_OTP (no SMS sent).
 *                          Explicitly opt-in; set DEV_OTP_ENABLED=false to disable.
 * OTP_PROVIDER=production  →  real SMS provider (ProductionOtpProvider stub).
 * Default  →  DevConsoleOtpProvider (random OTP printed to server console).
 *
 * SECURITY: The fixed code only works while DEV_OTP_ENABLED is 'true'. To go to
 * real SMS, set DEV_OTP_ENABLED=false and OTP_PROVIDER=production. No auth
 * redesign is required — only these env vars change.
 */
export function createOtpService(): OtpService {
  if (isDevOtpEnabled()) {
    // DEV/TESTING: fixed configurable code, no SMS.
    // Loud warning so this is never silently left on in a real launch.
    console.warn(
      '[SECURITY][OTP] DEV_OTP_ENABLED is TRUE — a fixed testing OTP will authenticate ' +
      'any registration/login. Set DEV_OTP_ENABLED=false before real production launch.'
    )
    return new OtpService(new DevFixedOtpProvider(), resolveDevOtp())
  }

  const provider =
    process.env.OTP_PROVIDER === 'production'
      ? new ProductionOtpProvider()
      : new DevConsoleOtpProvider()

  return new OtpService(provider)
}
