'use client'

import { useEffect, useRef } from 'react'

type Props = {
  /** 'active' while a calculation is in flight or being revealed. */
  intensity?: 'calm' | 'active'
}

type Star = { x: number; y: number; z: number; size: number; phase: number; warm: boolean }

/**
 * Decorative 3D starfield with inclined orbital rings — hand-written
 * perspective projection on a 2D canvas, not WebGL. Nothing drawn here is an
 * astronomical position; the calculated positions live in the charts.
 *
 * Progressive enhancement:
 *  - prefers-reduced-motion → one static frame, no animation loop;
 *  - phones, ≤4 cores, ≤4 GB memory or Save-Data → fewer stars, 30 fps cap,
 *    lower pixel density;
 *  - paused whenever the tab is hidden or the canvas is scrolled away.
 */
export default function CosmicBackdrop({ intensity = 'calm' }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const intensityRef = useRef(intensity)
  useEffect(() => {
    intensityRef.current = intensity
  }, [intensity])

  useEffect(() => {
    const canvas = canvasRef.current
    const ctx = canvas?.getContext('2d')
    if (!canvas || !ctx) return

    const reduced = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false
    const nav = navigator as Navigator & { deviceMemory?: number; connection?: { saveData?: boolean } }
    const lite =
      window.innerWidth < 768 ||
      (nav.hardwareConcurrency ?? 8) <= 4 ||
      (nav.deviceMemory ?? 8) <= 4 ||
      nav.connection?.saveData === true

    const dpr = Math.min(window.devicePixelRatio || 1, lite ? 1.25 : 1.75)
    const count = lite ? 70 : 170
    // Deterministic seed: the field looks the same on every visit, not random noise.
    let seed = 1337
    const rand = () => ((seed = (seed * 16807) % 2147483647) - 1) / 2147483646
    const stars: Star[] = Array.from({ length: count }, () => ({
      x: rand() * 2 - 1, y: rand() * 2 - 1, z: rand() * 2 - 1,
      size: 0.4 + rand() * 1.3, phase: rand() * Math.PI * 2, warm: rand() < 0.35,
    }))
    const rings = [
      { r: 0.34, tilt: 1.15, speed: 0.22, phase: 0.3 },
      { r: 0.52, tilt: 1.25, speed: 0.13, phase: 2.1 },
      { r: 0.72, tilt: 1.32, speed: 0.08, phase: 4.2 },
    ]

    let w = 0
    let h = 0
    const resize = () => {
      const rect = canvas.getBoundingClientRect()
      w = Math.max(1, rect.width)
      h = Math.max(1, rect.height)
      canvas.width = Math.round(w * dpr)
      canvas.height = Math.round(h * dpr)
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
    }
    resize()

    const draw = (t: number) => {
      const active = intensityRef.current === 'active'
      const spin = t * (active ? 0.00009 : 0.000025)
      const cx = w / 2
      const cy = h * 0.46
      const R = Math.max(w, h) * 0.62
      ctx.clearRect(0, 0, w, h)

      // Soft central glow — maroon to gold, the brand's "sun".
      const g = ctx.createRadialGradient(cx, cy, 0, cx, cy, R * 0.45)
      g.addColorStop(0, `rgba(228,197,114,${active ? 0.16 : 0.1})`)
      g.addColorStop(0.45, 'rgba(122,18,32,0.10)')
      g.addColorStop(1, 'rgba(8,11,26,0)')
      ctx.fillStyle = g
      ctx.fillRect(0, 0, w, h)

      const cos = Math.cos(spin)
      const sin = Math.sin(spin)
      for (const s of stars) {
        const x = s.x * cos - s.z * sin
        const z = s.x * sin + s.z * cos
        const p = 1.6 / (2.6 + z)
        const sx = cx + x * R * p
        const sy = cy + s.y * R * p * 0.9
        if (sx < -4 || sx > w + 4 || sy < -4 || sy > h + 4) continue
        const twinkle = reduced ? 0.8 : 0.65 + 0.35 * Math.sin(t * 0.0012 + s.phase)
        const alpha = Math.min(1, (0.25 + (1 - (z + 1) / 2) * 0.75) * twinkle * (active ? 1.15 : 1))
        ctx.fillStyle = s.warm ? `rgba(228,197,114,${alpha})` : `rgba(255,244,222,${alpha})`
        ctx.beginPath()
        ctx.arc(sx, sy, s.size * p * 1.4, 0, Math.PI * 2)
        ctx.fill()
      }

      for (const ring of rings) {
        const ct = Math.cos(ring.tilt)
        const st = Math.sin(ring.tilt)
        ctx.strokeStyle = `rgba(228,197,114,${active ? 0.26 : 0.16})`
        ctx.lineWidth = 1
        ctx.beginPath()
        for (let i = 0; i <= 96; i += 1) {
          const a = (i / 96) * Math.PI * 2
          const x0 = Math.cos(a) * ring.r
          const y0 = Math.sin(a) * ring.r * ct
          const z0 = Math.sin(a) * ring.r * st
          const x = x0 * cos - z0 * sin
          const z = x0 * sin + z0 * cos
          const p = 1.6 / (2.6 + z)
          const px = cx + x * R * p
          const py = cy + y0 * R * p
          if (i === 0) ctx.moveTo(px, py)
          else ctx.lineTo(px, py)
        }
        ctx.stroke()

        const a = ring.phase + t * 0.0004 * ring.speed * (active ? 3 : 1)
        const x0 = Math.cos(a) * ring.r
        const y0 = Math.sin(a) * ring.r * ct
        const z0 = Math.sin(a) * ring.r * st
        const x = x0 * cos - z0 * sin
        const z = x0 * sin + z0 * cos
        const p = 1.6 / (2.6 + z)
        ctx.fillStyle = 'rgba(255,236,190,0.85)'
        ctx.shadowColor = 'rgba(228,197,114,0.8)'
        ctx.shadowBlur = 8
        ctx.beginPath()
        ctx.arc(cx + x * R * p, cy + y0 * R * p, 2.2 * p * 1.6, 0, Math.PI * 2)
        ctx.fill()
        ctx.shadowBlur = 0
      }
    }

    if (reduced) {
      draw(0)
      const onResize = () => { resize(); draw(0) }
      window.addEventListener('resize', onResize)
      return () => window.removeEventListener('resize', onResize)
    }

    let raf = 0
    let last = 0
    let visible = true
    const minFrame = lite ? 1000 / 30 : 0
    const loop = (t: number) => {
      raf = requestAnimationFrame(loop)
      if (!visible || document.hidden) return
      if (minFrame && t - last < minFrame) return
      last = t
      draw(t)
    }
    raf = requestAnimationFrame(loop)

    let io: IntersectionObserver | undefined
    if ('IntersectionObserver' in window) {
      io = new IntersectionObserver(entries => { visible = entries[0]?.isIntersecting ?? true })
      io.observe(canvas)
    }
    window.addEventListener('resize', resize)
    return () => {
      cancelAnimationFrame(raf)
      io?.disconnect()
      window.removeEventListener('resize', resize)
    }
  }, [])

  return <canvas ref={canvasRef} className="kd-canvas" aria-hidden="true" />
}
