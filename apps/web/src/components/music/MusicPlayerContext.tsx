'use client'

import {
  createContext, useCallback, useContext, useEffect, useMemo, useRef, useState,
  type ReactNode,
} from 'react'

/**
 * Global music player state for Mithila Jodi.
 *
 * Playback NEVER leaves mithilajodi.com:
 *  - Song cards are buttons that call playTrack(). There is no anchor to YouTube.
 *  - The YouTube iframe is sandboxed WITHOUT allow-popups / allow-top-navigation,
 *    so even YouTube's own "Watch on YouTube" affordance cannot navigate the
 *    browser away or open a tab.
 *  - We drive playback through the YouTube IFrame Player API, so if a video
 *    forbids embedding (error 101/150) we detect it, mark it unavailable and
 *    skip on — rather than leaving a dead frame with an escape hatch in it.
 *
 * The provider is mounted in the root layout, so state survives client-side
 * navigation between pages.
 */

export type PlayerTrack = {
  /** YouTube video id. Stored as a reference only — never used as a link. */
  youtubeId: string
  title: string
  titleDeva?: string
  artist: string
  festivalSlug: string
  festivalName: string
}

type Ctx = {
  currentTrack: PlayerTrack | null
  queue: PlayerTrack[]
  isPlaying: boolean
  isReady: boolean
  currentTime: number
  duration: number
  volume: number
  muted: boolean
  /** youtubeIds that reported an embedding/availability error. */
  unavailable: Set<string>
  playTrack: (track: PlayerTrack, queue?: PlayerTrack[]) => void
  toggle: () => void
  next: () => void
  previous: () => void
  seek: (seconds: number) => void
  setVolume: (v: number) => void
  toggleMute: () => void
  closePlayer: () => void
}

const MusicPlayerContext = createContext<Ctx | null>(null)

// ── YouTube IFrame API types (minimal) ─────────────────────────────────────
/* eslint-disable @typescript-eslint/no-explicit-any */
declare global {
  interface Window {
    YT?: any
    onYouTubeIframeAPIReady?: () => void
  }
}

let apiPromise: Promise<void> | null = null

const YT_ORIGIN = 'https://www.youtube-nocookie.com'

/**
 * Fallback control path. Because the iframe is created with `enablejsapi=1`,
 * it accepts commands over postMessage directly — no API script required.
 * This matters: youtube.com/iframe_api is commonly blocked by ad-blockers and
 * corporate networks, and without this fallback play/pause would silently die.
 */
function postToFrame(func: string, args: unknown[] = []) {
  if (typeof document === 'undefined') return
  const el = document.getElementById('mj-yt-frame') as HTMLIFrameElement | null
  el?.contentWindow?.postMessage(
    JSON.stringify({ event: 'command', func, args }),
    YT_ORIGIN
  )
}

/** Load the IFrame Player API once, lazily (nothing loads until first play). */
function loadYouTubeApi(): Promise<void> {
  if (typeof window === 'undefined') return Promise.resolve()
  if (window.YT?.Player) return Promise.resolve()
  if (apiPromise) return apiPromise

  apiPromise = new Promise<void>((resolve) => {
    const prev = window.onYouTubeIframeAPIReady
    window.onYouTubeIframeAPIReady = () => {
      prev?.()
      resolve()
    }
    const s = document.createElement('script')
    s.src = 'https://www.youtube.com/iframe_api'
    s.async = true
    document.head.appendChild(s)
  })
  return apiPromise
}

export function MusicPlayerProvider({ children }: { children: ReactNode }) {
  const [currentTrack, setCurrentTrack] = useState<PlayerTrack | null>(null)
  const [queue, setQueue] = useState<PlayerTrack[]>([])
  const [isPlaying, setIsPlaying] = useState(false)
  const [isReady, setIsReady] = useState(false)
  const [currentTime, setCurrentTime] = useState(0)
  const [duration, setDuration] = useState(0)
  const [volume, setVolumeState] = useState(100)
  const [muted, setMuted] = useState(false)
  const [unavailable, setUnavailable] = useState<Set<string>>(new Set())

  const playerRef = useRef<any>(null)
  const pendingIdRef = useRef<string | null>(null)
  const trackRef = useRef<PlayerTrack | null>(null)
  const queueRef = useRef<PlayerTrack[]>([])

  trackRef.current = currentTrack
  queueRef.current = queue

  // ── Advance helpers (declared before use in the error handler) ──
  const advance = useCallback((dir: 1 | -1) => {
    const q = queueRef.current
    const cur = trackRef.current
    if (!cur || q.length === 0) return
    const i = q.findIndex((t) => t.youtubeId === cur.youtubeId)
    if (i === -1) return
    const nextIndex = (i + dir + q.length) % q.length
    const target = q[nextIndex]
    if (!target) return
    setCurrentTrack(target)
    pendingIdRef.current = target.youtubeId
    const p = playerRef.current
    if (p?.loadVideoById) p.loadVideoById(target.youtubeId)
    else postToFrame('loadVideoById', [target.youtubeId])
    setIsPlaying(true)
  }, [])

  // ── Attach the API to our own sandboxed iframe once a track exists ──
  useEffect(() => {
    if (!currentTrack) return
    let cancelled = false

    loadYouTubeApi().then(() => {
      if (cancelled) return
      const el = document.getElementById('mj-yt-frame')
      if (!el || playerRef.current) return

      playerRef.current = new window.YT.Player(el, {
        events: {
          onReady: (e: any) => {
            setIsReady(true)
            e.target.setVolume(volume)
            // If the track changed while the API was loading, load the latest.
            const want = pendingIdRef.current
            if (want && e.target.getVideoData?.()?.video_id !== want) {
              e.target.loadVideoById(want)
            }
            e.target.playVideo()
          },
          onStateChange: (e: any) => {
            const YT = window.YT
            if (e.data === YT.PlayerState.PLAYING) setIsPlaying(true)
            else if (e.data === YT.PlayerState.PAUSED) setIsPlaying(false)
            else if (e.data === YT.PlayerState.ENDED) advance(1)
          },
          onError: (e: any) => {
            // 101 / 150 → the uploader disallows embedding.
            // 100 → removed/private. 2 / 5 → bad parameter or HTML5 issue.
            const bad = trackRef.current?.youtubeId
            if (bad) setUnavailable((s) => new Set(s).add(bad))
            console.warn('[music] playback error', e?.data, 'for', bad)
            // Skip on so the listener is never stranded on a dead frame.
            if (queueRef.current.length > 1) advance(1)
            else setIsPlaying(false)
          },
        },
      })
    })

    return () => { cancelled = true }
  }, [currentTrack, volume, advance])

  // Keep a stable handle to advance() for the message listener below.
  const advanceRef = useRef(advance)
  advanceRef.current = advance

  /**
   * Second source of truth for progress/state: an `enablejsapi=1` frame pushes
   * `infoDelivery` messages to the parent. This keeps the progress bar, duration
   * and auto-advance working even when youtube.com/iframe_api is blocked.
   */
  useEffect(() => {
    function onMessage(e: MessageEvent) {
      if (!/youtube(-nocookie)?\.com$/.test(new URL(e.origin).hostname.replace(/^www\./, ''))) return
      let data: any
      try { data = typeof e.data === 'string' ? JSON.parse(e.data) : e.data } catch { return }
      const info = data?.info
      if (data?.event !== 'infoDelivery' || !info) return

      if (typeof info.currentTime === 'number') setCurrentTime(info.currentTime)
      if (typeof info.duration === 'number' && info.duration > 0) setDuration(info.duration)
      if (typeof info.playerState === 'number') {
        if (info.playerState === 1) setIsPlaying(true)
        else if (info.playerState === 2) setIsPlaying(false)
        else if (info.playerState === 0) advanceRef.current(1) // ended
      }
    }
    window.addEventListener('message', onMessage)
    return () => window.removeEventListener('message', onMessage)
  }, [])

  // ── Progress ticker (only while playing) ──
  useEffect(() => {
    if (!isPlaying) return
    const id = window.setInterval(() => {
      const p = playerRef.current
      if (!p?.getCurrentTime) return
      const t = p.getCurrentTime() ?? 0
      const d = p.getDuration?.() ?? 0
      setCurrentTime(t)
      if (d && Number.isFinite(d)) setDuration(d)
    }, 500)
    return () => window.clearInterval(id)
  }, [isPlaying])

  // ── Public actions ──
  const playTrack = useCallback((track: PlayerTrack, nextQueue?: PlayerTrack[]) => {
    if (nextQueue) setQueue(nextQueue)
    setCurrentTrack(track)
    setCurrentTime(0)
    setDuration(0)
    pendingIdRef.current = track.youtubeId
    const p = playerRef.current
    if (p?.loadVideoById) {
      p.loadVideoById(track.youtubeId)
      p.playVideo?.()
    } else {
      // No API (blocked script, or first play before it attaches). If the frame
      // already exists, command it directly; otherwise it mounts with this id.
      postToFrame('loadVideoById', [track.youtubeId])
    }
    setIsPlaying(true)
  }, [])

  const toggle = useCallback(() => {
    const p = playerRef.current
    if (isPlaying) {
      if (p?.pauseVideo) p.pauseVideo()
      else postToFrame('pauseVideo')
      setIsPlaying(false)
    } else {
      if (p?.playVideo) p.playVideo()
      else postToFrame('playVideo')
      setIsPlaying(true)
    }
  }, [isPlaying])

  const next = useCallback(() => advance(1), [advance])
  const previous = useCallback(() => advance(-1), [advance])

  const seek = useCallback((seconds: number) => {
    const p = playerRef.current
    if (p?.seekTo) p.seekTo(seconds, true)
    else postToFrame('seekTo', [seconds, true])
    setCurrentTime(seconds)
  }, [])

  const setVolume = useCallback((v: number) => {
    const clamped = Math.max(0, Math.min(100, Math.round(v)))
    setVolumeState(clamped)
    const p = playerRef.current
    if (p?.setVolume) p.setVolume(clamped)
    else postToFrame('setVolume', [clamped])
    if (clamped > 0 && muted) {
      if (p?.unMute) p.unMute()
      else postToFrame('unMute')
      setMuted(false)
    }
  }, [muted])

  const toggleMute = useCallback(() => {
    const p = playerRef.current
    if (muted) {
      if (p?.unMute) p.unMute()
      else postToFrame('unMute')
      setMuted(false)
    } else {
      if (p?.mute) p.mute()
      else postToFrame('mute')
      setMuted(true)
    }
  }, [muted])

  const closePlayer = useCallback(() => {
    const p = playerRef.current
    try { p?.stopVideo?.() } catch { /* player may already be gone */ }
    try { p?.destroy?.() } catch { /* ignore */ }
    playerRef.current = null
    pendingIdRef.current = null
    setCurrentTrack(null)
    setQueue([])
    setIsPlaying(false)
    setIsReady(false)
    setCurrentTime(0)
    setDuration(0)
  }, [])

  const value = useMemo<Ctx>(() => ({
    currentTrack, queue, isPlaying, isReady, currentTime, duration, volume, muted,
    unavailable, playTrack, toggle, next, previous, seek, setVolume, toggleMute, closePlayer,
  }), [
    currentTrack, queue, isPlaying, isReady, currentTime, duration, volume, muted,
    unavailable, playTrack, toggle, next, previous, seek, setVolume, toggleMute, closePlayer,
  ])

  return <MusicPlayerContext.Provider value={value}>{children}</MusicPlayerContext.Provider>
}

export function useMusicPlayer(): Ctx {
  const ctx = useContext(MusicPlayerContext)
  if (!ctx) throw new Error('useMusicPlayer must be used within a MusicPlayerProvider')
  return ctx
}

/** mm:ss for the player readout. */
export function formatTime(seconds: number): string {
  if (!Number.isFinite(seconds) || seconds < 0) return '0:00'
  const m = Math.floor(seconds / 60)
  const s = Math.floor(seconds % 60)
  return `${m}:${s.toString().padStart(2, '0')}`
}
