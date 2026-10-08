'use client'

import { useEffect, useRef, useState } from 'react'

/**
 * Choose → adjust → confirm, for a profile photo.
 *
 * Take a photo (front camera on phones) or pick one from the gallery, then
 * rotate, zoom and drag it into a 4:5 portrait frame — the shape the profile
 * cards use — and confirm. The result is a JPEG of at most 1200 px tall, which
 * also keeps phone-camera files under the 5 MB upload limit.
 *
 * Validation happens here first, in plain words (type, size, dimensions); the
 * server checks the type again from the file's bytes and the size limit.
 *
 * HEIC/HEIF photos cannot be drawn by most browsers, so those skip the editor
 * and are uploaded as they are (the server accepts them).
 */

const MAX_INPUT_BYTES = 20 * 1024 * 1024
const MIN_SIDE = 400
const OUT_W = 960
const OUT_H = 1200
const ASPECT = OUT_W / OUT_H

type Loaded = { img: HTMLImageElement; url: string; name: string }

export function PhotoPicker({
  busy, onConfirm, onCancel, onPicked,
}: {
  busy: boolean
  onConfirm: (file: File) => void
  onCancel?: () => void
  /** Fired when a file has been chosen (for "photo upload started"). */
  onPicked?: () => void
}) {
  const cameraRef = useRef<HTMLInputElement>(null)
  const galleryRef = useRef<HTMLInputElement>(null)
  const frameRef = useRef<HTMLDivElement>(null)
  const [loaded, setLoaded] = useState<Loaded | null>(null)
  const [rotation, setRotation] = useState(0) // 0, 90, 180, 270
  const [zoom, setZoom] = useState(1)
  const [pan, setPan] = useState({ x: 0, y: 0 }) // in frame-width fractions
  const [error, setError] = useState('')
  const drag = useRef<{ x: number; y: number; px: number; py: number } | null>(null)

  useEffect(() => () => { if (loaded) URL.revokeObjectURL(loaded.url) }, [loaded])

  function reset() {
    setRotation(0); setZoom(1); setPan({ x: 0, y: 0 })
    if (cameraRef.current) cameraRef.current.value = ''
    if (galleryRef.current) galleryRef.current.value = ''
  }

  function pick(file: File | undefined) {
    setError('')
    if (!file) return
    onPicked?.()
    const heic = /image\/hei[cf]/.test(file.type) || /\.(heic|heif)$/i.test(file.name)
    if (!file.type.startsWith('image/') && !heic) { setError('That file is not a photo. Please choose a JPEG, PNG, WebP or HEIC image.'); reset(); return }
    if (file.size > MAX_INPUT_BYTES) { setError('That photo is over 20 MB. Please choose a smaller one.'); reset(); return }
    if (heic) {
      if (file.size > 5 * 1024 * 1024) { setError('HEIC photos must be under 5 MB. Please choose a JPEG or a smaller photo.'); reset(); return }
      onConfirm(file)
      reset()
      return
    }
    const url = URL.createObjectURL(file)
    const img = new Image()
    img.onload = () => {
      if (Math.min(img.naturalWidth, img.naturalHeight) < MIN_SIDE) {
        URL.revokeObjectURL(url)
        setError(`That photo is too small (${img.naturalWidth}×${img.naturalHeight}). Please choose one at least ${MIN_SIDE} pixels on each side.`)
        reset()
        return
      }
      reset()
      setLoaded({ img, url, name: file.name })
    }
    img.onerror = () => { URL.revokeObjectURL(url); setError('We could not open that photo. Please try another one.'); reset() }
    img.src = url
  }

  // Geometry: the rotated image is scaled to cover the 4:5 frame at zoom 1.
  const rotated = rotation % 180 !== 0
  const iw = loaded ? (rotated ? loaded.img.naturalHeight : loaded.img.naturalWidth) : 1
  const ih = loaded ? (rotated ? loaded.img.naturalWidth : loaded.img.naturalHeight) : 1
  const cover = Math.max(1 / iw, (1 / ASPECT) / ih) // frame width = 1
  const dispW = iw * cover * zoom // in frame widths
  const dispH = ih * cover * zoom
  const maxX = Math.max(0, (dispW - 1) / 2)
  const maxY = Math.max(0, (dispH - 1 / ASPECT) / 2)
  const clamp = (p: { x: number; y: number }) => ({ x: Math.max(-maxX, Math.min(maxX, p.x)), y: Math.max(-maxY, Math.min(maxY, p.y)) })
  const cp = clamp(pan)

  function render(): Promise<File> {
    const { img, name } = loaded!
    const canvas = document.createElement('canvas')
    canvas.width = OUT_W; canvas.height = OUT_H
    const ctx = canvas.getContext('2d')!
    ctx.fillStyle = '#fff'
    ctx.fillRect(0, 0, OUT_W, OUT_H)
    const s = OUT_W // frame width in output px
    ctx.translate(OUT_W / 2 + cp.x * s, OUT_H / 2 + cp.y * s)
    ctx.rotate((rotation * Math.PI) / 180)
    const k = cover * zoom * s
    ctx.drawImage(img, (-img.naturalWidth * k) / 2, (-img.naturalHeight * k) / 2, img.naturalWidth * k, img.naturalHeight * k)
    return new Promise((resolve, reject) => canvas.toBlob(
      b => b ? resolve(new File([b], name.replace(/\.[^.]+$/, '') + '.jpg', { type: 'image/jpeg' })) : reject(new Error('encode')),
      'image/jpeg', 0.86,
    ))
  }

  async function confirm() {
    try { onConfirm(await render()) } catch { setError('We could not prepare that photo. Please try another one.') }
  }

  const inputs = (
    <>
      <input ref={cameraRef} type="file" accept="image/*" capture="user" className="sr-only" tabIndex={-1} aria-hidden="true"
        onChange={e => pick(e.target.files?.[0])} />
      <input ref={galleryRef} type="file" accept="image/jpeg,image/png,image/webp,image/heic,image/heif" className="sr-only" tabIndex={-1} aria-hidden="true"
        onChange={e => pick(e.target.files?.[0])} />
    </>
  )

  if (!loaded) {
    return (
      <div>
        {inputs}
        <div className="grid grid-cols-2 gap-2.5">
          <button type="button" disabled={busy} onClick={() => cameraRef.current?.click()}
            className="flex flex-col items-center gap-2 rounded-mj border-2 border-dashed border-gold/50 bg-paper-2/50 px-3 py-6 text-center transition-colors hover:border-gold disabled:opacity-60">
            <svg viewBox="0 0 24 24" className="h-7 w-7 text-maroon" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M4 8h3l2-3h6l2 3h3v11H4z" /><circle cx="12" cy="13" r="3.5" />
            </svg>
            <span className="font-serif text-[16px] text-maroon">Take a photo</span>
          </button>
          <button type="button" disabled={busy} onClick={() => galleryRef.current?.click()}
            className="flex flex-col items-center gap-2 rounded-mj border-2 border-dashed border-gold/50 bg-paper-2/50 px-3 py-6 text-center transition-colors hover:border-gold disabled:opacity-60">
            <svg viewBox="0 0 24 24" className="h-7 w-7 text-maroon" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <rect x="3.5" y="4.5" width="17" height="15" rx="2" /><circle cx="9" cy="10" r="1.8" /><path d="m4 18 5-5 4 4 3-3 4 4" />
            </svg>
            <span className="font-serif text-[16px] text-maroon">{busy ? 'Uploading…' : 'Choose from gallery'}</span>
          </button>
        </div>
        <p className="mt-2 text-center text-[12px] text-ink-soft">JPEG, PNG, WebP or HEIC · at least {MIN_SIDE}×{MIN_SIDE} px</p>
        {error && <p role="alert" className="mt-3 rounded-mj-sm border border-error/30 bg-error-soft px-3 py-2 text-[13px] text-error-fg">{error}</p>}
      </div>
    )
  }

  return (
    <div>
      {inputs}
      <div
        ref={frameRef}
        className="relative mx-auto aspect-[4/5] w-full max-w-[280px] [container-type:inline-size] cursor-grab touch-none select-none overflow-hidden rounded-mj bg-paper-3 shadow-mj-xs active:cursor-grabbing"
        onPointerDown={e => { (e.target as Element).setPointerCapture?.(e.pointerId); drag.current = { x: e.clientX, y: e.clientY, px: cp.x, py: cp.y } }}
        onPointerMove={e => {
          const d = drag.current; const w = frameRef.current?.clientWidth
          if (!d || !w) return
          setPan(clamp({ x: d.px + (e.clientX - d.x) / w, y: d.py + (e.clientY - d.y) / w }))
        }}
        onPointerUp={() => { drag.current = null }}
        onPointerCancel={() => { drag.current = null }}
        role="img"
        aria-label="Photo preview. Drag to position."
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={loaded.url}
          alt=""
          draggable={false}
          className="pointer-events-none absolute left-1/2 top-1/2 max-w-none"
          style={{
            width: `${(rotated ? dispH : dispW) * 100}%`,
            transform: `translate(-50%, -50%) translate(${cp.x * 100}cqw, ${cp.y * 100}cqw) rotate(${rotation}deg)`,
          }}
        />
        <div className="pointer-events-none absolute inset-0 rounded-mj ring-1 ring-inset ring-black/10" aria-hidden="true" />
      </div>
      <p className="mt-2 text-center text-[12px] text-ink-soft">Drag to position · your face clearly visible works best</p>

      <div className="mx-auto mt-3 flex max-w-[280px] items-center gap-3">
        <label htmlFor="photo-zoom" className="text-[12px] text-ink-soft">Zoom</label>
        <input id="photo-zoom" type="range" min={1} max={3} step={0.01} value={zoom}
          onChange={e => setZoom(Number(e.target.value))} className="flex-1 accent-maroon" />
        <button type="button" onClick={() => { setRotation(r => (r + 90) % 360); setPan({ x: 0, y: 0 }) }}
          className="rounded-mj-sm border border-ink/20 px-2.5 py-1.5 text-[12.5px] text-ink hover:border-maroon" aria-label="Rotate 90 degrees">
          ↻ Rotate
        </button>
      </div>

      {error && <p role="alert" className="mt-3 rounded-mj-sm border border-error/30 bg-error-soft px-3 py-2 text-[13px] text-error-fg">{error}</p>}

      <div className="mt-4 grid grid-cols-2 gap-2.5">
        <button type="button" disabled={busy}
          onClick={() => { setLoaded(null); reset(); onCancel?.() }}
          className="btn-ghost justify-center py-2.5 text-sm">
          Choose another
        </button>
        <button type="button" disabled={busy} onClick={confirm} className="btn-primary justify-center py-2.5 text-sm disabled:opacity-60">
          {busy ? 'Uploading…' : 'Use this photo'}
        </button>
      </div>
    </div>
  )
}
