import { ListingDetailPage } from '@/views/listing-detail-page';

export default async function ListingRoute({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <ListingDetailPage id={id} />;
}
