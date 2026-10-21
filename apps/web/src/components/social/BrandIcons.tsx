/**
 * The four official channels' own logos, in their own colours, drawn as the
 * rounded-square app icons people know from their phones. One set, used by
 * the footer and the menu, so the marks never drift apart. Decorative: the
 * link around each carries the accessible name.
 */
export type Brand = 'instagram' | 'facebook' | 'whatsapp' | 'youtube'

const WA = 'M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413Z'

export function BrandIcon({ brand, size = 44, className = '' }: { brand: Brand; size?: number; className?: string }) {
  const id = `mjb-${brand}`
  return (
    <svg width={size} height={size} viewBox="0 0 48 48" aria-hidden="true" focusable="false" className={`shrink-0 ${className}`}>
      {brand === 'instagram' && (
        <>
          <defs>
            <radialGradient id={id} cx="0.28" cy="1.02" r="1.25">
              <stop offset="0" stopColor="#FED576" />
              <stop offset=".26" stopColor="#F47133" />
              <stop offset=".61" stopColor="#BC3081" />
              <stop offset="1" stopColor="#4C63D2" />
            </radialGradient>
          </defs>
          <rect width="48" height="48" rx="11" fill={`url(#${id})`} />
          <rect x="11" y="11" width="26" height="26" rx="8" fill="none" stroke="#fff" strokeWidth="3.2" />
          <circle cx="24" cy="24" r="6.2" fill="none" stroke="#fff" strokeWidth="3.2" />
          <circle cx="31.6" cy="16.4" r="1.9" fill="#fff" />
        </>
      )}
      {brand === 'facebook' && (
        <>
          <rect width="48" height="48" rx="11" fill="#1877F2" />
          <path d="M32.6 48V30.2h5.4l.8-6.6h-6.2v-4.2c0-1.9.5-3.2 3.3-3.2H39v-5.9c-.6-.1-2.6-.3-5-.3-4.9 0-8.3 3-8.3 8.6v5h-5.6v6.6h5.6V48Z" fill="#fff" />
        </>
      )}
      {brand === 'whatsapp' && (
        <>
          <defs>
            <linearGradient id={id} x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#5FFC7B" /><stop offset="1" stopColor="#28D146" /></linearGradient>
          </defs>
          <rect width="48" height="48" rx="11" fill={`url(#${id})`} />
          <g transform="translate(10.5 10.5) scale(1.125)"><path d={WA} fill="#fff" /></g>
        </>
      )}
      {brand === 'youtube' && (
        <>
          <rect width="48" height="48" rx="11" fill="#fff" />
          <rect x="6.5" y="12.5" width="35" height="23" rx="7" fill="#FF0033" />
          <path d="M21 18.6v10.8l9.2-5.4Z" fill="#fff" />
        </>
      )}
    </svg>
  )
}
