import { MatrimonyLanding } from '@/components/seo/MatrimonyLanding'
import { pageMetadata } from '@/lib/seo'

// Same showcase and the same 15-minute refresh as /explore (signed photo URLs last an hour).
export const revalidate = 900

export const metadata = pageMetadata({
  path: '/maithil-brides',
  title: 'Maithil Brides — Mithila Matrimonial Profiles',
  description: 'Maithil bride profiles with gotra, mool and native place shown. Free to join; photos and phone numbers stay under each member’s control.',
  keywords: ['Maithil bride', 'Maithil brides', 'Maithili bride', 'Mithila bride', 'Maithil Brahmin bride', 'Maithil matrimony'],
})

export default function Page() {
  return <MatrimonyLanding kind="brides" />
}
