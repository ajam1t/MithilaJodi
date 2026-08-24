'use client'
import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import { checkPassword, PASSWORD_RULES } from '@/lib/password'
import { OtpBoxInput } from '@/components/OtpBoxInput'
import { OTP_LENGTH } from '@/lib/constants'
import { isMsg91Enabled, ensureMsg91, msg91SendOtp, msg91VerifyOtp, msg91RetryOtp } from '@/lib/msg91'

type Step = 'mobile' | 'human' | 'sent' | 'otp' | 'password'
type OtpChannel = 'msg91' | 'server'

export default function RegisterPage() {
  const [step, setStep] = useState<Step>('mobile')
  const [mobile, setMobile]                     = useState('')
  const [challengeId, setChallengeId]           = useState('')
  const [challengeQ, setChallengeQ]             = useState('')
  const [humanAnswer, setHumanAnswer]           = useState('')
  const [otp, setOtp]                           = useState('')
  const [otpChannel, setOtpChannel]             = useState<OtpChannel>('server')
  const [consentTerms, setConsentTerms]         = useState(false)
  const [consentPrivacy, setConsentPrivacy]     = useState(false)
  const [password, setPassword]                 = useState('')
  const [passwordConfirm, setPasswordConfirm]  = useState('')
  const [showPassword, setShowPassword]         = useState(false)
  const [loading, setLoading]                   = useState(false)
  const [error, setError]                       = useState('')
  const [resendCooldown, setResendCooldown]     = useState(false)
  const [resendTimer, setResendTimer]           = useState(0)
  const resendIntervalRef                       = useRef<ReturnType<typeof setInterval> | null>(null)

  const maskedMobile = mobile.length === 10
    ? `+91 ${mobile.slice(0, 5)} ${mobile.slice(5)}`
    : mobile

  const strength = checkPassword(password)

  /* ── Step 1: mobile → fetch human challenge ── */
  async function handleMobileSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (mobile.length !== 10) { setError('Enter a valid 10-digit mobile number'); return }
    setError('')
    setLoading(true)
    try {
      const res  = await fetch('/api/auth/human/challenge', { method: 'POST' })
      const data: { ok: boolean; challenge_id?: string; question?: string; message?: string } = await res.json()
      if (!data.ok) { setError(data.message ?? 'Could not load verification. Please try again.'); return }
      setChallengeId(data.challenge_id!)
      setChallengeQ(data.question!)
      setHumanAnswer('')
      setStep('human')
    } catch {
      setError('Network error. Please check your connection and try again.')
    } finally {
      setLoading(false)
    }
  }

  /* ── Step 2: human verify → send OTP ── */
  async function handleHumanVerify(e: React.FormEvent) {
    e.preventDefault()
    if (!humanAnswer.trim()) { setError('Enter your answer'); return }
    setError('')
    setLoading(true)
    try {
      const verifyRes  = await fetch('/api/auth/human/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ challenge_id: challengeId, answer: Number(humanAnswer) }),
      })
      const verifyData: { ok: boolean; message?: string } = await verifyRes.json()
      if (!verifyData.ok) { setError(verifyData.message ?? 'Incorrect answer. Please try again.'); return }

      // MSG91 path (production): headless widget behind our own UI.
      if (isMsg91Enabled()) {
        try {
          await ensureMsg91()
        } catch {
          setError('Could not start OTP verification. Please refresh and try again.')
          return
        }
        try {
          await msg91SendOtp('91' + mobile)
        } catch {
          setError('Could not send OTP. Please check the number and try again.')
          return
        }
        setOtpChannel('msg91')
      } else {
        const otpRes  = await fetch('/api/auth/otp/challenge', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ mobile }),
        })
        const otpData: { ok: boolean; message?: string } = await otpRes.json()
        if (!otpData.ok) { setError(otpData.message ?? 'Could not send OTP. Please try again.'); return }
        setOtpChannel('server')
      }

      setOtp('')
      setStep('sent')
      startResendCountdown()
      setTimeout(() => setStep('otp'), 1800)
    } catch {
      setError('Network error. Please check your connection and try again.')
    } finally {
      setLoading(false)
    }
  }

  function startResendCountdown() {
    setResendCooldown(true)
    setResendTimer(60)
    if (resendIntervalRef.current) clearInterval(resendIntervalRef.current)
    resendIntervalRef.current = setInterval(() => {
      setResendTimer(t => {
        if (t <= 1) {
          if (resendIntervalRef.current) clearInterval(resendIntervalRef.current)
          setResendCooldown(false)
          return 0
        }
        return t - 1
      })
    }, 1000)
  }

  async function handleResend() {
    if (resendCooldown) return
    setError('')
    startResendCountdown()
    try {
      if (otpChannel === 'msg91') {
        await msg91RetryOtp()
        return
      }
      const res = await fetch('/api/auth/otp/challenge', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mobile }),
      })
      const data: { ok: boolean; message?: string } = await res.json()
      if (!data.ok) setError(data.message ?? 'Could not resend OTP.')
    } catch {
      setError('Could not resend OTP. Please try again.')
    }
  }

  /* ── Step 4: OTP + consents → create account & session ── */
  async function handleOtpVerify(e: React.FormEvent) {
    e.preventDefault()
    if (otp.length < OTP_LENGTH)   { setError('Enter the OTP'); return }
    if (!consentTerms)    { setError('Please accept the Terms of Service to continue'); return }
    if (!consentPrivacy)  { setError('Please accept the Privacy Policy to continue'); return }
    setError('')
    setLoading(true)
    try {
      if (otpChannel === 'msg91') {
        let accessToken: string
        try {
          accessToken = await msg91VerifyOtp(otp)
        } catch {
          setError('Incorrect or expired OTP. Please try again.')
          return
        }
        const res  = await fetch('/api/auth/otp/msg91', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ mobile, accessToken, intent: 'register', consent_terms: consentTerms, consent_privacy: consentPrivacy }),
        })
        const data: { ok: boolean; message?: string } = await res.json()
        if (!data.ok) { setError(data.message ?? 'Verification failed. Please try again.'); return }
        setPassword('')
        setPasswordConfirm('')
        setStep('password')
        return
      }

      const res  = await fetch('/api/auth/otp/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mobile, code: otp, intent: 'register', consent_terms: consentTerms, consent_privacy: consentPrivacy }),
      })
      const data: { ok: boolean; message?: string } = await res.json()
      if (!data.ok) { setError(data.message ?? 'Verification failed. Please try again.'); return }
      setPassword('')
      setPasswordConfirm('')
      setStep('password')
    } catch {
      setError('Network error. Please check your connection and try again.')
    } finally {
      setLoading(false)
    }
  }

  /* ── Step 5: set password ── */
  async function handleSetPassword(e: React.FormEvent) {
    e.preventDefault()
    if (!strength.length || !strength.uppercase || !strength.lowercase || !strength.number) {
      setError('Password does not meet the requirements below.'); return
    }
    if (password !== passwordConfirm) { setError('Passwords do not match.'); return }
    setError('')
    setLoading(true)
    try {
      const res  = await fetch('/api/auth/password/set', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password }),
      })
      const data: { ok: boolean; message?: string } = await res.json()
      if (!data.ok) { setError(data.message ?? 'Could not save password. Please try again.'); return }
      window.location.href = '/profile'
    } catch {
      setError('Network error. Please check your connection and try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="w-full max-w-sm">
      <div className="text-center mb-8">
        <Link href="/" className="inline-block">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/logo.png" alt="Mithila Jodi" className="h-24 w-auto object-contain mx-auto" />
        </Link>
      </div>

      <div className="card p-6 sm:p-8">

        {/* ── Step: sent ── */}
        {step === 'sent' && <OtpSentAnimation mobile={maskedMobile} />}

        {/* ── Step 1: mobile ── */}
        {step === 'mobile' && (
          <>
            <p className="eyebrow mb-2">Register</p>
            <h2 className="text-xl font-display text-ink mb-6">Create your account</h2>
            <form onSubmit={handleMobileSubmit} noValidate>
              <label className="block mb-1.5">
                <span className="text-sm font-medium text-ink">Mobile number</span>
                <div className="mt-1.5 flex items-center border border-ink/20 rounded-mj bg-white overflow-hidden focus-within:ring-2 focus-within:ring-maroon/30">
                  <span className="px-3 py-3 text-ink-soft text-sm bg-paper border-r border-ink/20 font-mono select-none">+91</span>
                  <input
                    type="tel" inputMode="numeric" maxLength={10} placeholder="Enter 10-digit number"
                    value={mobile} autoFocus
                    onChange={e => { setError(''); setMobile(e.target.value.replace(/\D/g, '').slice(0, 10)) }}
                    className="flex-1 px-4 py-3 text-ink bg-transparent focus:outline-none text-base font-mono"
                  />
                </div>
              </label>
              {error && <p className="mt-3 text-sm text-terra">{error}</p>}
              <button type="submit" disabled={loading || mobile.length !== 10} className="btn btn-primary w-full mt-5">
                {loading ? 'Loading…' : 'Continue'}
              </button>
            </form>
            <p className="mt-5 text-center text-sm text-ink-soft">
              Already registered?{' '}
              <Link href="/login" className="text-maroon font-medium hover:underline">Log in</Link>
            </p>
          </>
        )}

        {/* ── Step 2: human verification ── */}
        {step === 'human' && (
          <>
            <p className="eyebrow mb-2">Quick Check</p>
            <h2 className="text-xl font-display text-ink mb-2">Solve this</h2>
            <p className="text-sm text-ink-soft mb-5">This confirms you&apos;re a real person.</p>
            <div className="rounded-mj bg-paper border border-gold/40 py-4 px-5 mb-5 text-center">
              <p className="text-2xl font-mono font-bold text-maroon tracking-wider">{challengeQ}</p>
            </div>
            <form onSubmit={handleHumanVerify} noValidate>
              <label className="block mb-1.5">
                <span className="text-sm font-medium text-ink">Your answer</span>
                <input
                  type="text" inputMode="numeric" maxLength={6} placeholder="Enter number"
                  value={humanAnswer} autoFocus
                  onChange={e => { setError(''); setHumanAnswer(e.target.value.replace(/\D/g, '')) }}
                  className="mt-1.5 block w-full px-4 py-3 text-center text-xl font-mono border border-ink/20 rounded-mj focus:ring-2 focus:ring-maroon/30 focus:outline-none bg-white text-ink"
                />
              </label>
              {error && <p className="mt-3 text-sm text-terra">{error}</p>}
              <button type="submit" disabled={loading || !humanAnswer.trim()} className="btn btn-primary w-full mt-5">
                {loading ? 'Verifying…' : 'Send OTP'}
              </button>
            </form>
            <div className="mt-4 text-center">
              <button type="button" onClick={() => { setStep('mobile'); setError('') }} className="text-sm text-ink-soft hover:text-ink hover:underline">
                ← Back
              </button>
            </div>
          </>
        )}

        {/* ── Step 4: OTP + consents ── */}
        {step === 'otp' && (
          <>
            <p className="eyebrow mb-2">Verify &amp; Agree</p>
            <h2 className="text-xl font-display text-ink mb-1">Enter the OTP</h2>
            <p className="text-sm text-ink-soft mb-6">
              Sent to <span className="font-mono font-medium text-ink">{maskedMobile}</span>
            </p>

            {/* 6-box OTP input */}
            <div className="mb-2">
              <OtpBoxInput
                value={otp}
                onChange={v => { setError(''); setOtp(v) }}
                onComplete={() => { if (consentTerms && consentPrivacy) handleOtpVerify({ preventDefault: () => {} } as React.FormEvent) }}
                disabled={loading}
                hasError={!!error}
                autoFocus
              />
            </div>

            {/* Loading dots */}
            {loading && (
              <div className="flex justify-center gap-1.5 my-3" aria-hidden="true">
                {[0, 1, 2].map(i => (
                  <div key={i} className="w-2 h-2 rounded-full bg-maroon"
                    style={{ animation: `bounce 0.7s ease-in-out ${i * 0.15}s infinite alternate` }} />
                ))}
                <style>{`@keyframes bounce { from { transform: translateY(0); } to { transform: translateY(-5px); } }`}</style>
              </div>
            )}

            <form onSubmit={handleOtpVerify} noValidate>
              <div className="mt-5 space-y-3 border-t border-ink/10 pt-5">
                <p className="text-xs text-ink-soft font-medium uppercase tracking-wide">Required consents</p>
                <label className="flex items-start gap-3 cursor-pointer">
                  <input type="checkbox" checked={consentTerms} onChange={e => { setError(''); setConsentTerms(e.target.checked) }} className="mt-0.5 h-4 w-4 rounded accent-maroon flex-shrink-0" />
                  <span className="text-sm text-ink-soft leading-relaxed">
                    I have read and agree to the{' '}
                    <Link href="/legal/terms" target="_blank" className="text-maroon hover:underline">Terms of Service</Link>
                  </span>
                </label>
                <label className="flex items-start gap-3 cursor-pointer">
                  <input type="checkbox" checked={consentPrivacy} onChange={e => { setError(''); setConsentPrivacy(e.target.checked) }} className="mt-0.5 h-4 w-4 rounded accent-maroon flex-shrink-0" />
                  <span className="text-sm text-ink-soft leading-relaxed">
                    I have read and agree to the{' '}
                    <Link href="/legal/privacy" target="_blank" className="text-maroon hover:underline">Privacy Policy</Link>
                    {' '}and consent to processing of my personal data
                  </span>
                </label>
              </div>
              {error && <p className="mt-3 text-sm text-terra text-center">{error}</p>}
              <button type="submit" disabled={loading || otp.length < OTP_LENGTH || !consentTerms || !consentPrivacy} className="btn btn-primary w-full mt-5">
                {loading ? 'Verifying…' : 'Verify & Continue'}
              </button>
            </form>

            <div className="mt-5 flex items-center justify-between text-sm text-ink-soft">
              <button type="button" onClick={() => { setStep('mobile'); setOtp(''); setError('') }} className="hover:text-ink hover:underline">
                ← Change number
              </button>
              <button type="button" onClick={handleResend} disabled={resendCooldown} className="hover:text-ink hover:underline disabled:opacity-40">
                {resendCooldown ? `Resend in ${resendTimer}s` : 'Resend OTP'}
              </button>
            </div>
          </>
        )}

        {/* ── Step 5: set password ── */}
        {step === 'password' && (
          <>
            <p className="eyebrow mb-2">Set Password</p>
            <h2 className="text-xl font-display text-ink mb-1">Create a password</h2>
            <p className="text-sm text-ink-soft mb-5">You&apos;ll use this to log in next time.</p>
            <form onSubmit={handleSetPassword} noValidate>
              <label className="block mb-1.5">
                <span className="text-sm font-medium text-ink">Password</span>
                <div className="mt-1.5 relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password} autoFocus autoComplete="new-password"
                    onChange={e => { setError(''); setPassword(e.target.value) }}
                    className="block w-full px-4 py-3 pr-12 border border-ink/20 rounded-mj focus:ring-2 focus:ring-maroon/30 focus:outline-none bg-white text-ink"
                  />
                  <button type="button" onClick={() => setShowPassword(s => !s)} className="absolute right-3 top-1/2 -translate-y-1/2 text-ink-soft hover:text-ink text-sm">
                    {showPassword ? 'Hide' : 'Show'}
                  </button>
                </div>
              </label>

              {/* Password strength checklist */}
              {password.length > 0 && (
                <ul className="mt-2 space-y-1">
                  {PASSWORD_RULES.map(rule => {
                    const passed = strength[rule.key] as boolean
                    return (
                      <li key={rule.key} className={`flex items-center gap-2 text-xs ${passed ? 'text-green-700' : rule.required ? 'text-terra' : 'text-ink-soft'}`}>
                        <span>{passed ? '✓' : '○'}</span>
                        <span>{rule.label}{!rule.required && ' (optional)'}</span>
                      </li>
                    )
                  })}
                </ul>
              )}

              <label className="block mt-4 mb-1.5">
                <span className="text-sm font-medium text-ink">Confirm password</span>
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={passwordConfirm} autoComplete="new-password"
                  onChange={e => { setError(''); setPasswordConfirm(e.target.value) }}
                  className="mt-1.5 block w-full px-4 py-3 border border-ink/20 rounded-mj focus:ring-2 focus:ring-maroon/30 focus:outline-none bg-white text-ink"
                />
              </label>
              {passwordConfirm.length > 0 && password !== passwordConfirm && (
                <p className="mt-1 text-xs text-terra">Passwords do not match</p>
              )}

              {error && <p className="mt-3 text-sm text-terra">{error}</p>}

              <button
                type="submit"
                disabled={loading || !strength.length || !strength.uppercase || !strength.lowercase || !strength.number || password !== passwordConfirm}
                className="btn btn-primary w-full mt-5"
              >
                {loading ? 'Saving…' : 'Complete Registration'}
              </button>
            </form>
          </>
        )}

      </div>
    </div>
  )
}

/* ── OTP Sent Animation ── */
function OtpSentAnimation({ mobile }: { mobile: string }) {
  const [show, setShow] = useState(false)
  useEffect(() => { const t = setTimeout(() => setShow(true), 60); return () => clearTimeout(t) }, [])
  return (
    <div className="flex flex-col items-center gap-5 py-6 text-center">
      <div
        className="relative w-20 h-20"
        style={{ transform: show ? 'scale(1)' : 'scale(0.5)', opacity: show ? 1 : 0, transition: 'transform 0.4s cubic-bezier(0.34,1.56,0.64,1), opacity 0.3s ease' }}
      >
        <div className="absolute inset-0 rounded-full border-4 border-gold animate-ping opacity-30" />
        <div className="absolute inset-0 rounded-full border-4 border-gold" />
        <div className="absolute inset-2 rounded-full bg-maroon flex items-center justify-center shadow-mj-xs">
          <svg width="32" height="32" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
            <path d="M 7 16 L 13 22 L 25 10" stroke="#E4C572" strokeWidth="2.8" strokeLinecap="round" strokeLinejoin="round"
              style={{ strokeDasharray: 24, strokeDashoffset: show ? 0 : 24, transition: 'stroke-dashoffset 0.45s ease 0.25s' }} />
          </svg>
        </div>
      </div>
      <div style={{ opacity: show ? 1 : 0, transform: show ? 'translateY(0)' : 'translateY(8px)', transition: 'opacity 0.35s ease 0.3s, transform 0.35s ease 0.3s' }}>
        <p className="font-serif text-xl text-maroon">OTP Sent!</p>
        <p className="text-sm text-ink-soft mt-1">Code sent to <span className="font-mono text-ink">{mobile}</span></p>
        <p className="text-xs text-ink-soft mt-3 opacity-60">Taking you to verification…</p>
      </div>
      <div className="flex gap-2" aria-hidden="true">
        {[0, 1, 2].map(i => (
          <div key={i} className="w-2 h-2 rounded-full bg-marigold" style={{ animation: `bounce 0.8s ease-in-out ${i * 0.15}s infinite alternate` }} />
        ))}
      </div>
      <style>{`@keyframes bounce { from { transform: translateY(0); } to { transform: translateY(-6px); } }`}</style>
    </div>
  )
}
