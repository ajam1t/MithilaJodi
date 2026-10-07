'use client'

/** A failed console page: what happened, and what to do — never a stack trace. */
export default function ConsoleError({ reset }: { error: Error; reset: () => void }) {
  return (
    <div className="mx-auto max-w-lg rounded-xl border border-[#E8E1D5] bg-white px-6 py-8 text-center">
      <p className="text-[16px] font-semibold text-ink">This page could not load</p>
      <p className="mt-2 text-[13.5px] leading-relaxed text-ink-soft">
        A query behind it failed or timed out. Your data is safe — nothing was changed. Try again; if it keeps happening,
        check System → Health for a database or storage problem.
      </p>
      <div className="mt-5 flex justify-center gap-2">
        <button type="button" onClick={reset} className="rounded-lg bg-maroon px-4 py-2 text-[13.5px] font-medium text-white">Try again</button>
        <a href="/admin/system" className="rounded-lg border border-[#DDD3C2] px-4 py-2 text-[13.5px] font-medium">System health</a>
      </div>
    </div>
  )
}
