/**
 * The five-step Join progress, shared by /register (step 1) and /welcome
 * (steps 2–5) so the journey reads as one flow across the two pages.
 *
 * Compact on purpose: a thin segmented bar with the current step named, and
 * the step names underneath only where there is room for them.
 */

export const JOIN_STEPS = ['Account', 'About you', 'Mithila', 'Photo', 'Ready'] as const

export function JoinProgress({ current, className = '' }: { current: 1 | 2 | 3 | 4 | 5; className?: string }) {
  return (
    <div className={className}>
      <p className="flex items-baseline justify-between text-[12px] text-ink-soft">
        <span className="font-semibold uppercase tracking-[0.14em] text-terra">Step {current} of {JOIN_STEPS.length}</span>
        <span className="font-medium text-maroon">{JOIN_STEPS[current - 1]}</span>
      </p>
      <ol aria-label={`Join Mithila Jodi: step ${current} of ${JOIN_STEPS.length}, ${JOIN_STEPS[current - 1]}`} className="mt-1.5 grid grid-cols-5 gap-1">
        {JOIN_STEPS.map((label, i) => {
          const n = i + 1
          const state = n < current ? 'done' : n === current ? 'current' : 'todo'
          return (
            <li key={label} aria-current={state === 'current' ? 'step' : undefined} className="min-w-0">
              <span aria-hidden="true" className={`block h-1.5 rounded-full transition-colors duration-300 ${
                state === 'todo' ? 'bg-paper-3' : state === 'current' ? 'bg-gold' : 'bg-maroon'}`} />
              <span className={`mt-1 hidden truncate text-[10.5px] sm:block ${state === 'current' ? 'font-semibold text-maroon' : 'text-ink-soft'}`}>
                <span className="sr-only">{state === 'done' ? 'Completed: ' : state === 'current' ? 'Current: ' : ''}</span>{label}
              </span>
            </li>
          )
        })}
      </ol>
    </div>
  )
}
