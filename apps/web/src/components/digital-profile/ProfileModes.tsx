'use client'

import { useState, type ReactNode } from 'react'

/**
 * Story, Details or Contact — the same shared profile told as a scrolling
 * story, as the full set of facts, or as how to reach the family. All are rendered from the one shared
 * projection, so neither can show more than the owner chose to share.
 */
type Mode = 'story' | 'details' | 'contact'

export function ProfileModes({ story, details, contact }: { story: ReactNode; details: ReactNode; contact?: ReactNode }) {
  const [mode, setMode] = useState<Mode>('story')
  const modes: Mode[] = contact ? ['story', 'details', 'contact'] : ['story', 'details']
  return (
    <>
      <div className="mj-modes" role="tablist" aria-label="How to view this profile" style={{ gridTemplateColumns: `repeat(${modes.length}, 1fr)` }}>
        <span className="mj-modes-pill" aria-hidden="true" style={{ width: `calc(${100 / modes.length}% - ${8 / modes.length}px)`, transform: `translateX(${modes.indexOf(mode) * 100}%)` }} />
        {modes.map(m => (
          <button key={m} type="button" role="tab" aria-selected={mode === m} aria-controls={`dp-${m}`} id={`dp-tab-${m}`} onClick={() => setMode(m)} className="mj-modes-btn">
            {m === 'story' ? '✦ Story' : m === 'details' ? 'Details' : 'Contact'}
          </button>
        ))}
      </div>
      <div id="dp-story" role="tabpanel" aria-labelledby="dp-tab-story" hidden={mode !== 'story'}>{story}</div>
      <div id="dp-details" role="tabpanel" aria-labelledby="dp-tab-details" hidden={mode !== 'details'} className="space-y-4">{details}</div>
      {contact && <div id="dp-contact" role="tabpanel" aria-labelledby="dp-tab-contact" hidden={mode !== 'contact'}>{contact}</div>}
    </>
  )
}
