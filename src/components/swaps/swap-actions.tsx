'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { handleUpdateSwapStatus } from '@/app/actions/update-swap-status';
import { Button } from '@/components/ui/button';
import { Check, X, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

interface SwapActionsProps {
  swapId: string;
  onSuccess?: (conversationId?: string) => void;
}

export function SwapActions({ swapId, onSuccess }: SwapActionsProps) {
  const router = useRouter();
  const [isAccepting, setIsAccepting] = useState(false);
  const [isDeclining, setIsDeclining] = useState(false);

  async function onAccept() {
    if (isAccepting || isDeclining) return;
    setIsAccepting(true);
    try {
      const result = await handleUpdateSwapStatus(swapId, 'accepted');
      if (result.success) {
        toast.success('Swap accepted');
        if (result.conversationId) {
          router.push(`/messages?conversationId=${result.conversationId}`);
        } else {
          router.refresh();
        }
        onSuccess?.(result.conversationId ?? undefined);
      } else {
        toast.error(result.error || 'Failed to accept swap');
      }
    } catch {
      toast.error('Something went wrong while accepting the swap');
    } finally {
      setIsAccepting(false);
    }
  }

  async function onDecline() {
    if (isAccepting || isDeclining) return;
    setIsDeclining(true);
    try {
      const result = await handleUpdateSwapStatus(swapId, 'declined');
      if (result.success) {
        toast.success('Swap declined');
        router.refresh();
      } else {
        toast.error(result.error || 'Failed to decline swap');
      }
    } catch {
      toast.error('Something went wrong while declining the swap');
    } finally {
      setIsDeclining(false);
    }
  }

  return (
    <div className="flex gap-2">
      <Button size="sm" variant="ghost" onClick={onDecline} disabled={isAccepting || isDeclining} className="text-destructive hover:bg-destructive/10">
        {isDeclining ? <Loader2 className="h-4 w-4 animate-spin" /> : <X className="h-4 w-4 mr-1" />} Reject
      </Button>
      <Button size="sm" onClick={onAccept} disabled={isAccepting || isDeclining} className="bg-emerald-600 hover:bg-emerald-700 text-white">
        {isAccepting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4 mr-1" />} Accept Trade
      </Button>
    </div>
  );
}
