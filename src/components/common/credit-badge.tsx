'use client';

import { Coins } from 'lucide-react';
import { cn } from '@/lib/utils';

interface CreditBadgeProps {
  amount: number;
  size?: 'sm' | 'md';
}

export function CreditBadge({ amount, size = 'md' }: CreditBadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 font-semibold tabular-nums',
        size === 'sm' ? 'text-xs' : 'text-sm',
        amount > 0
          ? 'text-emerald-600 dark:text-emerald-400'
          : amount < 0
            ? 'text-red-600 dark:text-red-400'
            : 'text-muted-foreground'
      )}
    >
      <Coins
        className={cn(
          size === 'sm' ? 'size-3' : 'size-4',
          amount > 0
            ? 'text-emerald-600 dark:text-emerald-400'
            : amount < 0
              ? 'text-red-600 dark:text-red-400'
              : 'text-muted-foreground'
        )}
      />
      {amount > 0 ? '+' : ''}{amount}
    </span>
  );
}
