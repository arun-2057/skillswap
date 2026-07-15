'use client';

import { useEffect, useState } from 'react';
import { InterceptingListingModal } from '@/components/common/intercepting-listing-modal';

interface InterceptingListingModalGateProps {
  listingId: string;
}

/**
 * Shows the intercepting modal only for client transitions from the browse grid.
 * On hard refresh, the sessionStorage flag won't exist, so the modal won't open.
 */
export function InterceptingListingModalGate({
  listingId,
}: InterceptingListingModalGateProps) {
  const [shouldOpen, setShouldOpen] = useState(false);

  useEffect(() => {
    const key = `modal:listing:${listingId}`;
    try {
      const flag = window.sessionStorage.getItem(key);
      if (flag === '1') {
        setShouldOpen(true);
      }
      window.sessionStorage.removeItem(key);
    } catch {
      // If sessionStorage is unavailable, default to full page.
    }
  }, [listingId]);

  if (!shouldOpen) return null;

  return <InterceptingListingModal listingId={listingId} />;
}
