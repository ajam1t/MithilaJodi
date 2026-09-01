'use client'

import { useState } from 'react'
import { songEmbedUrl, type FestivalSong } from '@/lib/festivals'
import { cn } from '@/lib/utils/cn'

/**
 * Festival song list + a compact persistent player.
 *
 * Playback stays on Mithila Jodi: tapping a song mounts a single
 * youtube-nocookie embed in a docked player. Nothing links out to YouTube.
 *
 * Performance: exactly one iframe exists at a time, and it is created only
 * after the first tap — no embed is loaded on page view.
 */
export function SongsPlayer({ songs, festivalName }: { songs: FestivalSong[]; festivalName: string }) {
  const [activeIndex, setActiveIndex] = useState<number | null>(null)
  const active = activeIndex === null ? null : songs[activeIndex]

  return (
    <>
      <ol className="space-y-2.5">
        {songs.map((song, i) => {
          const isActive = i === activeIndex
          return (
            <li key={song.youtubeId}>
              <button
                type="button"
                onClick={() => setActiveIndex(i)}
                aria-current={isActive ? 'true' : undefined}
                className={cn(
                  'w-full flex items-center gap-3.5 rounded-mj-sm border p-3.5 sm:p-4 text-left min-h-[72px]',
                  'transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-gold',
                  isActive ? 'shadow-mj-xs' : 'hover:bg-cream'
                )}
                /* Inline so the active accent cannot be lost to utility-class
                   ordering — this is the primary "currently playing" signal. */
                style={
                  isActive
                    ? { borderColor: '#B98A2E', backgroundColor: 'rgba(185,138,46,0.10)' }
                    : { borderColor: '#ECDCC0', backgroundColor: 'rgba(252,245,231,0.6)' }
                }
              >
                <span
                  className={cn(
                    'flex-shrink-0 w-11 h-11 rounded-full flex items-center justify-center shadow-mj-xs',
                    isActive ? 'bg-gold text-maroon-deep' : 'bg-maroon-gradient text-cream'
                  )}
                  aria-hidden="true"
                >
                  {isActive ? (
                    /* equaliser bars — indicates the currently playing song */
                    <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
                      <rect x="2" y="5" width="2.6" height="6" rx="1" />
                      <rect x="6.7" y="2.5" width="2.6" height="11" rx="1" />
                      <rect x="11.4" y="6.5" width="2.6" height="3" rx="1" />
                    </svg>
                  ) : (
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M8 5v14l11-7z" />
                    </svg>
                  )}
                </span>

                <span className="min-w-0 flex-1">
                  <span className="block font-serif text-[16px] sm:text-[17px] text-maroon leading-snug">
                    {song.title}
                  </span>
                  {song.titleDeva && (
                    <span className="block font-deva text-[14px] text-ink-soft/90 leading-snug mt-0.5" lang="hi">
                      {song.titleDeva}
                    </span>
                  )}
                  <span className="block text-[12.5px] text-terra mt-1">{song.artist}</span>
                  <span className="block text-[12.5px] text-ink-soft leading-relaxed mt-0.5">
                    {song.note}
                  </span>
                </span>

                {isActive && (
                  <span className="flex-shrink-0 badge badge-gold self-start">Playing</span>
                )}
              </button>
            </li>
          )
        })}
      </ol>

      {/* Spacer so the docked player never covers the last song */}
      {active && <div className="h-[150px]" aria-hidden="true" />}

      {/* ── Compact persistent player ── */}
      {active && (
        <div
          className="fixed inset-x-0 bottom-16 lg:bottom-0 z-40 border-t-2 border-gold bg-cream shadow-[0_-8px_28px_-8px_rgba(58,20,12,0.35)] pb-[env(safe-area-inset-bottom)]"
          role="region"
          aria-label="Now playing"
        >
          <div className="gold-strip" aria-hidden="true" />
          <div className="wrap py-3">
            <div className="max-w-md mx-auto lg:max-w-2xl flex items-center gap-3.5 sm:gap-5">
              {/* Compact 16:9 embed — small enough that the song list stays usable */}
              <div className="relative w-[168px] sm:w-[200px] lg:w-[280px] flex-shrink-0 aspect-video rounded-mj-sm overflow-hidden bg-ink/90">
                <iframe
                  key={active.youtubeId}
                  src={songEmbedUrl(active.youtubeId)}
                  title={`${active.title} — ${active.artist}`}
                  className="absolute inset-0 w-full h-full"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                  referrerPolicy="strict-origin-when-cross-origin"
                  allowFullScreen
                />
              </div>

              <div className="flex items-start gap-3 flex-1 min-w-0">
                <div className="min-w-0 flex-1">
                  <p className="eyebrow mb-0.5">Now playing</p>
                  <p className="font-serif text-[15.5px] text-maroon leading-snug truncate">
                    {active.title}
                  </p>
                  <p className="text-[12.5px] text-ink-soft truncate">
                    {active.artist} · {festivalName}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setActiveIndex(null)}
                  aria-label="Stop and close the player"
                  className="flex-shrink-0 w-10 h-10 rounded-full border border-gold/40 text-maroon
                             hover:bg-gold/10 flex items-center justify-center transition-colors
                             focus:outline-none focus-visible:ring-2 focus-visible:ring-gold"
                >
                  <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round">
                    <path d="M6 6l12 12M18 6L6 18" />
                  </svg>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
