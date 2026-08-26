type AuthProgressProps = {
  steps: string[]
  current: number
}

/** Small, accessible progress indicator shared by login and registration flows. */
export function AuthProgress({ steps, current }: AuthProgressProps) {
  return (
    <ol aria-label="Authentication progress" className="mb-6 flex items-start">
      {steps.map((label, index) => {
        const step = index + 1
        const complete = step < current
        const active = step === current

        return (
          <li key={label} className="flex min-w-0 flex-1 items-start last:flex-none">
            <div className="flex min-w-0 flex-col items-center">
              <span
                aria-current={active ? 'step' : undefined}
                className={`flex h-7 w-7 items-center justify-center rounded-full border text-xs font-semibold transition-colors ${
                  complete || active
                    ? 'border-maroon bg-maroon text-gold-lt'
                    : 'border-ink/20 bg-paper text-ink-soft'
                }`}
              >
                {complete ? '✓' : step}
              </span>
              <span className={`mt-1.5 max-w-[72px] text-center text-[10px] leading-tight ${active ? 'font-semibold text-maroon' : 'text-ink-soft'}`}>
                {label}
              </span>
            </div>
            {index < steps.length - 1 && (
              <span aria-hidden="true" className={`mx-1.5 mt-3 h-px min-w-3 flex-1 ${complete ? 'bg-maroon/60' : 'bg-ink/15'}`} />
            )}
          </li>
        )
      })}
    </ol>
  )
}
