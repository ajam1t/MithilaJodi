import Link from 'next/link'
import type { Festival } from '@/lib/festivals'

/**
 * Compact "Songs of [Festival]" section for a festival detail page.
 * Deliberately shows only a taste — the full library lives at
 * /festival-songs/[slug] so the festival page stays uncluttered.
 */
export function FestivalSongsTeaser({ festival }: { festival: Festival }) {
  if (festival.songs.length === 0) return null

  const short = festival.name.split('—')[0].trim()
  const preview = festival.songs.slice(0, 3)

  return (
    <div className="card overflow-hidden">
      <div className="gold-strip" />
      <div className="p-5 sm:p-6">
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0">
            <h2 className="font-serif text-[20px] sm:text-[24px] text-maroon leading-tight flex items-center gap-2">
              <span aria-hidden="true">🎵</span>
              Songs of {short}
            </h2>
            <p className="text-[13.5px] text-ink-soft mt-1 leading-relaxed">
              {festival.songs.length} Maithili recordings — play them without leaving Mithila Jodi.
            </p>
          </div>
        </div>

        <ul className="mt-4 space-y-1.5">
          {preview.map((song) => (
            <li key={song.youtubeId} className="flex items-start gap-2.5 text-[14px]">
              <span className="mt-[7px] flex-shrink-0 w-1.5 h-1.5 rounded-full bg-gold" aria-hidden="true" />
              <span className="min-w-0">
                <span className="text-ink">{song.title}</span>
                <span className="text-ink-soft"> · {song.artist}</span>
              </span>
            </li>
          ))}
          {festival.songs.length > preview.length && (
            <li className="text-[13px] text-ink-soft pl-4">
              +{festival.songs.length - preview.length} more
            </li>
          )}
        </ul>

        <Link
          href={`/festival-songs/${festival.slug}`}
          className="btn-primary btn-sm mt-5 w-full sm:w-auto justify-center"
        >
          Explore All Songs →
        </Link>
      </div>
    </div>
  )
}
