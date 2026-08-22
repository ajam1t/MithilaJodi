import Link from 'next/link'

export type SearchCard = {
  id: string
  display_name: string
  gender: string
  age: number
  religion: string | null
  caste: string | null
  self_gotra: string | null
  mool: string | null
  gram: string | null
  height_cm: number | null
  diet: string | null
  about_snippet: string | null
  profile_complete: number
  profile_status: string
  native_place_name: string | null
  current_loc_name: string | null
  has_photo: boolean
  primary_photo_url: string | null
  // Extended fields for ProfileCard3D
  employer: string | null
  profession_detail: string | null
  education_detail: string | null
  smoking: string | null
  drinking: string | null
  maternal_gotra: string | null
  job_loc_name: string | null
  marriage_timeline: string | null
}

function CompletionDot({ pct }: { pct: number }) {
  const color =
    pct >= 70 ? 'bg-green-500' :
    pct >= 40 ? 'bg-amber-400' :
    'bg-ink/20'
  return (
    <span title={`${pct}% complete`}
      className={`inline-block w-2 h-2 rounded-full ${color}`} />
  )
}

export function ProfileCard({ card }: { card: SearchCard }) {
  const locationLine = [card.current_loc_name, card.native_place_name]
    .filter(Boolean).join(' · ')

  const communityLine = [card.caste, card.self_gotra, card.mool, card.gram]
    .filter(Boolean).join(' · ')

  return (
    <article className="card flex gap-3 p-3 hover:shadow-mj transition-shadow">
      {/* Avatar */}
      <div className="shrink-0 w-16 h-20 sm:w-20 sm:h-24 rounded-mj-sm overflow-hidden bg-cream border border-paper-3 flex items-center justify-center">
        {card.primary_photo_url ? (
          <img
            src={card.primary_photo_url}
            alt={card.display_name}
            className="w-full h-full object-cover"
          />
        ) : (
          <span className="text-2xl text-ink-soft select-none">
            {card.display_name[0]?.toUpperCase() ?? '?'}
          </span>
        )}
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2">
          <div>
            <h3 className="font-serif text-base text-ink leading-tight">
              {card.display_name}
            </h3>
            <p className="text-sm text-ink-soft mt-0.5">
              {card.age} yrs · {card.gender}
              {card.height_cm ? ` · ${card.height_cm} cm` : ''}
              {card.diet ? ` · ${card.diet.replace('_', '-')}` : ''}
            </p>
          </div>
          <div className="flex items-center gap-1.5 shrink-0">
            <CompletionDot pct={card.profile_complete} />
            {card.profile_status === 'active' && (
              <span className="text-[10px] bg-green-100 text-green-700 px-1.5 py-0.5 rounded-full font-medium">
                Active
              </span>
            )}
          </div>
        </div>

        {locationLine && (
          <p className="text-xs text-ink-soft mt-1.5">
            <span className="text-terra">📍</span> {locationLine}
          </p>
        )}

        {communityLine && (
          <p className="text-xs text-ink mt-1 truncate">{communityLine}</p>
        )}

        {card.about_snippet && (
          <p className="text-xs text-ink-soft mt-1 line-clamp-1 leading-relaxed">
            {card.about_snippet}
          </p>
        )}

        <div className="mt-2">
          <Link
            href={`/profile/${card.id}`}
            className="text-xs font-medium text-maroon hover:underline"
          >
            View profile →
          </Link>
        </div>
      </div>
    </article>
  )
}
