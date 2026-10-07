'use client'

import { useState } from 'react'
import type { GeoState } from '@/lib/adminData'

/*
 * Members by state as a tile-grid map: every state and UT is one equal square
 * placed roughly where it sits, so small states (Delhi, Goa, Tripura) are as
 * readable as large ones. Colour is one hue, light → dark, by member count;
 * the count is also printed on each tile and listed in the table, so colour is
 * never the only carrier. Aggregates only — nothing below city level exists here.
 */

// [state code, column, row] — 9 columns × 7 rows.
const GRID: Array<[string, number, number]> = [
  ['IN-JK', 2, 0], ['IN-LA', 3, 0],
  ['IN-PB', 1, 1], ['IN-HP', 2, 1], ['IN-UK', 3, 1], ['IN-AR', 8, 1],
  ['IN-CH', 0, 2], ['IN-HR', 1, 2], ['IN-DL', 2, 2], ['IN-UP', 3, 2], ['IN-BR', 4, 2], ['IN-SK', 5, 2], ['IN-AS', 7, 2], ['IN-NL', 8, 2],
  ['IN-RJ', 1, 3], ['IN-MP', 2, 3], ['IN-CT', 3, 3], ['IN-JH', 4, 3], ['IN-WB', 5, 3], ['IN-ML', 6, 3], ['IN-TR', 7, 3], ['IN-MN', 8, 3],
  ['IN-GJ', 0, 4], ['IN-DH', 1, 4], ['IN-MH', 2, 4], ['IN-TS', 3, 4], ['IN-OR', 4, 4], ['IN-MZ', 7, 4],
  ['IN-GA', 1, 5], ['IN-KA', 2, 5], ['IN-AP', 3, 5],
  ['IN-LD', 0, 6], ['IN-KL', 2, 6], ['IN-TN', 3, 6], ['IN-PY', 4, 6], ['IN-AN', 6, 6],
]

const NAMES: Record<string, string> = {
  'IN-AN': 'Andaman & Nicobar', 'IN-AP': 'Andhra Pradesh', 'IN-AR': 'Arunachal Pradesh', 'IN-AS': 'Assam', 'IN-BR': 'Bihar',
  'IN-CH': 'Chandigarh', 'IN-CT': 'Chhattisgarh', 'IN-DH': 'Dadra & Nagar Haveli and Daman & Diu', 'IN-DL': 'Delhi', 'IN-GA': 'Goa',
  'IN-GJ': 'Gujarat', 'IN-HP': 'Himachal Pradesh', 'IN-HR': 'Haryana', 'IN-JH': 'Jharkhand', 'IN-JK': 'Jammu & Kashmir',
  'IN-KA': 'Karnataka', 'IN-KL': 'Kerala', 'IN-LA': 'Ladakh', 'IN-LD': 'Lakshadweep', 'IN-MH': 'Maharashtra', 'IN-ML': 'Meghalaya',
  'IN-MN': 'Manipur', 'IN-MP': 'Madhya Pradesh', 'IN-MZ': 'Mizoram', 'IN-NL': 'Nagaland', 'IN-OR': 'Odisha', 'IN-PB': 'Punjab',
  'IN-PY': 'Puducherry', 'IN-RJ': 'Rajasthan', 'IN-SK': 'Sikkim', 'IN-TN': 'Tamil Nadu', 'IN-TR': 'Tripura', 'IN-TS': 'Telangana',
  'IN-UK': 'Uttarakhand', 'IN-UP': 'Uttar Pradesh', 'IN-WB': 'West Bengal',
}

// Sequential maroon ramp, light → dark; index 0 is "no members".
const RAMP = ['#F4EFE7', '#F2D9DC', '#E3AAB1', '#CC6E7B', '#B3424F', '#7A1220']

export function IndiaTileMap({ states }: { states: GeoState[] }) {
  const byCode = new Map(states.filter(s => s.code).map(s => [s.code!, s]))
  const max = Math.max(1, ...states.map(s => Number(s.total)))
  const [sel, setSel] = useState<string | null>(states[0]?.code ?? null)
  const level = (n: number) => (n <= 0 ? 0 : Math.min(5, 1 + Math.floor(((n - 1) / max) * 5)))
  const picked = sel ? byCode.get(sel) : undefined

  return (
    <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_300px]">
      <div>
        <div className="mx-auto grid max-w-[560px] grid-cols-9 gap-1" role="group" aria-label="Members by state — select a state for details">
          {Array.from({ length: 7 * 9 }, (_, i) => {
            const col = i % 9
            const row = Math.floor(i / 9)
            const cell = GRID.find(([, c, r]) => c === col && r === row)
            if (!cell) return <div key={i} aria-hidden="true" />
            const code = cell[0]
            const s = byCode.get(code)
            const n = s ? Number(s.total) : 0
            const lv = level(n)
            return (
              <button
                key={code}
                type="button"
                onClick={() => setSel(code)}
                aria-pressed={sel === code}
                aria-label={`${NAMES[code]}: ${n} ${n === 1 ? 'member' : 'members'}`}
                title={`${NAMES[code]} — ${n}`}
                className={`flex aspect-square flex-col items-center justify-center rounded-md text-center transition-shadow ${sel === code ? 'ring-2 ring-ink ring-offset-1' : 'hover:ring-1 hover:ring-ink/40'}`}
                style={{ background: RAMP[lv], color: lv >= 4 ? '#fff' : '#2B211C' }}
              >
                <span className="text-[10px] font-semibold leading-none sm:text-[11.5px]">{code.slice(3)}</span>
                {n > 0 && <span className="mt-0.5 text-[10px] tabular-nums leading-none sm:text-[11px]">{n}</span>}
              </button>
            )
          })}
        </div>
        <div className="mx-auto mt-3 flex max-w-[560px] items-center gap-2 text-[11.5px] text-ink-soft" aria-hidden="true">
          <span>Fewer</span>
          {RAMP.slice(1).map(c => <span key={c} className="h-2.5 w-6 rounded-sm" style={{ background: c }} />)}
          <span>More members</span>
          <span className="ml-3 h-2.5 w-6 rounded-sm" style={{ background: RAMP[0] }} /> <span>none</span>
        </div>
      </div>

      <div className="rounded-lg border border-[#EFE9DF] p-4" aria-live="polite">
        {sel ? (
          <>
            <p className="text-[15px] font-semibold text-ink">{NAMES[sel]}</p>
            {picked ? (
              <>
                <dl className="mt-3 grid grid-cols-2 gap-3 text-[13px]">
                  <div><dt className="text-ink-soft">Members</dt><dd className="text-[20px] font-semibold tabular-nums">{picked.total}</dd></div>
                  <div><dt className="text-ink-soft">New (30 days)</dt><dd className="text-[20px] font-semibold tabular-nums">{picked.new_30d}</dd></div>
                  <div><dt className="text-ink-soft">Female</dt><dd className="tabular-nums">{picked.female}</dd></div>
                  <div><dt className="text-ink-soft">Male</dt><dd className="tabular-nums">{picked.male}</dd></div>
                  <div className="col-span-2"><dt className="text-ink-soft">Active in 30 days</dt><dd className="tabular-nums">{picked.active_30d}</dd></div>
                </dl>
                <p className="mt-4 text-[12px] font-semibold uppercase tracking-wide text-ink-soft">Main cities</p>
                {picked.cities?.length ? (
                  <ul className="mt-1 space-y-1 text-[13px]">
                    {picked.cities.map(c => <li key={c.city} className="flex justify-between"><span>{c.city}</span><span className="tabular-nums text-ink-soft">{c.n}</span></li>)}
                  </ul>
                ) : <p className="mt-1 text-[12.5px] text-ink-soft">Members here set only their state.</p>}
              </>
            ) : <p className="mt-2 text-[13px] text-ink-soft">No members have set a location in this state yet.</p>}
          </>
        ) : <p className="text-[13px] text-ink-soft">Select a state.</p>}
      </div>
    </div>
  )
}
