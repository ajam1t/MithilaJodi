// MSG91 OTP Widget — client-side (headless) integration helper.
//
// Uses MSG91's `exposeMethods` mode so the existing Mithila Jodi OTP UI stays in
// control: we call sendOtp / verifyOtp / retryOtp directly instead of showing
// MSG91's own popup. On successful verification MSG91 returns a short-lived
// access token, which is posted to /api/auth/otp/msg91 for server-side
// verification against the MSG91 Authkey (which never reaches the browser).
//
// Only PUBLIC widget values are used here (widgetId + tokenAuth). The secret
// MSG91_AUTHKEY is server-only and is never imported or referenced client-side.

// widgetId + tokenAuth are PUBLIC MSG91 values (delivered to every browser), so
// they are safe to ship in the client bundle. Env vars override them if MSG91
// ever regenerates the widget. The secret Authkey is NOT here — it is server-only.
const WIDGET_ID = process.env.NEXT_PUBLIC_MSG91_WIDGET_ID ?? '36687863534d333434393430'
const TOKEN_AUTH = process.env.NEXT_PUBLIC_MSG91_TOKEN_AUTH ?? '563745TlGWMkasSdL6a8bbf01P1'

// Primary + fallback CDN (mirrors MSG91's own generated loader).
const SCRIPT_SRCS = [
  'https://verify.msg91.com/otp-provider.js',
  'https://verify.phone91.com/otp-provider.js',
]

type OtpCallback = (data: unknown) => void

declare global {
  interface Window {
    initSendOTP?: (config: {
      widgetId: string
      tokenAuth: string
      exposeMethods: boolean
      success: OtpCallback
      failure: OtpCallback
    }) => void
    sendOtp?: (identifier: string, success: OtpCallback, failure: OtpCallback) => void
    verifyOtp?: (otp: string, success: OtpCallback, failure: OtpCallback) => void
    retryOtp?: (channel: string | null, success: OtpCallback, failure: OtpCallback) => void
  }
}

/**
 * Whether the MSG91 widget path is active. Explicitly opt-in via
 * NEXT_PUBLIC_MSG91_ENABLED=true so local dev keeps using the server-generated
 * OTP + DEV_OTP flow, while production (with the flag set) uses MSG91.
 */
export function isMsg91Enabled(): boolean {
  return process.env.NEXT_PUBLIC_MSG91_ENABLED === 'true' && Boolean(WIDGET_ID && TOKEN_AUTH)
}

let initPromise: Promise<void> | null = null

function loadScript(): Promise<void> {
  return new Promise((resolve, reject) => {
    if (typeof window === 'undefined') {
      reject(new Error('MSG91 can only load in the browser'))
      return
    }
    if (typeof window.initSendOTP === 'function') {
      resolve()
      return
    }

    // Try each CDN in turn; only reject once every URL has failed.
    let i = 0
    const attempt = () => {
      if (typeof window.initSendOTP === 'function') {
        resolve()
        return
      }
      if (i >= SCRIPT_SRCS.length) {
        reject(new Error('MSG91 script failed to load'))
        return
      }
      const src = SCRIPT_SRCS[i++]
      const script = document.createElement('script')
      script.src = src
      script.async = true
      script.onload = () => resolve()
      script.onerror = () => attempt()
      document.head.appendChild(script)
    }
    attempt()
  })
}

/** Wait briefly for the exposed globals to attach after initSendOTP(). */
function waitForMethods(timeoutMs = 4000): Promise<void> {
  return new Promise((resolve, reject) => {
    const start = Date.now()
    const tick = () => {
      if (typeof window.sendOtp === 'function' && typeof window.verifyOtp === 'function') {
        resolve()
        return
      }
      if (Date.now() - start > timeoutMs) {
        reject(new Error('MSG91 methods did not initialise'))
        return
      }
      setTimeout(tick, 60)
    }
    tick()
  })
}

/**
 * Loads the MSG91 script and initialises the widget exactly once.
 * Safe to call repeatedly — subsequent calls reuse the first init promise.
 * Throws if MSG91 is not configured or the script/init fails.
 */
export async function ensureMsg91(): Promise<void> {
  if (!isMsg91Enabled()) throw new Error('MSG91 is not configured')
  if (initPromise) return initPromise

  initPromise = (async () => {
    await loadScript()
    if (typeof window.initSendOTP !== 'function') {
      throw new Error('MSG91 script loaded but initSendOTP is unavailable')
    }
    window.initSendOTP({
      widgetId: WIDGET_ID as string,
      tokenAuth: TOKEN_AUTH as string,
      exposeMethods: true,
      // Per-call callbacks handle results in exposeMethods mode; these are no-ops.
      success: () => {},
      failure: () => {},
    })
    await waitForMethods()
  })()

  try {
    return await initPromise
  } catch (err) {
    // Reset so a later attempt (e.g. after a transient CDN failure) can retry.
    initPromise = null
    throw err
  }
}

function extractAccessToken(data: unknown): string | null {
  if (typeof data === 'string') return data
  if (data && typeof data === 'object') {
    const d = data as Record<string, unknown>
    if (typeof d.message === 'string') return d.message
    if (typeof d.accessToken === 'string') return d.accessToken
    if (typeof d['access-token'] === 'string') return d['access-token'] as string
  }
  return null
}

/** Request an OTP for a country-code-prefixed identifier, e.g. "919876543210". */
export async function msg91SendOtp(identifier: string): Promise<void> {
  await ensureMsg91()
  return new Promise((resolve, reject) => {
    if (typeof window.sendOtp !== 'function') {
      reject(new Error('MSG91 sendOtp unavailable'))
      return
    }
    window.sendOtp(identifier, () => resolve(), () => reject(new Error('send_failed')))
  })
}

/** Verify the entered OTP. Resolves with the MSG91 access token on success. */
export async function msg91VerifyOtp(otp: string): Promise<string> {
  await ensureMsg91()
  return new Promise((resolve, reject) => {
    if (typeof window.verifyOtp !== 'function') {
      reject(new Error('MSG91 verifyOtp unavailable'))
      return
    }
    window.verifyOtp(
      otp,
      (data) => {
        const token = extractAccessToken(data)
        if (token) resolve(token)
        else reject(new Error('no_token'))
      },
      () => reject(new Error('verify_failed')),
    )
  })
}

/** Resend the OTP. `channel` null lets MSG91 pick the default channel. */
export async function msg91RetryOtp(channel: string | null = null): Promise<void> {
  await ensureMsg91()
  return new Promise((resolve, reject) => {
    if (typeof window.retryOtp !== 'function') {
      reject(new Error('MSG91 retryOtp unavailable'))
      return
    }
    window.retryOtp(channel, () => resolve(), () => reject(new Error('retry_failed')))
  })
}
