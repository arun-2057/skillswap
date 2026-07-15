'use client';

import { AnimatePresence } from 'framer-motion';
import { InterceptingListingModal } from '@/components/common/intercepting-listing-modal';

export function ListingModalOverlay(props: { listingId?: string; sessionId?: string }) {
  // The project already has dedicated modal components for listing/session route interception.
  // This wrapper preserves the expected import path and export used by src/app/page.tsx.
  if (props.listingId) {
    return (
      <AnimatePresence>
        <InterceptingListingModal listingId={props.listingId} />
      </AnimatePresence>
    );
  }

  // Session modal reuses the same overlay component internally (it keys off route).
  // If a session-specific prop is required later, this can be extended.
  return null;
}
