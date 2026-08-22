'use client'
import { useRef } from 'react'

interface OtpBoxInputProps {
  value: string
  onChange: (val: string) => void
  onComplete?: (val: string) => void
  disabled?: boolean
  hasError?: boolean
  autoFocus?: boolean
  length?: number
}

export function OtpBoxInput({
  value,
  onChange,
  onComplete,
  disabled,
  hasError,
  autoFocus,
  length = 6,
}: OtpBoxInputProps) {
  const refs = useRef<(HTMLInputElement | null)[]>([])

  function focusAt(i: number) {
    refs.current[Math.max(0, Math.min(i, length - 1))]?.focus()
  }

  function handleChange(i: number, e: React.ChangeEvent<HTMLInputElement>) {
    const raw = e.target.value.replace(/\D/g, '')
    if (!raw) return

    if (raw.length > 1) {
      // Paste / autofill of full OTP in a single box
      const next = raw.slice(0, length)
      onChange(next)
      focusAt(next.length >= length ? length - 1 : next.length)
      if (next.length >= length) onComplete?.(next)
      return
    }

    const arr = (value + ' '.repeat(length)).split('').slice(0, length)
    arr[i] = raw
    const next = arr.join('').replace(/\s/g, '').slice(0, length)
    onChange(next)
    if (i < length - 1) focusAt(i + 1)
    if (next.length >= length) onComplete?.(next)
  }

  function handleKeyDown(i: number, e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Backspace') {
      e.preventDefault()
      const ch = value[i]
      if (ch) {
        const next = value.slice(0, i) + value.slice(i + 1)
        onChange(next)
      } else if (i > 0) {
        const next = value.slice(0, i - 1) + value.slice(i)
        onChange(next)
        focusAt(i - 1)
      }
    } else if (e.key === 'ArrowLeft' && i > 0) {
      e.preventDefault(); focusAt(i - 1)
    } else if (e.key === 'ArrowRight' && i < length - 1) {
      e.preventDefault(); focusAt(i + 1)
    }
  }

  function handlePaste(e: React.ClipboardEvent) {
    e.preventDefault()
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, length)
    if (!pasted) return
    onChange(pasted)
    focusAt(pasted.length >= length ? length - 1 : pasted.length)
    if (pasted.length >= length) onComplete?.(pasted)
  }

  return (
    <div className="flex gap-2 sm:gap-3 justify-center" role="group" aria-label="One-time password input">
      {Array.from({ length }, (_, i) => {
        const digit = value[i] ?? ''
        const filled = digit !== ''
        return (
          <input
            key={i}
            ref={el => { refs.current[i] = el }}
            type="text"
            inputMode="numeric"
            pattern="[0-9]*"
            maxLength={6}
            value={digit}
            autoFocus={autoFocus && i === 0}
            autoComplete={i === 0 ? 'one-time-code' : 'off'}
            disabled={disabled}
            aria-label={`Digit ${i + 1} of ${length}`}
            onKeyDown={e => handleKeyDown(i, e)}
            onChange={e => handleChange(i, e)}
            onPaste={handlePaste}
            onFocus={e => e.target.select()}
            className={[
              'w-11 h-14 sm:w-12 sm:h-14 text-center text-xl font-mono font-bold rounded-mj',
              'border-2 transition-all duration-150 focus:outline-none',
              hasError
                ? 'border-terra bg-terra/5 text-terra'
                : filled
                  ? 'border-maroon bg-maroon/5 text-maroon focus:ring-2 focus:ring-maroon/20'
                  : 'border-ink/20 bg-white text-ink focus:border-maroon focus:ring-2 focus:ring-maroon/20',
              disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-text',
            ].join(' ')}
          />
        )
      })}
    </div>
  )
}
