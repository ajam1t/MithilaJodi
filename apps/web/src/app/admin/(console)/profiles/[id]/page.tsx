import ProfileEditor from '../ProfileEditor'

export default async function EditAdminProfilePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  return <ProfileEditor profileId={id} />
}
