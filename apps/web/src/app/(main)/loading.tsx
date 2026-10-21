import { MemberPageSkeleton } from '@/components/ui/MemberPageSkeleton'

// Shown in the page area while a member page renders on the server; the
// (main) layout — top bar and bottom nav — stays on screen around it.
export default function MemberLoading() {
  return <MemberPageSkeleton />
}
