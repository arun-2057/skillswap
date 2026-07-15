import { CreateListingPage } from '@/views/create-listing-page';

export default async function CreateListingRoute({
  searchParams,
}: {
  searchParams?: Promise<{ editId?: string }>;
}) {
  const { editId } = await (searchParams ?? {});
  return <CreateListingPage editId={editId} />;
}
