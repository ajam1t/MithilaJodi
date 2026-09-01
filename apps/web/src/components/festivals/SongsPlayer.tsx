'use client'

import { useMemo } from 'react'
import { useMusicPlayer, type PlayerTrack } from '@/components/music/MusicPlayerContext'
import type { FestivalSong } from '@/lib/festivals'
import { cn } from '@/lib/utils/cn'

/**
 * Festival song list.
 *
 * Each row is a <button> that loads the song into the GLOBAL player
 * (see components/music/MusicPlayerContext). There is no anchor, no
 * window.open and no YouTube URL used for navigation anywhere here — the
 * listener stays on mithilajodi.com and the persistent player in the root
 * layout keeps playing as they move between pages.
 *
 * Selecting a song sets the whole festival as the queue, so previous/next
 * work and playback rolls on to the next geet automatically.
 */
export function SongsPlayer({
  songs,
  festivalName,
  festivalSlug,
}: {
  songs: FestivalSong[]
  festivalName: string
  festivalSlug: string
}) {
  const { currentTrack, isPlaying, unavailable, playTrack, toggle } = useMusicPlayer()

  const queue = useMemo<PlayerTrack[]>(
    () =>
      songs.map((s) => ({
        youtubeId: s.youtubeId,
        title: s.title,
        titleDeva: s.titleDeva,
        artist: s.artist,
        festivalSlug,
        festivalName,
      })),
    [songs, festivalSlug, festivalName]
  )

  return (
    <ol className="space-y-2.5">
      {songs.map((song, i) => {
        const isCurrent = currentTrack?.youtubeId === song.youtubeId
        const isDead = unavailable.has(song.youtubeId)
        const nowPlaying = isCurrent && isPlaying

        return (
          <li key={song.youtubeId}>
            <button
              type="button"
              onClick={() => (isCurrent ? toggle() : playTrack(queue[i], queue))}
              aria-current={isCurrent ? 'true' : undefined}
              aria-label={
                isCurrent
                  ? `${nowPlaying ? 'Pause' : 'Resume'} ${song.title}`
                  : `Play ${song.title} by ${song.artist}`
              }
              className={cn(
                'w-full flex items-center gap-3.5 rounded-mj-sm border p-3.5 sm:p-4 text-left min-h-[72px]',
                'transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-gold',
                isCurrent ? 'shadow-mj-xs' : 'hover:bg-cream'
              )}
              /* Inline so the active accent cannot be lost to utility-class
                 ordering — this is the primary "currently playing" signal. */
              style={
                isCurrent
                  ? { borderColor: '#B98A2E', backgroundColor: 'rgba(185,138,46,0.10)' }
                  : { borderColor: '#ECDCC0', backgroundColor: 'rgba(252,245,231,0.6)' }
              }
            >
              <span
                className={cn(
                  'flex-shrink-0 w-11 h-11 rounded-full flex items-center justify-center shadow-mj-xs',
                  isCurrent ? 'bg-gold text-maroon-deep' : 'bg-maroon-gradient text-cream'
                )}
                aria-hidden="true"
              >
                {nowPlaying ? (
                  /* equaliser bars — this song is currently playing */
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

              {isDead ? (
                <span className="flex-shrink-0 badge badge-error self-start">Unavailable</span>
              ) : nowPlaying ? (
                <span className="flex-shrink-0 badge badge-gold self-start">Playing</span>
              ) : isCurrent ? (
                <span className="flex-shrink-0 badge badge-warning self-start">Paused</span>
              ) : null}
            </button>
          </li>
        )
      })}
    </ol>
  )
}
