'use client'

import { useMemo, useState } from 'react'
import { MOOLS } from '@/lib/mithilaRoots'

/** The full mool list with a filter box; every name is in the HTML, so all of it is indexable. */
export function MoolList() {
  const [q, setQ] = useState('')
  const shown = useMemo(() => {
    const t = q.trim().toLowerCase()
    return t ? MOOLS.filter(m => m.toLowerCase().includes(t)) : MOOLS
  }, [q])
  return (
    <section className="card p-5 sm:p-6" aria-labelledby="mool-list-heading">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 id="mool-list-heading" className="font-serif text-maroon text-[19px] sm:text-[22px] leading-tight">All {MOOLS.length} mools</h2>
          <p className="text-ink-soft text-[13px] mt-0.5">Spelling variants are listed separately, as families write them.</p>
        </div>
        <label className="w-full sm:w-64">
          <span className="sr-only">Find a mool</span>
          <input
            type="search"
            value={q}
            onChange={e => setQ(e.target.value)}
            placeholder="Find your mool…"
            className="w-full border border-ink/20 rounded-mj-sm px-3 py-2 text-sm text-ink bg-white focus:outline-none focus:border-maroon"
          />
        </label>
      </div>
      <ul className="mt-4 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-x-4 gap-y-1.5">
        {shown.map(m => (
          <li key={m} className="text-[14px] text-ink flex items-center gap-2">
            <span className="h-1.5 w-1.5 rotate-45 bg-gold shrink-0" aria-hidden="true" />
            {m}
          </li>
        ))}
      </ul>
      {shown.length === 0 && (
        <p className="mt-4 text-[13.5px] text-ink-soft">
          Not on the list? Spellings vary a lot — try the first few letters. If your mool is missing, you can still write
          it on your profile and biodata.
        </p>
      )}
    </section>
  )
}
