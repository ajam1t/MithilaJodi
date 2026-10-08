'use client'
import { use, useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { checkPassword, PASSWORD_RULES } from '@/lib/password'
import { OtpBoxInput } from '@/components/OtpBoxInput'
import { OtpSentAnimation } from '@/components/OtpSentAnimation'
import { AuthWelcome } from '@/components/auth/AuthWelcome'
import { JoinProgress } from '@/components/auth/JoinProgress'
import { OTP_LENGTH } from '@/lib/constants'
import { track } from '@/lib/track'
import type { RegStep } from '@/lib/analytics'
import { isMsg91Enabled, ensureMsg91, msg91SendOtp, msg91VerifyOtp, msg91RetryOtp } from '@/lib/msg91'

type Step = 'welcome' | 'mobile' | 'sent' | 'otp' | 'password' | 'existing'
type OtpChannel = 'msg91' | 'server'

/** Matches OTP_TTL_MINUTES on the server; after this the code is treated as expired. */
const OTP_VALID_MS = 10 * 60 * 1000
const RESEND_SECONDS = 60

const reg = (k: RegStep) => track('reg_step', { k })

/**
 * /register — step 1 of Join ("Account"): mobile, one-time code, password.
 *
 * The account is created when the code is verified (the session system needs
 * an account to attach to); the profile is built on /welcome and stays hidden
 * from everyone until the onboarding minimum is met (lib/onboarding.ts).
 *
 * The "Quick check" arithmetic step that used to sit between the number and
 * the code is gone: it was never enforced server-side, so it stopped no bot,
 * only people. OTP sending is rate-limited per IP and per number instead.
 *
 * /register without ?start shows the entrance (Create account / Welcome back);
 * ?start=1 opens the flow as its own history entry, so Back returns to it.
 */
export default function RegisterPage({ searchParams }: { searchParams: Promise<{ start?: string }> }) {
  const { start } = use(searchParams)
  const [step, setStep] = useState<Step>(start ? 'mobile' : 'welcome')
  useEffect(() => {
    if (!start) setStep('welcome')
    else setStep(s => (s === 'welcome' ? 'mobile' : s))
  }, [start])

  const [mobile, setMobile] = useState('')
  const [consent, setConsent] = useState(false)
  const [otp, setOtp] = useState('')
  const [otpChannel, setOtpChannel] = useState<OtpChannel>('server')
  const [sentAt, setSentAt] = useState(0)
  const [now, setNow] = useState(() => Date.now())
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const verifying = useRef(false)
  const startedTracked = useRef(false)

  // One clock for both the resend countdown and code expiry.
  useEffect(() => {
    if (step !== 'otp' && step !== 'sent') return
    const t = setInterval(() => setNow(Date.now()), 1000)
    return () => clearInterval(t)
  }, [step])

  useEffect(() => {
    if (step !== 'mobile') return
    if (!startedTracked.current) { startedTracked.current = true; reg('started') }
    // Load the OTP widget while the number is being typed, not after Continue.
    if (isMsg91Enabled()) ensureMsg91().catch(() => {})
  }, [step])

  const maskedMobile = mobile.length === 10 ? `+91 ${mobile.slice(0, 5)} ${mobile.slice(5)}` : mobile
  const resendIn = Math.max(0, RESEND_SECONDS - Math.floor((now - sentAt) / 1000))
  const expired = sentAt > 0 && now - sentAt > OTP_VALID_MS
  const strength = checkPassword(password)
  const passwordOk = strength.length && strength.uppercase && strength.lowercase && strength.number

  async function sendCode(): Promise<boolean> {
    if (isMsg91Enabled()) {
      try { await ensureMsg91() } catch { setError('Could not start verification. Please refresh the page and try again.'); return false }
      try { await msg91SendOtp('91' + mobile) } catch { setError('We could not send a code to that number. Please check it and try again.'); return false }
      setOtpChannel('msg91')
      return true
    }
    const res = await fetch('/api/auth/otp/challenge', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ mobile }),
    })
    const data: { ok: boolean; message?: string } = await res.json().catch(() => ({ ok: false }))
    if (!data.ok) { setError(data.message ?? 'We could not send a code. Please try again.'); return false }
    setOtpChannel('server')
    return true
  }

  async function handleMobileSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!/^[6-9]\d{9}$/.test(mobile)) { setError('Please enter a valid 10-digit Indian mobile number.'); return }
    if (!consent) { setError('Please agree to the Terms and Privacy Policy to continue.'); return }
    setError('')
    setLoading(true)
    reg('mobile_entered')
    try {
      if (!(await sendCode())) return
      reg('otp_sent')
      setOtp('')
      setSentAt(Date.now()); setNow(Date.now())
      setStep('sent')
      setTimeout(() => setStep(s => (s === 'sent' ? 'otp' : s)), 1200)
    } catch {
      setError('Network error. Please check your connection and try again.')
    } finally {
      setLoading(false)
    }
  }

  async function handleResend() {
    if (resendIn > 0 && !expired) return
    setError('')
    setOtp('')
    try {
      if (otpChannel === 'msg91') await msg91RetryOtp()
      else if (!(await sendCode())) return
      setSentAt(Date.now()); setNow(Date.now())
    } catch {
      setError('Could not send a new code. Please try again in a moment.')
    }
  }

  async function verify(code: string) {
    if (verifying.current) return // auto-submit and the button can both fire
    if (code.length < OTP_LENGTH) { setError(`Enter the ${OTP_LENGTH}-digit code.`); return }
    if (expired) { setError('This code has expired. Send a new one below.'); return }
    verifying.current = true
    setError('')
    setLoading(true)
    try {
      let res: Response
      if (otpChannel === 'msg91') {
        let accessToken: string
        try { accessToken = await msg91VerifyOtp(code) } catch {
          setError('That code did not match or has expired. Check it, or send a new one.')
          setOtp('')
          return
        }
        res = await fetch('/api/auth/otp/msg91', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ mobile, accessToken, intent: 'register', consent_terms: consent, consent_privacy: consent }),
        })
      } else {
        res = await fetch('/api/auth/otp/verify', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ mobile, code, intent: 'register', consent_terms: consent, consent_privacy: consent }),
        })
      }
      const data: { ok: boolean; message?: string; is_new?: boolean } = await res.json().catch(() => ({ ok: false }))
      if (!data.ok) { setError(data.message ?? 'Verification failed. Please try again.'); setOtp(''); return }
      reg('otp_verified')
      if (data.is_new === false) {
        // The number was already registered: the code proved it is theirs, so
        // they are signed in. /welcome resumes onboarding or forwards to /home.
        setStep('existing')
        setTimeout(() => { window.location.href = '/welcome' }, 1600)
        return
      }
      setStep('password')
    } catch {
      setError('Network error. Please check your connection and try again.')
    } finally {
      verifying.current = false
      setLoading(false)
    }
  }

  async function handleSetPassword(e: React.FormEvent) {
    e.preventDefault()
    if (!passwordOk) { setError('Your password needs everything ticked below.'); return }
    setError('')
    setLoading(true)
    try {
      const res = await fetch('/api/auth/password/set', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password }),
      })
      const data: { ok: boolean; message?: string } = await res.json().catch(() => ({ ok: false }))
      if (!data.ok) { setError(data.message ?? 'Could not save your password. Please try again.'); return }
      reg('password_set')
      window.location.href = '/welcome'
    } catch {
      setError('Network error. Please check your connection and try again.')
    } finally {
      setLoading(false)
    }
  }

  if (step === 'welcome') return <AuthWelcome />

  return (
    <div className="w-full max-w-sm motion-safe:animate-fade-in">
      <div className="card p-5 sm:p-8">
        <JoinProgress current={1} className="mb-5" />

        {step === 'sent' && <OtpSentAnimation mobile={maskedMobile} />}

        {step === 'mobile' && (
          <>
            <h1 className="font-display text-[22px] leading-tight text-ink">Begin your Mithila Jodi profile</h1>
            <p className="mt-1.5 mb-5 text-sm leading-relaxed text-ink-soft">
              About three minutes. Your number stays private — it secures your account and is never shown on your profile.
            </p>
            <form onSubmit={handleMobileSubmit} noValidate>
              <label htmlFor="reg-mobile" className="block text-sm font-medium text-ink">Mobile number</label>
              <div className={`mt-1.5 flex items-center overflow-hidden rounded-mj border bg-white focus-within:ring-2 focus-within:ring-maroon/30 ${error && mobile.length !== 10 ? 'border-terra' : 'border-ink/20'}`}>
                <span className="select-none border-r border-ink/20 bg-paper px-3 py-3 font-mono text-sm text-ink-soft">+91</span>
                <input
                  id="reg-mobile" type="tel" inputMode="numeric" maxLength={16} autoComplete="tel-national"
                  placeholder="10-digit number" value={mobile} autoFocus enterKeyHint="send"
                  // A pasted +91 / 0 prefix is dropped by keeping the last ten digits.
                  onChange={e => { setError(''); setMobile(e.target.value.replace(/\D/g, '').slice(-10)) }}
                  aria-describedby="reg-mobile-hint"
                  className="flex-1 bg-transparent px-4 py-3 font-mono text-base text-ink focus:outline-none"
                />
              </div>
              <p id="reg-mobile-hint" className="mt-1.5 text-xs text-ink-soft">We&apos;ll send a {OTP_LENGTH}-digit code by SMS.</p>

              <label className="mt-4 flex cursor-pointer items-start gap-3">
                <input type="checkbox" checked={consent} onChange={e => { setError(''); setConsent(e.target.checked) }}
                  className="mt-0.5 h-5 w-5 flex-shrink-0 rounded accent-maroon" />
                <span className="text-[13px] leading-relaxed text-ink-soft">
                  I agree to the{' '}
                  <Link href="/legal/terms" target="_blank" className="text-maroon underline-offset-2 hover:underline">Terms of Service</Link>
                  {' '}and{' '}
                  <Link href="/legal/privacy" target="_blank" className="text-maroon underline-offset-2 hover:underline">Privacy Policy</Link>,
                  and consent to Mithila Jodi processing my details to provide matchmaking.
                </span>
              </label>

              {error && <p role="alert" className="mt-3 text-sm text-terra">{error}</p>}
              <button type="submit" disabled={loading || mobile.length !== 10 || !consent} className="btn btn-primary mt-5 w-full">
                {loading ? 'Sending code…' : 'Send code'}
              </button>
            </form>
            <p className="mt-5 text-center text-sm text-ink-soft">
              Already a member?{' '}
              <Link href="/login" className="font-medium text-maroon hover:underline">Log in</Link>
            </p>
          </>
        )}

        {step === 'otp' && (
          <>
            <h1 className="font-display text-[22px] leading-tight text-ink">Enter the code</h1>
            <p className="mt-1.5 mb-5 text-sm text-ink-soft">
              Sent to <span className="font-mono font-medium text-ink">{maskedMobile}</span>
            </p>
            <form onSubmit={e => { e.preventDefault(); verify(otp) }} noValidate>
              <OtpBoxInput
                value={otp}
                onChange={v => { setError(''); setOtp(v) }}
                onComplete={v => verify(v)}
                disabled={loading || expired}
                hasError={!!error}
                autoFocus
              />
              <p className="mt-2 min-h-[1.25rem] text-center text-xs text-ink-soft" aria-live="polite">
                {loading ? 'Checking…' : expired ? 'This code has expired.' : 'The code fills in automatically on most phones.'}
              </p>
              {error && <p role="alert" className="mt-1 text-center text-sm text-terra">{error}</p>}
              <button type="submit" disabled={loading || expired || otp.length < OTP_LENGTH} className="btn btn-primary mt-4 w-full">
                {loading ? 'Verifying…' : 'Verify'}
              </button>
            </form>
            <div className="mt-5 flex items-center justify-between text-sm text-ink-soft">
              <button type="button" onClick={() => { setStep('mobile'); setOtp(''); setError('') }} className="py-1 hover:text-ink hover:underline">
                ← Change number
              </button>
              <button type="button" onClick={handleResend} disabled={resendIn > 0 && !expired}
                className="py-1 font-medium text-maroon hover:underline disabled:font-normal disabled:text-ink-soft disabled:no-underline">
                {resendIn > 0 && !expired ? `Resend in ${resendIn}s` : 'Send a new code'}
              </button>
            </div>
          </>
        )}

        {step === 'existing' && (
          <div className="py-4 text-center" role="status">
            <p className="font-display text-[20px] text-maroon">Welcome back</p>
            <p className="mt-2 text-sm leading-relaxed text-ink-soft">
              This number already has a Mithila Jodi account, so we&apos;ve signed you in. Taking you to your profile…
            </p>
          </div>
        )}

        {step === 'password' && (
          <>
            <h1 className="font-display text-[22px] leading-tight text-ink">Number verified — create a password</h1>
            <p className="mt-1.5 mb-5 text-sm text-ink-soft">You&apos;ll use it with your mobile number to log in.</p>
            <form onSubmit={handleSetPassword} noValidate>
              {/* Lets password managers save the pair. */}
              <input type="text" name="username" autoComplete="username" value={mobile} readOnly hidden />
              <label htmlFor="reg-password" className="block text-sm font-medium text-ink">Password</label>
              <div className="relative mt-1.5">
                <input
                  id="reg-password" type={showPassword ? 'text' : 'password'} value={password} autoFocus
                  autoComplete="new-password" enterKeyHint="done" aria-describedby="reg-password-rules"
                  onChange={e => { setError(''); setPassword(e.target.value) }}
                  className="block w-full rounded-mj border border-ink/20 bg-white px-4 py-3 pr-16 text-base text-ink focus:outline-none focus:ring-2 focus:ring-maroon/30"
                />
                <button type="button" onClick={() => setShowPassword(s => !s)} aria-pressed={showPassword}
                  className="absolute right-1 top-1/2 -translate-y-1/2 px-3 py-2 text-sm text-ink-soft hover:text-ink">
                  {showPassword ? 'Hide' : 'Show'}
                </button>
              </div>
              <ul id="reg-password-rules" className="mt-2 grid grid-cols-2 gap-x-3 gap-y-1">
                {PASSWORD_RULES.filter(r => r.required).map(rule => {
                  const passed = strength[rule.key] as boolean
                  return (
                    <li key={rule.key} className={`flex items-center gap-1.5 text-xs ${passed ? 'text-success' : 'text-ink-soft'}`}>
                      <span aria-hidden="true">{passed ? '✓' : '○'}</span>
                      <span>{rule.label}</span>
                    </li>
                  )
                })}
              </ul>
              {error && <p role="alert" className="mt-3 text-sm text-terra">{error}</p>}
              <button type="submit" disabled={loading || !passwordOk} className="btn btn-primary mt-5 w-full">
                {loading ? 'Saving…' : 'Continue'}
              </button>
            </form>
          </>
        )}
      </div>
    </div>
  )
}
