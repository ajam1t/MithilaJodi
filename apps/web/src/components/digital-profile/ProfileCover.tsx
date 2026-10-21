'use client'

import { useEffect, useRef, useState } from 'react'

/**
 * The cover of a Digital Profile — the first thing a family sees when they
 * open the link. The main photograph in a Mithila arch with a holographic
 * gold rim and a slow orbit; a drifting gradient mesh over a faint blueprint
 * grid; gold dust; the name rising in; and one line on split-flap tiles that
 * turns through the person's facts (where they live, their roots, gotra,
 * work). Every fact comes from the shared projection, so nothing appears that
 * the owner did not share. prefers-reduced-motion: still, first fact only.
 */

export type CoverFact = { lead: string; word: string }

const FLAP = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'
const TILES = 12

function FlapFacts({ facts }: { facts: CoverFact[] }) {
  const fit = (w: string) => w.toUpperCase().slice(0, TILES)
  const [i, setI] = useState(0)
  const [shown, setShown] = useState(fit(facts[0]?.word ?? ''))
  const last = useRef(shown)

  useEffect(() => {
    if (facts.length < 2 || window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) return
    const id = window.setInterval(() => setI(k => (k + 1) % facts.length), 3600)
    return () => window.clearInterval(id)
  }, [facts.length])

  useEffect(() => {
    const target = fit(facts[i]?.word ?? '')
    const from = last.current.padEnd(TILES, ' '), to = target.padEnd(TILES, ' ')
    last.current = target
    if (from === to) return
    let step = 0
    const id = window.setInterval(() => {
      step++
      setShown(Array.from(to, (ch, k) => (ch === from[k] || step >= 2 + k * 0.9 ? ch : FLAP[(step * 7 + k * 5) % FLAP.length])).join('').trimEnd())
      if (step >= 2 + TILES * 0.9) window.clearInterval(id)
    }, 45)
    return () => window.clearInterval(id)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [i])

  const f = facts[i]
  if (!f) return null
  return (
    <div className="dpc-flap" aria-live="off">
      <span key={f.lead} className="dpc-flap-lead">{f.lead}</span>
      <span className="mj-flaps mj-flaps-sm dpc-flap-tiles" aria-hidden="true">
        {Array.from(shown.padEnd(Math.max(shown.length, 1), ' '), (ch, k) => (
          <span key={k} className="mj-flap"><span key={ch}>{ch === ' ' ? ' ' : ch}</span></span>
        ))}
      </span>
      <span className="sr-only">{facts.map(x => `${x.lead} ${x.word}`).join('. ')}</span>
    </div>
  )
}

export function ProfileCover({
  name, meta, place, photo, facts, chips, note, demo, headingLevel = 'h1',
}: {
  name: string
  meta: string
  place: string
  photo: string | null
  facts: CoverFact[]
  chips: string[]
  note: string | null
  demo: boolean
  headingLevel?: 'h1' | 'h3'
}) {
  const H = headingLevel
  const first = name.split(' ')[0]
  return (
    <header className="dpc" aria-label={`${name} — Digital Profile`}>
      <div className="dpc-mesh" aria-hidden="true"><i /><i /><i /></div>
      <div className="dpc-dust" aria-hidden="true">{Array.from({ length: 14 }, (_, k) => <i key={k} style={{ '--k': k } as React.CSSProperties} />)}</div>

      <p className="dpc-eyebrow">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/logo-mark.png" alt="" width={22} height={20} />
        Mithila Jodi <span aria-hidden="true">·</span> Digital Profile
      </p>

      <div className="dpc-stage">
        <svg viewBox="0 0 240 280" className="dpc-orbit" aria-hidden="true">
          <ellipse cx="120" cy="150" rx="112" ry="128" fill="none" stroke="#B98A2E" strokeOpacity=".35" strokeDasharray="2 6" />
          <g className="dpc-orbit-dot"><circle cx="120" cy="22" r="4" fill="#E9C977" /><circle cx="120" cy="22" r="9" fill="#E9C977" opacity=".25" /></g>
        </svg>
        <div className="dpc-arch">
          <div className="dpc-arch-in">
            {photo
              // eslint-disable-next-line @next/next/no-img-element
              ? <img src={photo} alt={demo ? '' : `${first}'s photo`} />
              : <span className="dpc-mono">{first[0]?.toUpperCase()}</span>}
          </div>
        </div>
      </div>

      <H className="dpc-name">
        {name.split(' ').map((w, k) => <span key={k} style={{ '--w': k } as React.CSSProperties}>{w}&nbsp;</span>)}
      </H>
      {meta && <p className="dpc-meta">{meta}</p>}
      {place && <p className="dpc-place"><svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true"><path d="M12 21s-6.5-5.6-6.5-11a6.5 6.5 0 0 1 13 0c0 5.4-6.5 11-6.5 11Z" /><circle cx="12" cy="10" r="2.3" /></svg>{place}</p>}

      {facts.length > 0 && <FlapFacts facts={facts} />}

      {chips.length > 0 && (
        <ul className="dpc-chips" aria-label="Community">
          {chips.map(c => <li key={c}>{c}</li>)}
        </ul>
      )}
      {note && <p className="dpc-note">{note}</p>}
    </header>
  )
}
