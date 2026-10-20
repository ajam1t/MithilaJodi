'use client'

import { useState } from 'react'
import Link from 'next/link'
import { GOTRAS, checkGotras } from '@/lib/mithilaRoots'

/**
 * Two families' gotras in, the traditional verdict out — the same two checks
 * the match score applies (lib/matchScore): same paternal gotra, and a
 * paternal gotra that is the other side's maternal gotra. Runs entirely in the
 * browser; nothing is sent anywhere.
 */

function GotraSelect({ id, label, value, onChange, optional }: {
  id: string; label: string; value: string; onChange: (v: string) => void; optional?: boolean
}) {
  return (
    <div>
      <label htmlFor={id} className="field-label">{label}{optional && <span className="normal-case tracking-normal text-ink-soft"> (optional)</span>}</label>
      <select
        id={id}
        value={value}
        onChange={e => onChange(e.target.value)}
        className="mt-1 w-full border border-ink/20 rounded-mj-sm px-3 py-2 text-sm text-ink bg-white focus:outline-none focus:border-maroon"
      >
        <option value="">{optional ? 'Not known' : 'Choose a gotra'}</option>
        {GOTRAS.map(g => <option key={g.slug} value={g.slug}>{g.name} · {g.deva}</option>)}
        <option value="other">Not listed / other</option>
      </select>
    </div>
  )
}

export function GotraChecker({ initial = '' }: { initial?: string }) {
  const [a, setA] = useState({ self: initial, maternal: '' })
  const [b, setB] = useState({ self: '', maternal: '' })
  const v = checkGotras(a, b)

  const tone =
    v.kind === 'sagotra' ? 'border-terra/40 bg-terra/[0.06]'
      : v.kind === 'maternal' ? 'border-gold/60 bg-gold/[0.08]'
        : v.kind === 'clear' ? 'border-green/40 bg-green/[0.06]'
          : 'border-paper-3 bg-paper-2'

  return (
    <section className="card p-5 sm:p-6" aria-labelledby="gotra-check-heading">
      <h2 id="gotra-check-heading" className="font-serif text-maroon text-[19px] sm:text-[22px] leading-tight">
        Gotra match checker
      </h2>
      <p className="text-ink-soft text-[13.5px] mt-1 leading-relaxed">
        Choose both families’ gotras to see what the traditional Maithil checks say. Nothing you choose leaves this page.
      </p>
      <div className="grid sm:grid-cols-2 gap-5 mt-4">
        <fieldset className="space-y-3">
          <legend className="font-semibold text-ink text-[14px] mb-1">Your side</legend>
          <GotraSelect id="gc-a-self" label="Gotra" value={a.self} onChange={self => setA(s => ({ ...s, self }))} />
          <GotraSelect id="gc-a-mat" label="Maternal gotra" optional value={a.maternal} onChange={maternal => setA(s => ({ ...s, maternal }))} />
        </fieldset>
        <fieldset className="space-y-3">
          <legend className="font-semibold text-ink text-[14px] mb-1">The other family</legend>
          <GotraSelect id="gc-b-self" label="Gotra" value={b.self} onChange={self => setB(s => ({ ...s, self }))} />
          <GotraSelect id="gc-b-mat" label="Maternal gotra" optional value={b.maternal} onChange={maternal => setB(s => ({ ...s, maternal }))} />
        </fieldset>
      </div>

      <div className={`mt-5 rounded-mj-sm border px-4 py-3 ${tone}`} role="status" aria-live="polite">
        {v.kind === 'incomplete' && <p className="text-[14px] text-ink-soft">Choose a gotra for both sides.</p>}
        {v.kind === 'unknown' && (
          <p className="text-[14px] text-ink">A gotra that is not on this list cannot be checked here — ask the family elders or a Panjikar.</p>
        )}
        {v.kind === 'sagotra' && (
          <>
            <p className="font-semibold text-terra text-[15px]">Same gotra — {v.gotra}</p>
            <p className="text-[13.5px] text-ink mt-1 leading-relaxed">
              Both families are {v.gotra}. A sagotra match is traditionally avoided in Maithil practice, because the two
              families are counted as one lineage.
            </p>
          </>
        )}
        {v.kind === 'maternal' && (
          <>
            <p className="font-semibold text-maroon text-[15px]">Gotras differ — but {v.gotra} is a maternal gotra</p>
            <p className="text-[13.5px] text-ink mt-1 leading-relaxed">
              {v.whose === 'yours'
                ? `Their gotra, ${v.gotra}, is your maternal gotra.`
                : `Your gotra, ${v.gotra}, is their maternal gotra.`}{' '}
              Stricter families avoid this match too; many others go ahead after talking it through with elders.
            </p>
          </>
        )}
        {v.kind === 'clear' && (
          <>
            <p className="font-semibold text-green text-[15px]">No gotra clash</p>
            <p className="text-[13.5px] text-ink mt-1 leading-relaxed">
              The gotras differ, and neither is the other side’s maternal gotra. Families still confirm nearer
              relationships through their own records and elders.
            </p>
          </>
        )}
      </div>
      <p className="text-[12px] text-ink-soft mt-3 leading-relaxed">
        This is a tradition, not the law: the Hindu Marriage Act, 1955 sets rules on sapinda relationships and does not
        mention gotra. Practice varies between families and communities.{' '}
        <Link href="/blogs/gotra-family-lineage/same-gotra-marriage" className="text-maroon underline underline-offset-2">
          What the tradition says
        </Link>
      </p>
    </section>
  )
}
