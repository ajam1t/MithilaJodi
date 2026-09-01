'use client'
import { useState, useRef } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { checkPassword, PASSWORD_RULES } from '@/lib/password'
import { OtpBoxInput } from '@/components/OtpBoxInput'
import { OtpSentAnimation } from '@/components/OtpSentAnimation'
import { OTP_LENGTH } from '@/lib/constants'

type Step = 'mobile' | 'human' | 'sent' | 'otp' | 'new_password'

export default function ForgotPasswordPage() {
  const [step, setStep]                         = useState<Step>('mobile')
  const [mobile, setMobile]                     = useState('')
  const [challengeId, setChallengeId]           = useState('')
  const [challengeQ, setChallengeQ]             = useState('')
  const [humanAnswer, setHumanAnswer]           = useState('')
  const [otp, setOtp]                           = useState('')
  const [resetToken, setResetToken]             = useState('')
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

  function startResendCountdown() {
    setResendCooldown(true)
    setResendTimer(60)
    if (resendIntervalRef.current) clearInterval(resendIntervalRef.current)
    resendIntervalRef.current = setInterval(() => {
      setResendTimer(t => {
        if (t <= 1) { if (resendIntervalRef.current) clearInterval(resendIntervalRef.current); setResendCooldown(false); return 0 }
        return t - 1
      })
    }, 1000)
  }

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

      const otpRes  = await fetch('/api/auth/otp/challenge', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mobile }),
      })
      const otpData: { ok: boolean; message?: string } = await otpRes.json()
      if (!otpData.ok) { setError(otpData.message ?? 'Could not send OTP. Please try again.'); return }

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

  async function handleResend() {
    if (resendCooldown) return
    setError('')
    startResendCountdown()
    try {
      const res = await fetch('/api/auth/otp/challenge', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mobile }),
      })
      const data: { ok: boolean; message?: string } = await res.json()
      if (!data.ok) setError(data.message ?? 'Could not resend OTP.')
    } catch {
      setError('Network error. Please try again.')
    }
  }

  /* ── Step 4: verify OTP → get reset token ── */
  async function handleOtpVerify(e: React.FormEvent) {
    e.preventDefault()
    if (otp.length < OTP_LENGTH) { setError('Enter the OTP'); return }
    setError('')
    setLoading(true)
    try {
      const res  = await fetch('/api/auth/otp/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mobile, code: otp, intent: 'forgot_password' }),
      })
      const data: { ok: boolean; reset_token?: string; message?: string } = await res.json()
      if (!data.ok) { setError(data.message ?? 'Verification failed. Please try again.'); return }
      setResetToken(data.reset_token!)
      setPassword('')
      setPasswordConfirm('')
      setStep('new_password')
    } catch {
      setError('Network error. Please check your connection and try again.')
    } finally {
      setLoading(false)
    }
  }

  /* ── Step 5: set new password ── */
  async function handleResetPassword(e: React.FormEvent) {
    e.preventDefault()
    if (!strength.length || !strength.uppercase || !strength.lowercase || !strength.number) {
      setError('Password does not meet the requirements below.'); return
    }
    if (password !== passwordConfirm) { setError('Passwords do not match.'); return }
    setError('')
    setLoading(true)
    try {
      const res  = await fetch('/api/auth/password/reset', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reset_token: resetToken, password }),
      })
      const data: { ok: boolean; message?: string } = await res.json()
      if (!data.ok) { setError(data.message ?? 'Could not reset password. Please try again.'); return }
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
          <Image
            src="/logo.png"
            alt="Mithila Jodi"
            width={96}
            height={96}
            priority
            className="h-24 w-auto object-contain mx-auto"
          />
        </Link>
      </div>

      <div className="card p-6 sm:p-8">

        {step === 'sent' && <OtpSentAnimation mobile={maskedMobile} />}

        {/* ── Step 1: mobile ── */}
        {step === 'mobile' && (
          <>
            <p className="eyebrow mb-2">Forgot Password</p>
            <h2 className="text-xl font-display text-ink mb-2">Reset your password</h2>
            <p className="text-sm text-ink-soft mb-6">Enter your registered mobile number to continue.</p>
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
              <Link href="/login" className="text-maroon font-medium hover:underline">← Back to login</Link>
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

        {/* ── Step 4: OTP entry ── */}
        {step === 'otp' && (
          <>
            <p className="eyebrow mb-2">Verify OTP</p>
            <h2 className="text-xl font-display text-ink mb-1">Enter the code</h2>
            <p className="text-sm text-ink-soft mb-6">Sent to <span className="font-mono text-ink">{maskedMobile}</span></p>
            <div className="mb-2">
              <OtpBoxInput
                value={otp}
                onChange={v => { setError(''); setOtp(v) }}
                onComplete={() => handleOtpVerify({ preventDefault: () => {} } as React.FormEvent)}
                disabled={loading}
                hasError={!!error}
                autoFocus
              />
            </div>
            {error && <p className="mt-3 text-sm text-terra text-center">{error}</p>}
            <form onSubmit={handleOtpVerify} noValidate>
              <button type="submit" disabled={loading || otp.length < OTP_LENGTH} className="btn btn-primary w-full mt-5">
                {loading ? 'Verifying…' : 'Verify OTP'}
              </button>
            </form>
            <div className="mt-5 flex items-center justify-between text-sm text-ink-soft">
              <button type="button" onClick={() => { setStep('mobile'); setOtp(''); setError('') }} className="hover:text-ink hover:underline">
                ← Start over
              </button>
              <button type="button" onClick={handleResend} disabled={resendCooldown} className="hover:text-ink hover:underline disabled:opacity-40">
                {resendCooldown ? `Resend in ${resendTimer}s` : 'Resend OTP'}
              </button>
            </div>
          </>
        )}

        {/* ── Step 5: new password ── */}
        {step === 'new_password' && (
          <>
            <p className="eyebrow mb-2">New Password</p>
            <h2 className="text-xl font-display text-ink mb-1">Set a new password</h2>
            <p className="text-sm text-ink-soft mb-5">Choose a strong password for your account.</p>
            <form onSubmit={handleResetPassword} noValidate>
              <label className="block mb-1.5">
                <span className="text-sm font-medium text-ink">New password</span>
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

              {password.length > 0 && (
                <ul className="mt-2 space-y-1">
                  {PASSWORD_RULES.map(rule => {
                    const passed = strength[rule.key] as boolean
                    return (
                      <li key={rule.key} className={`flex items-center gap-2 text-xs ${passed ? 'text-success' : rule.required ? 'text-terra' : 'text-ink-soft'}`}>
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
                {loading ? 'Saving…' : 'Set New Password'}
              </button>
            </form>
          </>
        )}

      </div>
    </div>
  )
}
