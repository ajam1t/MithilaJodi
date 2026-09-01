import type { FestivalSong } from '@/lib/festivals'
import { songLink } from '@/lib/festivals'

function NoteIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
      <circle cx="8" cy="18" r="3" />
      <circle cx="18" cy="15" r="3" />
      <path d="M11 18V6l10-2v11" strokeLinecap="round" />
    </svg>
  )
}

/**
 * Festival Songs section.
 *
 * We never host audio. Each song links out — to a curated YouTube video when a
 * `youtubeId` exists, otherwise to a YouTube search that always resolves.
 * Adding, removing or reordering songs is a data-only change in lib/festivals.ts.
 */
export function FestivalSongs({ songs, festivalName }: { songs: FestivalSong[]; festivalName: string }) {
  if (songs.length === 0) return null

  return (
    <div className="card overflow-hidden">
      <div className="gold-strip" />
      <div className="p-5 sm:p-7">
        <div className="flex items-start gap-3 mb-1.5">
          <span className="mt-0.5 text-gold flex-shrink-0"><NoteIcon /></span>
          <div>
            <h2 className="font-serif text-[21px] sm:text-[25px] text-maroon leading-tight">
              Festival Songs
            </h2>
            <p className="text-[13.5px] text-ink-soft mt-1 leading-relaxed">
              The Maithili geet that belong to {festivalName}. Tap any song to find recordings on YouTube.
            </p>
          </div>
        </div>

        <ul className="mt-5 space-y-2.5">
          {songs.map((song) => (
            <li key={song.title}>
              <a
                href={songLink(song)}
                target="_blank"
                rel="noopener noreferrer"
                className="group flex items-center gap-3.5 rounded-mj-sm border border-paper-3 bg-paper/60 p-3.5 sm:p-4
                           hover:border-gold hover:bg-cream transition-colors
                           focus:outline-none focus-visible:ring-2 focus-visible:ring-gold min-h-[64px]"
              >
                <span
                  className="flex-shrink-0 w-10 h-10 rounded-full bg-maroon-gradient text-cream
                             flex items-center justify-center shadow-mj-xs"
                  aria-hidden="true"
                >
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M8 5v14l11-7z" />
                  </svg>
                </span>

                <span className="min-w-0 flex-1">
                  <span className="block font-serif text-[16px] sm:text-[17px] text-maroon leading-snug group-hover:text-terra transition-colors">
                    {song.title}
                  </span>
                  {song.titleDeva && (
                    <span className="block font-deva text-[14px] text-ink-soft/90 leading-snug mt-0.5" lang="hi">
                      {song.titleDeva}
                    </span>
                  )}
                  <span className="block text-[12.5px] text-ink-soft leading-relaxed mt-1">
                    {song.note}
                  </span>
                </span>

                <span className="flex-shrink-0 text-ink-soft/60 group-hover:text-maroon transition-colors" aria-hidden="true">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                    <path d="M7 17L17 7M17 7H9M17 7v8" />
                  </svg>
                </span>
                <span className="sr-only">(opens YouTube in a new tab)</span>
              </a>
            </li>
          ))}
        </ul>

        <p className="text-[12px] text-ink-soft/80 mt-4 leading-relaxed">
          Mithila Jodi does not host or distribute any recordings. These links point to
          publicly available search results and videos on YouTube.
        </p>
      </div>
    </div>
  )
}
