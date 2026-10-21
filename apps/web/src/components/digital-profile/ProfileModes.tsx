'use client'

import { useState, type ReactNode } from 'react'

/**
 * Story or Details — the same shared profile two ways: told as a scrolling
 * story, or as the full set of facts. Both are rendered from the one shared
 * projection, so neither can show more than the owner chose to share.
 */
export function ProfileModes({ story, details }: { story: ReactNode; details: ReactNode }) {
  const [mode, setMode] = useState<'story' | 'details'>('story')
  return (
    <>
      <div className="mj-modes" role="tablist" aria-label="How to view this profile">
        <span className="mj-modes-pill" data-at={mode} aria-hidden="true" />
        {(['story', 'details'] as const).map(m => (
          <button key={m} type="button" role="tab" aria-selected={mode === m} aria-controls={`dp-${m}`} id={`dp-tab-${m}`} onClick={() => setMode(m)} className="mj-modes-btn">
            {m === 'story' ? '✦ Story' : 'Details'}
          </button>
        ))}
      </div>
      <div id="dp-story" role="tabpanel" aria-labelledby="dp-tab-story" hidden={mode !== 'story'}>{story}</div>
      <div id="dp-details" role="tabpanel" aria-labelledby="dp-tab-details" hidden={mode !== 'details'} className="space-y-4">{details}</div>
    </>
  )
}
