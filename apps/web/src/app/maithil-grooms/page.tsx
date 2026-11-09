import { MatrimonyLanding } from '@/components/seo/MatrimonyLanding'
import { pageMetadata } from '@/lib/seo'

// Same showcase and the same 15-minute refresh as /explore (signed photo URLs last an hour).
export const revalidate = 900

export const metadata = pageMetadata({
  path: '/maithil-grooms',
  title: 'Maithil Grooms — Mithila Matrimonial Profiles',
  description: 'Maithil groom profiles with gotra, mool, native place, profession and current city. Free to join, with a match score that explains itself.',
  keywords: ['Maithil groom', 'Maithil grooms', 'Maithili groom', 'Mithila groom', 'Maithil Brahmin groom', 'Maithil matrimony'],
})

export default function Page() {
  return <MatrimonyLanding kind="grooms" />
}
