import ProfileCardGallery3D from '@/components/ProfileCardGallery3D'
import type { SharedProfile } from '@/lib/profileShare'
import type { SearchCard } from '@/types/profile'

/*
 * "Profile Gallery" for a Digital Profile — the same ProfileCardGallery3D
 * (deck variant) the member sees on their own Profile page, not a second
 * gallery. One component for the public link, the owner's preview and the
 * owner's dashboard.
 *
 * Privacy: it is built ONLY from SharedProfile, the projection lib/profileShare
 * produces after applying the link's section choices. A field the owner did
 * not share is null here, and the deck hides empty fields — and whole faces
 * like "Looking for" when the section is off — so the gallery can never show
 * more than the rest of the page.
 */

/** Shape the shared projection for the gallery's six faces. */
export function toGalleryCard(p: SharedProfile, id: string): SearchCard {
  return {
    id,
    display_name: p.displayName,
    gender: p.gender ?? '',
    age: p.age ?? 0,
    religion: p.community?.religion ?? null,
    caste: p.community?.caste ?? null,
    self_gotra: p.community?.selfGotra ?? null,
    maternal_gotra: p.community?.maternalGotra ?? null,
    mool: p.community?.mool ?? null,
    gram: p.community?.gram ?? null,
    height_cm: p.heightCm,
    diet: p.lifestyle?.diet ?? null,
    about_snippet: p.about ? p.about.slice(0, 200) : null,
    profile_complete: 100,
    // Internal status is not a family-facing detail; empty, so the deck hides it.
    profile_status: '',
    native_place_name: p.location?.native ?? null,
    current_loc_name: p.location?.current ?? null,
    job_loc_name: p.location?.work ?? null,
    has_photo: p.photos.length > 0,
    primary_photo_url: p.photos[0] ?? null,
    employer: p.career?.employer ?? null,
    profession_detail: p.career?.detail ?? null,
    job_title: p.career?.jobTitle ?? null,
    education_detail: p.education?.detail ?? null,
    degree: p.education?.degree ?? null,
    specialization: p.education?.specialization ?? null,
    institution: p.education?.institution ?? null,
    smoking: p.lifestyle?.smoking ?? null,
    drinking: p.lifestyle?.drinking ?? null,
    marital_status: p.maritalStatus,
    marriage_timeline: p.lifestyle?.marriageTimeline ?? null,
    family_type: p.family?.type ?? null,
    preferences: p.preferences ?? null,
    // Never a score on a shared profile — there is no viewer to compare with.
    match: null,
  }
}

type Level = 'h2' | 'h3' | 'h4'

export function ProfileGallery({
  profile, id, title = 'Profile Gallery', subtitle = 'The details families see first.', h: H = 'h2', bare = false,
}: {
  profile: SharedProfile
  id: string
  title?: string
  subtitle?: string
  h?: Level
  /** No panel chrome — for pages that frame it themselves. */
  bare?: boolean
}) {
  const body = (
    <>
      <H className={bare ? 'font-serif text-[20px] text-maroon' : 'dp-panel-title'}>{title}</H>
      <p className={`text-ink-soft ${bare ? 'mt-0.5 text-[13px]' : 'mb-2 text-[12.5px]'}`}>{subtitle}</p>
      <div className={bare ? 'mt-3' : ''}>
        <ProfileCardGallery3D profile={toGalleryCard(profile, id)} variant="deck" />
      </div>
    </>
  )
  return bare
    ? <section aria-label={title}>{body}</section>
    : <section aria-label={title} className="dp-panel overflow-hidden pb-4">{body}</section>
}
