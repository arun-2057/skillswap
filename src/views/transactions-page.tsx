'use client';

import { EmptyState } from '@/components/common/empty-state';
import { Handshake } from 'lucide-react';

export function TransactionsPage() {
  return (
    <div className="flex-1 mx-auto max-w-3xl px-4 sm:px-6 py-8">
      <h1 className="text-2xl sm:text-3xl font-bold mb-1">Swap Ledger</h1>
      <p className="text-muted-foreground mb-6">
        Direct exchange economy. Every entry represents a mutual value exchange of knowledge between you and a peer.
      </p>
      <EmptyState
        icon={Handshake}
        title="No swaps yet"
        description="Propose a swap to start trading skills directly with other members."
        action={undefined}
      />
    </div>
  );
}
