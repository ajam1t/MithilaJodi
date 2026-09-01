'use client'

import { useEffect, useRef, useState } from 'react'
import { formatTime, useMusicPlayer, type PlayerTrack } from './MusicPlayerContext'
import { cn } from '@/lib/utils/cn'

/**
 * Global persistent mini player, mounted in the root layout so it survives
 * navigation between Mithila Jodi pages.
 *
 * The YouTube iframe lives here and is SANDBOXED without `allow-popups` and
 * without `allow-top-navigation`, so nothing inside the frame — including
 * YouTube's own branding links — can navigate the browser off mithilajodi.com.
 * `enablejsapi=1` lets MusicPlayerContext attach the IFrame Player API to it.
 */

function Icon({ d, size = 20, fill = 'currentColor' }: { d: string; size?: number; fill?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill={fill} aria-hidden="true">
      <path d={d} />
    </svg>
  )
}

const PATH = {
  play: 'M8 5v14l11-7z',
  pause: 'M6 5h4v14H6zM14 5h4v14h-4z',
  prev: 'M6 6h2v12H6zm3.5 6L18 6v12z',
  next: 'M16 6h2v12h-2zM6 6l8.5 6L6 18z',
  close: 'M6.4 5 5 6.4 10.6 12 5 17.6 6.4 19 12 13.4 17.6 19 19 17.6 13.4 12 19 6.4 17.6 5 12 10.6z',
  vol: 'M3 10v4h3l4 4V6L6 10zm11.5 2a4 4 0 0 0-2-3.46v6.92A4 4 0 0 0 14.5 12z',
  mute: 'M3 10v4h3l4 4V6L6 10zm13.6 2 2.4-2.4-1.2-1.2L15.4 10.8 13 8.4l-1.2 1.2 2.4 2.4-2.4 2.4 1.2 1.2 2.4-2.4 2.4 2.4 1.2-1.2z',
  chevronUp: 'M12 8l6 6H6z',
  chevronDown: 'M12 16 6 10h12z',
}

export function PersistentPlayer() {
  const { currentTrack } = useMusicPlayer()
  if (!currentTrack) return null
  return <PlayerBar track={currentTrack} />
}

/**
 * Mounted only while a track is selected. The iframe src is captured from the
 * FIRST track (via a ref) and never changes, so the element is stable across
 * track changes — subsequent tracks are loaded with loadVideoById commands.
 * A remounting iframe would detach the YouTube API player.
 */
function PlayerBar({ track: currentTrack }: { track: PlayerTrack }) {
  const {
    queue, isPlaying, currentTime, duration, volume, muted, unavailable,
    toggle, next, previous, seek, setVolume, toggleMute, closePlayer,
  } = useMusicPlayer()

  const [expanded, setExpanded] = useState(false)
  const initialIdRef = useRef(currentTrack.youtubeId)

  // Keep page content clear of the fixed bar.
  useEffect(() => {
    document.body.style.paddingBottom = expanded ? '340px' : '150px'
    return () => { document.body.style.paddingBottom = '' }
  }, [expanded])

  const isDead = unavailable.has(currentTrack.youtubeId)
  const pct = duration > 0 ? Math.min(100, (currentTime / duration) * 100) : 0
  const hasQueue = queue.length > 1

  // enablejsapi lets the context attach YT.Player. controls=0 because our own
  // UI drives playback. origin is set for postMessage security.
  const origin = typeof window !== 'undefined' ? window.location.origin : ''
  const src =
    `https://www.youtube-nocookie.com/embed/${encodeURIComponent(initialIdRef.current)}` +
    `?enablejsapi=1&autoplay=1&playsinline=1&controls=0&rel=0&fs=0&disablekb=1` +
    `&iv_load_policy=3${origin ? `&origin=${encodeURIComponent(origin)}` : ''}`

  return (
    <div
      className="fixed inset-x-0 bottom-16 lg:bottom-0 z-40 border-t-2 border-gold bg-cream shadow-[0_-8px_28px_-8px_rgba(58,20,12,0.35)] pb-[env(safe-area-inset-bottom)]"
      role="region"
      aria-label="Music player"
    >
      <div className="gold-strip" aria-hidden="true" />

      {/* ── Progress ── */}
      <div className="wrap pt-2">
        <div className="max-w-3xl mx-auto flex items-center gap-2.5">
          <span className="text-[11px] tabular-nums text-ink-soft w-9 text-right">
            {formatTime(currentTime)}
          </span>
          <input
            type="range"
            min={0}
            max={Math.max(1, Math.floor(duration))}
            value={Math.floor(currentTime)}
            onChange={(e) => seek(Number(e.target.value))}
            aria-label="Seek"
            className="flex-1 h-1.5 appearance-none rounded-full bg-paper-3 accent-maroon cursor-pointer
                       [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-3.5
                       [&::-webkit-slider-thumb]:h-3.5 [&::-webkit-slider-thumb]:rounded-full
                       [&::-webkit-slider-thumb]:bg-maroon"
            style={{ background: `linear-gradient(to right, #7A1220 ${pct}%, #ECDCC0 ${pct}%)` }}
          />
          <span className="text-[11px] tabular-nums text-ink-soft w-9">
            {duration > 0 ? formatTime(duration) : '--:--'}
          </span>
        </div>
      </div>

      <div className="wrap pb-3 pt-2">
        <div className="max-w-3xl mx-auto flex items-center gap-3 sm:gap-4">

          {/* ── The player frame (also acts as the artwork) ── */}
          <div
            className={cn(
              'relative flex-shrink-0 rounded-mj-sm overflow-hidden bg-ink/90 transition-all',
              expanded ? 'w-[220px] sm:w-[300px] aspect-video' : 'w-[104px] sm:w-[132px] aspect-video'
            )}
          >
            <iframe
              id="mj-yt-frame"
              src={src}
              title={`${currentTrack.title} — ${currentTrack.artist}`}
              className="absolute inset-0 w-full h-full"
              /* Subscribing tells YouTube to push infoDelivery updates, which
                 drive the progress bar even if the API script is blocked. */
              onLoad={(e) => {
                e.currentTarget.contentWindow?.postMessage(
                  JSON.stringify({ event: 'listening', id: 'mj-yt-frame' }),
                  'https://www.youtube-nocookie.com'
                )
              }}
              /* No allow-popups and no allow-top-navigation: the frame cannot
                 navigate away from mithilajodi.com or open a new tab. */
              sandbox="allow-scripts allow-same-origin allow-presentation"
              allow="autoplay; encrypted-media; picture-in-picture"
              referrerPolicy="strict-origin-when-cross-origin"
            />
          </div>

          {/* ── Info + controls ── */}
          <div className="flex-1 min-w-0">
            <p className="eyebrow mb-0.5 text-[10px]">
              {isDead ? 'Unavailable' : 'Now playing'}
            </p>
            <p className="font-serif text-[15px] sm:text-[16px] text-maroon leading-snug truncate">
              {currentTrack.title}
            </p>
            <p className="text-[12px] text-ink-soft truncate">
              {currentTrack.artist} · {currentTrack.festivalName}
            </p>

            {isDead && (
              <p className="text-[11.5px] text-terra mt-1 leading-snug">
                This recording can&rsquo;t be played here. Skipping to the next song.
              </p>
            )}

            <div className="flex items-center gap-1 mt-2">
              <button
                type="button" onClick={previous} disabled={!hasQueue}
                aria-label="Previous song"
                className="w-10 h-10 rounded-full text-maroon hover:bg-gold/10 disabled:opacity-35 flex items-center justify-center transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-gold"
              >
                <Icon d={PATH.prev} size={19} />
              </button>

              <button
                type="button" onClick={toggle}
                aria-label={isPlaying ? 'Pause' : 'Play'}
                className="w-12 h-12 rounded-full bg-maroon-gradient text-cream shadow-mj-xs flex items-center justify-center hover:shadow-mj-sm transition-shadow focus:outline-none focus-visible:ring-2 focus-visible:ring-gold"
              >
                <Icon d={isPlaying ? PATH.pause : PATH.play} size={21} />
              </button>

              <button
                type="button" onClick={next} disabled={!hasQueue}
                aria-label="Next song"
                className="w-10 h-10 rounded-full text-maroon hover:bg-gold/10 disabled:opacity-35 flex items-center justify-center transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-gold"
              >
                <Icon d={PATH.next} size={19} />
              </button>

              {/* Volume — desktop only; mobile uses hardware keys */}
              <div className="hidden sm:flex items-center gap-1.5 ml-2">
                <button
                  type="button" onClick={toggleMute}
                  aria-label={muted ? 'Unmute' : 'Mute'}
                  className="w-9 h-9 rounded-full text-ink-soft hover:text-maroon hover:bg-gold/10 flex items-center justify-center transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-gold"
                >
                  <Icon d={muted ? PATH.mute : PATH.vol} size={18} />
                </button>
                <input
                  type="range" min={0} max={100} value={muted ? 0 : volume}
                  onChange={(e) => setVolume(Number(e.target.value))}
                  aria-label="Volume"
                  className="w-20 h-1.5 appearance-none rounded-full bg-paper-3 cursor-pointer
                             [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-3
                             [&::-webkit-slider-thumb]:h-3 [&::-webkit-slider-thumb]:rounded-full
                             [&::-webkit-slider-thumb]:bg-maroon"
                />
              </div>

              <div className="ml-auto flex items-center gap-1">
                <button
                  type="button" onClick={() => setExpanded((v) => !v)}
                  aria-label={expanded ? 'Shrink video' : 'Enlarge video'}
                  aria-expanded={expanded}
                  className="w-9 h-9 rounded-full text-ink-soft hover:text-maroon hover:bg-gold/10 flex items-center justify-center transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-gold"
                >
                  <Icon d={expanded ? PATH.chevronDown : PATH.chevronUp} size={18} />
                </button>
                <button
                  type="button" onClick={closePlayer}
                  aria-label="Close player"
                  className="w-9 h-9 rounded-full border border-gold/40 text-maroon hover:bg-gold/10 flex items-center justify-center transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-gold"
                >
                  <Icon d={PATH.close} size={15} />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
