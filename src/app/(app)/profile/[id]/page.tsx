import { ProfilePage } from '@/views/profile-page';

export default async function ProfileRoute({
  params,
}: {
  params: Promise<{ id?: string }>;
}) {
  const { id } = await params;
  return <ProfilePage profileId={id} />;
}
