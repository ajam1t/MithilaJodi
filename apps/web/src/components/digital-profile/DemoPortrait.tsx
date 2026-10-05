import { Paag } from '@/components/wedding/motifs'

/** The demo has no photograph of a real person — an illustrated portrait in a paag instead. */
export function DemoPortrait() {
  return (
    <svg viewBox="0 0 120 120" className="h-full w-full" role="img" aria-label="Illustrated demo portrait">
      <rect width="120" height="120" fill="#F6EBD6" />
      <circle cx="60" cy="60" r="56" fill="none" stroke="#C89B45" strokeOpacity="0.35" strokeDasharray="2 5" />
      <path d="M18 120c4-24 20-36 42-36s38 12 42 36Z" fill="#7A1220" />
      <path d="M44 88c5 8 27 8 32 0" fill="none" stroke="#E7C877" strokeWidth="2" />
      <circle cx="60" cy="62" r="19" fill="#C99A72" />
      <Paag x={60} y={40} s={0.42} ink="#5A0E19" gold="#E7C877" fill="#B8323F" />
    </svg>
  )
}
