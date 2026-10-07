import { pillarFor, type Pillar } from '@/lib/journal'

/*
 * An article's cover. Real cover images are used when an article has one; until
 * then each pillar gets its own quiet Mithila line motif on a tinted ground —
 * never a stock photo standing in for the community. The box always has a fixed
 * aspect ratio, so cards never shift while images load.
 */

const TINT: Record<Pillar['motif'], { bg: string; ink: string }> = {
  kalash: { bg: '#F6E4D6', ink: '#7A1220' },
  lotus: { bg: '#EDE7D2', ink: '#1F5133' },
  fish: { bg: '#F4E2CB', ink: '#B34A24' },
  rings: { bg: '#F3E6DA', ink: '#9B2233' },
  stars: { bg: '#E7E5EE', ink: '#2E3A6E' },
  scroll: { bg: '#F4EAD3', ink: '#8A6420' },
}

function Motif({ kind }: { kind: Pillar['motif'] }) {
  switch (kind) {
    case 'kalash':
      return (
        <g>
          <path d="M38 44c-8 6-10 22 0 30h24c10-8 8-24 0-30z" />
          <path d="M40 44h20M42 38h16v6H42z" />
          <path d="M50 38c-6-6-12-6-16-4M50 38c6-6 12-6 16-4M50 38V26" />
          <circle cx="50" cy="58" r="5" />
        </g>
      )
    case 'lotus':
      return (
        <g>
          <path d="M50 30c-8 10-8 22 0 32 8-10 8-22 0-32z" />
          <path d="M50 62c-12-2-20-12-22-22 10 0 18 8 22 22zM50 62c12-2 20-12 22-22-10 0-18 8-22 22z" />
          <path d="M30 66h40M36 72h28" />
        </g>
      )
    case 'fish':
      return (
        <g>
          <path d="M26 50c10-14 32-14 42 0-10 14-32 14-42 0z" />
          <path d="M68 50l10-9v18z" />
          <circle cx="36" cy="48" r="2.2" />
          <path d="M44 42v16M50 41v18M56 42v16" />
        </g>
      )
    case 'rings':
      return (
        <g>
          <circle cx="42" cy="54" r="13" />
          <circle cx="58" cy="54" r="13" />
          <path d="M42 41l-4-6h8zM58 41l-4-6h8z" />
        </g>
      )
    case 'stars':
      return (
        <g>
          <path d="M44 32a20 20 0 1 0 22 28 16 16 0 1 1-22-28z" />
          <path d="M64 30l2 5 5 2-5 2-2 5-2-5-5-2 5-2z" />
          <circle cx="72" cy="50" r="1.5" />
          <circle cx="30" cy="34" r="1.5" />
        </g>
      )
    case 'scroll':
      return (
        <g>
          <path d="M34 30h32v40H34z" />
          <path d="M40 40h20M40 47h20M40 54h14M40 61h17" />
          <path d="M30 30h8M62 70h8" />
        </g>
      )
  }
}

export function ArticleCover({
  coverUrl,
  categorySlug,
  title,
  ratio = 'aspect-[16/9]',
  eager = false,
  className = '',
}: {
  coverUrl: string | null
  categorySlug: string | null | undefined
  title: string
  ratio?: string
  eager?: boolean
  className?: string
}) {
  if (coverUrl) {
    return (
      <div className={`${ratio} overflow-hidden bg-paper-2 ${className}`}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={coverUrl}
          alt={title}
          className="h-full w-full object-cover"
          loading={eager ? 'eager' : 'lazy'}
          decoding="async"
        />
      </div>
    )
  }
  const kind = pillarFor(categorySlug)?.motif ?? 'lotus'
  const t = TINT[kind]
  return (
    <div className={`${ratio} relative overflow-hidden ${className}`} style={{ background: t.bg }} aria-hidden="true">
      <svg viewBox="0 0 160 90" preserveAspectRatio="xMidYMid slice" className="absolute inset-0 h-full w-full">
        <g fill="none" stroke={t.ink} strokeOpacity=".16" strokeWidth=".8">
          {/* A double Mithila border, drawn inset like aripan around a threshold. */}
          <rect x="6" y="6" width="148" height="78" rx="3" />
          <rect x="10" y="10" width="140" height="70" rx="2" strokeDasharray="2 3" />
        </g>
        <g fill={t.ink} fillOpacity=".12">
          {[18, 142].map(x => [18, 72].map(y => <circle key={`${x}-${y}`} cx={x} cy={y} r="2.4" />))}
        </g>
        <g transform="translate(45 9) scale(.7)" fill="none" stroke={t.ink} strokeOpacity=".55" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <Motif kind={kind} />
        </g>
      </svg>
    </div>
  )
}
