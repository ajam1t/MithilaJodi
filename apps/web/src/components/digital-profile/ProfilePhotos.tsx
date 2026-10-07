import '@/styles/digital-profile.css'
import { SharedPhotoCarousel } from '@/components/SharedPhotoCarousel'
import { DemoPortrait } from '@/components/digital-profile/DemoPortrait'

/**
 * A member's photographs, presented the Digital Profile way: the 3D photo deck
 * (large centre photo, others behind, arrows, dots, "2 / 3") for two or more,
 * a single framed portrait for one, and nothing at all for none — the Profile
 * Gallery cards below carry the page without a placeholder face.
 *
 * Shared by the Digital Profile (/p, preview, sample) and the member profile
 * page, so both look the same. It renders only the URLs it is given; deciding
 * which photos a viewer may see is the caller's job (see approvedPhotoUrls).
 */
export function ProfilePhotos({
  photos, name, demo = false, style,
}: {
  photos: string[]
  name: string
  /** The fictional sample: shows the illustrated portrait when it has no photo. */
  demo?: boolean
  style?: React.CSSProperties
}) {
  if (photos.length > 1) {
    return (
      <div className="dp-rise" style={style}>
        <SharedPhotoCarousel photos={photos} name={name} />
      </div>
    )
  }
  if (photos.length === 1 || demo) {
    return (
      <figure className="dp-rise mx-auto w-[72%] max-w-[300px]" style={style}>
        <div className="aspect-[4/5] overflow-hidden rounded-[20px] border border-gold/45 bg-paper-2 shadow-mj-sm">
          {photos[0] ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={photos[0]} alt={`${name}, photograph`} className="h-full w-full object-cover object-[center_30%]" />
          ) : <DemoPortrait />}
        </div>
      </figure>
    )
  }
  return null
}
