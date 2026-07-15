import { notFound } from 'next/navigation';
import { getListingById } from '@/lib/server/listings';
import { InterceptingListingModalGate } from '@/components/common/intercepting-listing-modal-gate';
import { ListingDetailPage } from '@/views/listing-detail-page';

export default async function ListingInterceptedPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const listing = await getListingById(id).catch(() => null);
  if (!listing) notFound();

  return (
    <>
      <ListingDetailPage id={id} />
      <InterceptingListingModalGate listingId={id} />
    </>
  );
}
